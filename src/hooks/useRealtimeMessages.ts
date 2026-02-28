"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
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

    const channel = supabase
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

            if (sender) {
              addMessage({
                ...newMessage,
                sender,
                reply_message: replyMessage,
              } as MessageWithSender);
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
          updateMessage(payload.new.id, payload.new);
        }
      )
      .subscribe();

    // Broadcast channel for reaction sync (works without table-level Realtime)
    const reactionChannel = supabase
      .channel(`reaction-sync:${conversationId}`)
      .on(
        "broadcast",
        { event: "reaction_update" },
        async (payload: { payload: { message_id: string } }) => {
          const messageId = payload.payload?.message_id;
          if (!messageId) return;

          // Fetch updated reactions for this message
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

    // Store reference so broadcastReactionUpdate can use it
    reactionChannelRef = reactionChannel;

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(reactionChannel);
      reactionChannelRef = null;
    };
    // addMessage and updateMessage are stable zustand selectors
  }, [conversationId, addMessage, updateMessage]);
}
