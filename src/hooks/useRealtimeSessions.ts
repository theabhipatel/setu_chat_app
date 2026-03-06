"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";
import { getSessionToken, getCurrentSessionId } from "@/lib/session-manager";
import type { UserSession } from "@/types";

interface UseRealtimeSessionsOptions {
  onNewLogin: (session: UserSession) => void;
  onSessionRevoked: () => void;
}

/**
 * Module-level set to track session IDs we are currently revoking ourselves.
 * Session IDs are added before the delete API call and removed after a delay.
 */
const locallyRevokedIds = new Set<string>();

/**
 * Mark a session ID as being revoked by us (call BEFORE the delete API call).
 * The ID is automatically cleared after 10 seconds.
 */
export function markSessionAsRevoking(sessionId: string) {
  locallyRevokedIds.add(sessionId);
  setTimeout(() => locallyRevokedIds.delete(sessionId), 10_000);
}

/**
 * Mark ALL sessions (except current) as being revoked by us.
 * Call with the list of session IDs that will be deleted.
 */
export function markMultipleSessionsAsRevoking(sessionIds: string[]) {
  for (const id of sessionIds) {
    markSessionAsRevoking(id);
  }
}

/**
 * Flag to globally suppress sign-out from realtime DELETE events.
 * Used during bulk "sign out all others" operations.
 */
let suppressSignOut = false;

export function setSuppressSignOut(value: boolean) {
  suppressSignOut = value;
}

/**
 * Subscribe to real-time changes on user_sessions for the current user.
 * - On INSERT with a different token → new login detected → show banner
 * - On DELETE matching current token/ID → session was revoked → sign out
 *
 * Handles reconnection by re-subscribing when the channel errors/closes.
 */
export function useRealtimeSessions({
  onNewLogin,
  onSessionRevoked,
}: UseRealtimeSessionsOptions) {
  const user = useAuthStore((s) => s.user);
  const callbacksRef = useRef({ onNewLogin, onSessionRevoked });

  // Keep callbacks up to date
  useEffect(() => {
    callbacksRef.current = { onNewLogin, onSessionRevoked };
  }, [onNewLogin, onSessionRevoked]);

  useEffect(() => {
    if (!user?.id) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`sessions:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_sessions",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newSession = payload.new as UserSession;
          const currentToken = getSessionToken();

          // Only show banner if the new session has a DIFFERENT token than ours
          if (!currentToken) return;
          if (newSession.session_token === currentToken) return;

          callbacksRef.current.onNewLogin(newSession);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "user_sessions",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const deletedSession = payload.old as Partial<UserSession>;
          const currentToken = getSessionToken();
          const currentSessionId = getCurrentSessionId();

          // 1. If we are suppressing sign-out (we initiated a bulk revoke), skip
          if (suppressSignOut) return;

          // 2. If we locally revoked this session by ID, skip
          if (deletedSession.id && locallyRevokedIds.has(deletedSession.id)) return;

          // 3. If payload.old is empty, we can't determine whose session was deleted
          if (!deletedSession.session_token && !deletedSession.id) return;

          // 4. Determine if the deleted session is OUR current session
          let isOurSession = false;

          if (deletedSession.session_token && currentToken) {
            isOurSession = deletedSession.session_token === currentToken;
          } else if (deletedSession.id && currentSessionId) {
            isOurSession = deletedSession.id === currentSessionId;
          }

          if (isOurSession) {
            callbacksRef.current.onSessionRevoked();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
}
