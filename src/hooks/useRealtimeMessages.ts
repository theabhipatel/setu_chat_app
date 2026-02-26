"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import type { MessageWithSender } from "@/types";

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
        (payload: { new: MessageWithSender }) => {
          const newMessage = payload.new;
          if (newMessage.sender_id !== userIdRef.current) {
            // Fetch sender info
            supabase
              .from("profiles")
              .select(
                "id, username, first_name, last_name, avatar_url, is_online"
              )
              .eq("id", newMessage.sender_id)
              .single()
              .then(({ data: sender }) => {
                if (sender) {
                  addMessage({
                    ...newMessage,
                    sender,
                  } as MessageWithSender);
                }
              });
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

    return () => {
      supabase.removeChannel(channel);
    };
    // addMessage and updateMessage are stable zustand selectors
  }, [conversationId, addMessage, updateMessage]);
}
