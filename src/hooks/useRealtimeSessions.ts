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
 * This avoids the fragile window global + boolean flag approach.
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
 * This is a simpler alternative when the exact session IDs are not known upfront.
 */
let suppressSignOut = false;

export function setSuppressSignOut(value: boolean) {
  suppressSignOut = value;
}

/**
 * Subscribe to real-time changes on user_sessions for the current user.
 * - On INSERT with a different token → new login detected → show banner
 * - On DELETE matching current token/ID → session was revoked → sign out
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

          console.log("[Sessions RT] INSERT event:", {
            newSessionToken: newSession.session_token?.slice(0, 8) + "...",
            newSessionId: newSession.id?.slice(0, 8) + "...",
            currentToken: currentToken?.slice(0, 8) + "...",
            deviceName: newSession.device_name,
          });

          // Only show banner if the new session has a DIFFERENT token than ours
          if (!currentToken) {
            console.log("[Sessions RT] No current token yet, skipping banner");
            return;
          }

          if (newSession.session_token === currentToken) {
            console.log("[Sessions RT] Same token — this is our own session, no banner");
            return;
          }

          console.log("[Sessions RT] Different token — showing new login banner");
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

          console.log("[Sessions RT] DELETE event:", {
            deletedToken: deletedSession.session_token?.slice(0, 8) + "...",
            deletedId: deletedSession.id?.slice(0, 8) + "...",
            currentToken: currentToken?.slice(0, 8) + "...",
            currentSessionId: currentSessionId?.slice(0, 8) + "...",
            suppressSignOut,
            locallyRevoked: deletedSession.id ? locallyRevokedIds.has(deletedSession.id) : "no id",
            payloadOldKeys: Object.keys(deletedSession),
          });

          // 1. If we are suppressing sign-out (we initiated a bulk revoke), skip
          if (suppressSignOut) {
            console.log("[Sessions RT] suppressSignOut is true, skipping");
            return;
          }

          // 2. If we locally revoked this session by ID, skip
          if (deletedSession.id && locallyRevokedIds.has(deletedSession.id)) {
            console.log("[Sessions RT] Session was locally revoked by us, skipping");
            return;
          }

          // 3. If payload.old is empty, we can't determine whose session was deleted
          if (!deletedSession.session_token && !deletedSession.id) {
            console.log("[Sessions RT] Empty payload.old, skipping (cannot determine session)");
            return;
          }

          // 4. Determine if the deleted session is OUR current session
          let isOurSession = false;

          // Primary check: compare session tokens
          if (deletedSession.session_token && currentToken) {
            isOurSession = deletedSession.session_token === currentToken;
          }
          // Fallback: compare session IDs
          else if (deletedSession.id && currentSessionId) {
            isOurSession = deletedSession.id === currentSessionId;
          }

          console.log("[Sessions RT] isOurSession:", isOurSession);

          if (isOurSession) {
            console.log("[Sessions RT] OUR session was revoked — triggering sign out");
            callbacksRef.current.onSessionRevoked();
          } else {
            console.log("[Sessions RT] Another session was revoked — no action needed");
          }
        }
      )
      .subscribe((status) => {
        console.log("[Sessions RT] Subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
}
