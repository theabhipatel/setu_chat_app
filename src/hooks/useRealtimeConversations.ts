"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { useBrowserNotification } from "@/hooks/useBrowserNotification";
import type { ConversationWithDetails, MessageWithSender } from "@/types";

/**
 * Returns a display title and message body for a notification.
 */
function getNotificationInfo(
  conversation: ConversationWithDetails | undefined,
  senderName: string,
  messageContent: string | null,
  messageType: string
): { title: string; body: string } {
  // Determine the message body text
  let body = messageContent || "";
  if (!messageContent) {
    if (messageType === "image") body = "📷 Sent an image";
    else if (messageType === "file") body = "📎 Sent a file";
    else body = "Sent a message";
  }

  // For group chats, show "Sender in GroupName"
  if (conversation?.type === "group") {
    const groupName = conversation.name || "Group Chat";
    return { title: `${senderName} in ${groupName}`, body };
  }

  // For private chats, just show the sender name
  return { title: senderName, body };
}

/**
 * Subscribes to realtime changes to keep the sidebar conversation list
 * up-to-date. Conversations only appear for the other user when the
 * first message is sent (not when the conversation is created).
 */
export function useRealtimeConversations() {
  const { user } = useAuthStore();
  const addConversation = useChatStore((state) => state.addConversation);
  const updateConversation = useChatStore((state) => state.updateConversation);
  const removeConversation = useChatStore((state) => state.removeConversation);
  const incrementUnreadCount = useChatStore(
    (state) => state.incrementUnreadCount
  );
  const { showNotification, isDocumentVisibleRef } = useBrowserNotification();
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user?.id]);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;

    const supabase = createClient();

    // Listen for when user is removed from a conversation
    const membersChannel = supabase
      .channel("realtime-conversation-members")
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "conversation_members",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          removeConversation(payload.old.conversation_id);
        }
      )
      .subscribe();

    // Listen for conversation metadata updates (name, avatar, etc.)
    const conversationsChannel = supabase
      .channel("realtime-conversations")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
        },
        (payload) => {
          const updated = payload.new;
          const existingConversations =
            useChatStore.getState().conversations;
          if (existingConversations.some((c) => c.id === updated.id)) {
            updateConversation(updated.id, {
              last_message_at: updated.last_message_at,
              name: updated.name,
              description: updated.description,
              avatar_url: updated.avatar_url,
            });
          }
        }
      )
      .subscribe();

    // Listen for new messages — this is the primary driver for sidebar updates.
    // When a new message arrives:
    //   - If conversation is already in sidebar → update last_message preview + increment unread
    //   - If conversation is NOT in sidebar → fetch full conversation and add it (this handles
    //     the case where someone else starts a new chat with you)
    const messagesChannel = supabase
      .channel("realtime-sidebar-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const newMessage = payload.new;
          const currentUserId = userIdRef.current;
          const existingConversations =
            useChatStore.getState().conversations;
          const conversation = existingConversations.find(
            (c) => c.id === newMessage.conversation_id
          );

          // Fetch sender info for the last message preview
          const { data: sender } = await supabase
            .from("profiles")
            .select("id, username, first_name, last_name, avatar_url")
            .eq("id", newMessage.sender_id)
            .single();

          if (conversation) {
            // Conversation exists in sidebar — update last message preview
            updateConversation(newMessage.conversation_id, {
              last_message: {
                ...newMessage,
                sender: sender || undefined,
              } as MessageWithSender,
              last_message_at: newMessage.created_at,
            } as Partial<ConversationWithDetails>);

            // Increment unread count if the message is from someone else
            // and this conversation is NOT the active one
            const activeConversation =
              useChatStore.getState().activeConversation;
            const isActiveChat =
              activeConversation?.id === newMessage.conversation_id;
            const isTabVisible = isDocumentVisibleRef.current;

            if (
              newMessage.sender_id !== currentUserId &&
              !isActiveChat
            ) {
              incrementUnreadCount(newMessage.conversation_id);

              // Mark as delivered — our browser received the message even though
              // we're not viewing that conversation. Only sets delivered_at,
              // does NOT set last_read_at (so it won't falsely show as "read").
              const now = new Date().toISOString();
              supabase
                .from("read_receipts")
                .update({ delivered_at: now })
                .eq("conversation_id", newMessage.conversation_id)
                .eq("user_id", currentUserId!)
                .then(async ({ count }) => {
                  // If no row was updated (user never opened this chat before),
                  // insert a new delivery-only receipt
                  if (count === 0) {
                    await supabase.from("read_receipts").insert({
                      conversation_id: newMessage.conversation_id,
                      user_id: currentUserId!,
                      delivered_at: now,
                    });
                  }
                });
            }

            // Show browser notification if:
            // 1. Message is from someone else
            // 2. Not a self-conversation (Saved Messages)
            // 3. Either the chat is not active OR the tab is not visible
            if (
              newMessage.sender_id !== currentUserId &&
              conversation.type !== "self" &&
              (!isActiveChat || !isTabVisible)
            ) {
              const senderName = sender
                ? `${sender.first_name} ${sender.last_name}`.trim() || sender.username
                : "Someone";

              const { title, body } = getNotificationInfo(
                conversation,
                senderName,
                newMessage.content,
                newMessage.message_type
              );

              showNotification(title, body, newMessage.conversation_id);
            }
          } else {
            // Conversation NOT in sidebar — this means someone started a new
            // chat with us. Only add it now (on first message, not on creation).
            // First check if we're actually a member of this conversation
            try {
              const res = await fetch(
                `/api/conversations/${newMessage.conversation_id}`
              );
              const data = await res.json();
              if (data.data) {
                const newConv = data.data as ConversationWithDetails;
                // Set last message and unread count
                newConv.last_message = {
                  ...newMessage,
                  sender: sender || undefined,
                } as MessageWithSender;
                if (newMessage.sender_id !== currentUserId) {
                  newConv.unread_count = 1;
                }
                addConversation(newConv);

                // Show browser notification for new conversation messages
                if (
                  newMessage.sender_id !== currentUserId &&
                  newConv.type !== "self"
                ) {
                  const senderName = sender
                    ? `${sender.first_name} ${sender.last_name}`.trim() || sender.username
                    : "Someone";

                  const { title, body } = getNotificationInfo(
                    newConv,
                    senderName,
                    newMessage.content,
                    newMessage.message_type
                  );

                  showNotification(title, body, newMessage.conversation_id);
                }
              }
            } catch (error) {
              console.error("Failed to fetch new conversation:", error);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(membersChannel);
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [
    user?.id,
    addConversation,
    updateConversation,
    removeConversation,
    incrementUnreadCount,
    showNotification,
    isDocumentVisibleRef,
  ]);
}
