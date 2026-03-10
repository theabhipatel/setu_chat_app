"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { playNotificationSound } from "@/lib/notification-sound";
import type { MessageWithSender } from "@/types";

// Shared reference to the reaction broadcast channel so MessageBubble can use it
let reactionChannelRef: ReturnType<
  ReturnType<typeof createClient>["channel"]
> | null = null;

export function broadcastReactionUpdate(messageId: string) {
  if (reactionChannelRef) {
    reactionChannelRef.send({
      type: "broadcast",
      event: "reaction_update",
      payload: { message_id: messageId },
    });
  }
}

export function useRealtimeMessages(conversationId: string | null) {
  const addMessage = useChatStore((state) => state.addMessage);
  const updateMessage = useChatStore((state) => state.updateMessage);
  const { user } = useAuthStore();
  const userIdRef = useRef<string | null>(null);

  // Keep ref in sync
  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user?.id]);

  useEffect(() => {
    if (!conversationId) return;

    const supabase = createClient();

    // ─── Message channel: INSERT + UPDATE ───
    const messageChannel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload: { new: MessageWithSender }) => {
          const newMessage = payload.new;
          if (newMessage.sender_id !== userIdRef.current) {
            // Fetch sender info
            const { data: sender } = await supabase
              .from("profiles")
              .select(
                "id, username, first_name, last_name, avatar_url, is_online"
              )
              .eq("id", newMessage.sender_id)
              .single();

            // Fetch reply message info if this is a reply
            let replyMessage = undefined;
            if (newMessage.reply_to) {
              const { data: replyData } = await supabase
                .from("messages")
                .select(
                  `
                  id, content, message_type, sender_id,
                  sender:profiles(id, username, first_name, last_name, avatar_url)
                `
                )
                .eq("id", newMessage.reply_to)
                .single();

              if (replyData) {
                replyMessage = replyData;
              }
            }

            // Fetch forwarded message info if this is a forward
            let forwardedMessage = undefined;
            if (newMessage.forwarded_from) {
              const { data: fwdData } = await supabase
                .from("messages")
                .select(
                  `
                  id, content, message_type, sender_id, created_at,
                  sender:profiles(id, username, first_name, last_name, avatar_url)
                `
                )
                .eq("id", newMessage.forwarded_from)
                .single();

              if (fwdData) {
                forwardedMessage = fwdData;
              }
            }

            if (sender) {
              addMessage({
                ...newMessage,
                sender,
                reply_message: replyMessage,
                forwarded_message: forwardedMessage,
              } as MessageWithSender);

              // Play notification sound for incoming messages
              playNotificationSound();

              // Since we're actively viewing this conversation, update our read receipt
              // (reading implies delivery, so set both timestamps)
              supabase
                .from("read_receipts")
                .upsert(
                  {
                    conversation_id: conversationId,
                    user_id: userIdRef.current!,
                    last_read_message_id: newMessage.id,
                    last_read_at: new Date().toISOString(),
                    delivered_at: new Date().toISOString(),
                  },
                  { onConflict: "conversation_id,user_id" }
                )
                .then(() => {
                  // The read_receipts postgres_changes listener on the sender's
                  // side will pick this up and update the status automatically
                });
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: { new: MessageWithSender }) => {
          // Preserve client-side status when merging DB updates
          const existing = useChatStore
            .getState()
            .messages.find((m) => m.id === payload.new.id);
          updateMessage(payload.new.id, {
            ...payload.new,
            status: existing?.status, // keep existing status
          });
        }
      )
      .subscribe();

    // ─── Read receipts listener: track when OTHER users read/receive our messages ───
    // This fires whenever any user in this conversation updates their read_receipt
    const readReceiptChannel = supabase
      .channel(`read-receipts:${conversationId}`)
      .on(
        "postgres_changes" as "system",
        {
          event: "*",
          schema: "public",
          table: "read_receipts",
          filter: `conversation_id=eq.${conversationId}`,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const receipt = payload.new as {
            user_id: string;
            last_read_at: string | null;
            delivered_at: string | null;
            conversation_id: string;
          };
          if (!receipt?.user_id) return;
          // Only care about OTHER users' receipts
          if (receipt.user_id === userIdRef.current) return;

          const store = useChatStore.getState();
          const messages = store.messages;
          const conversation = store.activeConversation;
          const isGroup = conversation?.type === "group";

          // Get all other members (for group receipt computations)
          const otherMembers = (conversation?.members || [])
            .filter((m) => m.user_id !== userIdRef.current)
            .map((m) => ({
              user_id: m.user_id,
              first_name: m.profile.first_name,
              last_name: m.profile.last_name,
            }));

          messages.forEach((msg) => {
            if (
              msg.sender_id !== userIdRef.current ||
              msg.status === "failed" ||
              msg.id.startsWith("temp-")
            ) {
              return;
            }

            if (isGroup) {
              // ── GROUP CHAT ──
              // Update the receipt detail for this specific user
              const currentDetails = msg.receiptDetails || otherMembers.map((m) => ({
                user_id: m.user_id,
                first_name: m.first_name,
                last_name: m.last_name,
                status: "sent" as const,
              }));

              const updatedDetails = currentDetails.map((detail) => {
                if (detail.user_id === receipt.user_id) {
                  if (receipt.last_read_at && msg.created_at <= receipt.last_read_at) {
                    return { ...detail, status: "read" as const };
                  } else if (receipt.delivered_at && msg.created_at <= receipt.delivered_at) {
                    return { ...detail, status: "delivered" as const };
                  }
                  // Neither read nor delivered for this message
                  return detail;
                }
                return detail;
              });

              // Compute aggregate status
              let aggregateStatus: "sent" | "delivered" | "read" = "sent";
              if (updatedDetails.every((d) => d.status === "read")) {
                aggregateStatus = "read";
              } else if (
                updatedDetails.every(
                  (d) => d.status === "read" || d.status === "delivered"
                )
              ) {
                aggregateStatus = "delivered";
              }

              updateMessage(msg.id, {
                status: aggregateStatus,
                receiptDetails: updatedDetails,
              });
            } else {
              // ── PRIVATE CHAT ──
              if (receipt.last_read_at && msg.created_at <= receipt.last_read_at) {
                if (msg.status !== "read") {
                  updateMessage(msg.id, { status: "read" });
                }
              } else if (receipt.delivered_at && msg.created_at <= receipt.delivered_at) {
                if (msg.status !== "read" && msg.status !== "delivered") {
                  updateMessage(msg.id, { status: "delivered" });
                }
              }
            }
          });
        }
      )
      .subscribe();

    // ─── Reaction sync channel (broadcast) ───
    const reactionChannel = supabase
      .channel(`reaction-sync:${conversationId}`)
      .on(
        "broadcast",
        { event: "reaction_update" },
        async (payload: { payload: { message_id: string } }) => {
          const messageId = payload.payload?.message_id;
          if (!messageId) return;

          const { data: reactions } = await supabase
            .from("message_reactions")
            .select("id, message_id, user_id, reaction, created_at")
            .eq("message_id", messageId);

          if (reactions) {
            updateMessage(messageId, { reactions });
          }
        }
      )
      .subscribe();

    reactionChannelRef = reactionChannel;

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(readReceiptChannel);
      supabase.removeChannel(reactionChannel);
      reactionChannelRef = null;
    };
  }, [conversationId, addMessage, updateMessage]);
}
