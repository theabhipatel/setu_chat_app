"use client";

import { useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";

const TYPING_THROTTLE_MS = 2000; // Only broadcast "typing" at most every 2s
const STOP_TYPING_DELAY_MS = 3000; // Send "stop_typing" after 3s of inactivity
const AUTO_REMOVE_MS = 4000; // Receiver removes indicator after 4s without refresh

export function useTypingIndicator(conversationId: string | null) {
  const typingUsers = useChatStore((state) => state.typingUsers);
  const addTypingUser = useChatStore((state) => state.addTypingUser);
  const removeTypingUser = useChatStore((state) => state.removeTypingUser);
  const setTypingUsers = useChatStore((state) => state.setTypingUsers);
  const { user } = useAuthStore();

  const stopTypingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const lastSentRef = useRef<number>(0); // timestamp of last "typing" broadcast
  const channelRef = useRef<ReturnType<
    ReturnType<typeof createClient>["channel"]
  >>();
  const userIdRef = useRef<string | null>(null);

  // Per-user auto-removal timers (receiver side)
  const removalTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  // Keep ref in sync
  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user?.id]);

  // Send typing status — throttled to at most once per TYPING_THROTTLE_MS
  const sendTyping = useCallback(() => {
    if (!conversationId || !userIdRef.current || !channelRef.current) return;

    const userId = userIdRef.current;
    const now = Date.now();

    // Throttle: only send "typing" broadcast if enough time has passed
    if (now - lastSentRef.current >= TYPING_THROTTLE_MS) {
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
          timestamp: now,
        },
      });

      lastSentRef.current = now;
    }

    // Always reset the "stop typing" timeout on every keystroke
    if (stopTypingTimeoutRef.current) {
      clearTimeout(stopTypingTimeoutRef.current);
    }

    stopTypingTimeoutRef.current = setTimeout(() => {
      channelRef.current?.send({
        type: "broadcast",
        event: "stop_typing",
        payload: { user_id: userId },
      });
      // Reset lastSent so next keystroke after a pause broadcasts immediately
      lastSentRef.current = 0;
    }, STOP_TYPING_DELAY_MS);
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

          // Clear any existing removal timer for this user
          const existingTimer = removalTimersRef.current.get(payload.user_id);
          if (existingTimer) {
            clearTimeout(existingTimer);
          }

          // Set a fresh auto-removal timer
          const timer = setTimeout(() => {
            removeTypingUser(payload.user_id);
            removalTimersRef.current.delete(payload.user_id);
          }, AUTO_REMOVE_MS);

          removalTimersRef.current.set(payload.user_id, timer);
        }
      })
      .on("broadcast", { event: "stop_typing" }, ({ payload }) => {
        removeTypingUser(payload.user_id);

        // Also clear the auto-removal timer since we got an explicit stop
        const existingTimer = removalTimersRef.current.get(payload.user_id);
        if (existingTimer) {
          clearTimeout(existingTimer);
          removalTimersRef.current.delete(payload.user_id);
        }
      })
      .subscribe();

    channelRef.current = channel;

    // Capture ref value for cleanup
    const removalTimers = removalTimersRef.current;

    return () => {
      supabase.removeChannel(channel);
      setTypingUsers([]);

      // Clear all removal timers on cleanup
      removalTimers.forEach((timer) => clearTimeout(timer));
      removalTimers.clear();
    };
    // Using stable zustand selectors — won't cause re-subscriptions
  }, [conversationId, addTypingUser, removeTypingUser, setTypingUsers]);

  return { typingUsers, sendTyping };
}
