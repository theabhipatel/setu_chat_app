"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Monitor,
  Smartphone,
  Tablet,
  AppWindow,
  X,
  ChevronRight,
} from "lucide-react";
import type { UserSession } from "@/types";

interface NewLoginBannerProps {
  session: UserSession;
  onDismiss: () => void;
}

function getDeviceIcon(deviceType: string) {
  switch (deviceType) {
    case "desktop_app":
      return <AppWindow className="h-5 w-5" />;
    case "desktop_browser":
      return <Monitor className="h-5 w-5" />;
    case "mobile_app":
    case "mobile_browser":
      return <Smartphone className="h-5 w-5" />;
    case "tablet_browser":
      return <Tablet className="h-5 w-5" />;
    default:
      return <Monitor className="h-5 w-5" />;
  }
}

function SingleBanner({ session, onDismiss }: NewLoginBannerProps) {
  const router = useRouter();

  return (
    <div className="relative overflow-hidden border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-orange-500/10 backdrop-blur-sm animate-in slide-in-from-top-2 duration-300">
      {/* Subtle gradient accent line at top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400" />

      <div className="flex items-center gap-3 px-4 py-3">
        {/* Icon */}
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-warning/15 text-warning shrink-0">
          {getDeviceIcon(session.device_type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            New login detected
          </p>
          <p className="text-xs text-muted-foreground truncate">
            <span className="font-medium text-foreground/80">
              {session.device_name}
            </span>
            {session.location && (
              <span> · {session.location}</span>
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => router.push("/settings#sessions")}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-warning/15 hover:bg-warning/25 text-warning transition-colors"
          >
            View Sessions
            <ChevronRight className="h-3 w-3" />
          </button>
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * New Login Banner Manager
 * Manages multiple new login notifications as a stack.
 */
export function useNewLoginBanner() {
  const [pendingSessions, setPendingSessions] = useState<UserSession[]>([]);

  const addNewLogin = useCallback((session: UserSession) => {
    setPendingSessions((prev) => {
      // Avoid duplicates
      if (prev.some((s) => s.id === session.id)) return prev;
      return [...prev, session];
    });
  }, []);

  const dismissSession = useCallback((sessionId: string) => {
    setPendingSessions((prev) => prev.filter((s) => s.id !== sessionId));
  }, []);

  const dismissAll = useCallback(() => {
    setPendingSessions([]);
  }, []);

  return {
    pendingSessions,
    addNewLogin,
    dismissSession,
    dismissAll,
  };
}

interface NewLoginBannerStackProps {
  sessions: UserSession[];
  onDismiss: (sessionId: string) => void;
}

export function NewLoginBannerStack({
  sessions,
  onDismiss,
}: NewLoginBannerStackProps) {
  if (sessions.length === 0) return null;

  return (
    <div className="w-full z-50">
      {sessions.map((session) => (
        <SingleBanner
          key={session.id}
          session={session}
          onDismiss={() => onDismiss(session.id)}
        />
      ))}
    </div>
  );
}
