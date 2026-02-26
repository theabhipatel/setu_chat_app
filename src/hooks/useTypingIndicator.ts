"use client";

import { useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";

export function useTypingIndicator(conversationId: string | null) {
  const typingUsers = useChatStore((state) => state.typingUsers);
  const addTypingUser = useChatStore((state) => state.addTypingUser);
  const removeTypingUser = useChatStore((state) => state.removeTypingUser);
  const setTypingUsers = useChatStore((state) => state.setTypingUsers);
  const { user } = useAuthStore();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const channelRef = useRef<ReturnType<
    ReturnType<typeof createClient>["channel"]
  >>();
  const userIdRef = useRef<string | null>(null);

  // Keep ref in sync
  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user?.id]);

  // Send typing status
  const sendTyping = useCallback(() => {
    if (!conversationId || !userIdRef.current || !channelRef.current) return;

    const userId = userIdRef.current;
    const username =
      useAuthStore.getState().user?.username ||
      useAuthStore.getState().user?.first_name ||
      "";

    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: {
        user_id: userId,
        username,
        timestamp: Date.now(),
      },
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to send stop typing
    typingTimeoutRef.current = setTimeout(() => {
      channelRef.current?.send({
        type: "broadcast",
        event: "stop_typing",
        payload: { user_id: userId },
      });
    }, 3000);
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;

    const supabase = createClient();
    const channel = supabase.channel(`typing:${conversationId}`);
    const currentUserId = userIdRef.current;

    channel
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload.user_id !== currentUserId) {
          addTypingUser(payload);

          // Auto-remove after 4 seconds
          setTimeout(() => {
            removeTypingUser(payload.user_id);
          }, 4000);
        }
      })
      .on("broadcast", { event: "stop_typing" }, ({ payload }) => {
        removeTypingUser(payload.user_id);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      setTypingUsers([]);
    };
    // Using stable zustand selectors — won't cause re-subscriptions
  }, [conversationId, addTypingUser, removeTypingUser, setTypingUsers]);

  return { typingUsers, sendTyping };
}
