"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { usePresence } from "@/hooks/usePresence";
import { useRealtimeConversations } from "@/hooks/useRealtimeConversations";
import { useRealtimeSessions } from "@/hooks/useRealtimeSessions";
import { Sidebar } from "@/components/chat/Sidebar";
import { NetworkBanner } from "@/components/shared/NetworkBanner";
import {
  NewLoginBannerStack,
  useNewLoginBanner,
} from "@/components/shared/NewLoginBanner";
import { getDeviceInfo } from "@/lib/device-info";
import {
  getOrCreateSessionToken,
  getCurrentSessionId,
  setCurrentSessionId,
  clearSessionToken,
} from "@/lib/session-manager";
import { Loader2, WifiOff, Wifi, RefreshCw, CheckCircle2 } from "lucide-react";
import type { ConversationWithDetails } from "@/types";

const SIDEBAR_MIN = 280;
const SIDEBAR_MAX = 600;
const SIDEBAR_DEFAULT = 384; // ~w-96

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser, isLoading, setLoading } = useAuthStore();
  const { setConversations, isSidebarOpen } = useChatStore();
  const [mounted, setMounted] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  // Resizable sidebar state
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  // Handle mouse down on the resize handle
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      dragRef.current = { startX: e.clientX, startWidth: sidebarWidth };
    },
    [sidebarWidth]
  );

  // Handle mouse move for resizing
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const delta = e.clientX - dragRef.current.startX;
      const newWidth = Math.min(
        SIDEBAR_MAX,
        Math.max(SIDEBAR_MIN, dragRef.current.startWidth + delta)
      );
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragRef.current = null;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    // Prevent text selection while dragging
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDragging, sidebarWidth]);

  usePresence();
  useRealtimeConversations();

  // Session management
  const { pendingSessions, addNewLogin, dismissSession } =
    useNewLoginBanner();

  useRealtimeSessions({
    onNewLogin: addNewLogin,
    onSessionRevoked: useCallback(() => {
      // Our session was revoked from another device — sign out locally only
      // IMPORTANT: scope must be 'local' so we only clear THIS device's tokens.
      // Default scope is 'global' which would invalidate ALL devices' refresh tokens,
      // including the device that initiated the revocation.
      console.log("[Layout] onSessionRevoked triggered — signing out (local scope)");
      const doSignOut = async () => {
        const supabase = createClient();
        clearSessionToken();
        await supabase.auth.signOut({ scope: "local" });
        setUser(null);
        router.push("/login");
      };
      doSignOut();
    }, [router, setUser]),
  });

  // Reusable app initialization (used for first load + retry)
  const initializeApp = useCallback(async () => {
    const supabase = createClient();

    try {
      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser();

      // Network error (offline) — don't redirect, keep existing session
      if (error) {
        const existingUser = useAuthStore.getState().user;
        if (!existingUser) {
          setUser(null);
          router.push("/login");
        } else {
          // We have a cached user but can't verify — mark load as failed
          // Keep isLoading: true so the loading screen stays visible
          setLoadFailed(true);
        }
        return;
      }

      if (!authUser) {
        setUser(null);
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (profile) {
        if (!profile.username) {
          router.push("/select-username");
          return;
        }

        setUser(profile);
        setLoadFailed(false);

        // Track session after successful auth
        try {
          const deviceInfo = await getDeviceInfo();
          const sessionToken = getOrCreateSessionToken();
          const previousSessionId = getCurrentSessionId();
          const trackRes = await fetch("/api/sessions/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionToken,
              deviceName: deviceInfo.deviceName,
              deviceType: deviceInfo.deviceType,
              browserName: deviceInfo.browserName,
              osName: deviceInfo.osName,
            }),
          });
          const trackData = await trackRes.json();

          if (trackData.data?.id) {
            // If we had a stored session that no longer exists (was revoked),
            // and the server created a brand new one → session was revoked, sign out
            if (previousSessionId && trackData.new_device_detected) {
              clearSessionToken();
              await supabase.auth.signOut({ scope: "local" });
              setUser(null);
              router.push("/login");
              return;
            }
            setCurrentSessionId(trackData.data.id);
          }
        } catch (sessionError) {
          console.error("Failed to track session:", sessionError);
        }

        // Load conversations after successful auth
        try {
          const res = await fetch("/api/conversations");
          const data = await res.json();
          if (data.data) {
            setConversations(data.data as ConversationWithDetails[]);
          }
        } catch (convError) {
          console.error("Failed to load conversations:", convError);
        }
      } else {
        setUser(null);
        router.push("/login");
      }
    } catch (error) {
      console.error("Failed to get user:", error);
      const existingUser = useAuthStore.getState().user;
      if (!existingUser) {
        setUser(null);
        router.push("/login");
      } else {
        // Keep isLoading: true so the loading screen stays visible
        setLoadFailed(true);
      }
    }
  }, [router, setUser, setLoading, setConversations]);

  // Initial load
  useEffect(() => {
    setMounted(true);
    initializeApp();

    // Listen for auth changes
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [initializeApp, router, setUser]);

  // Auto-retry when coming back online (only if load had failed)
  useEffect(() => {
    if (!loadFailed) return;

    const handleOnline = () => {
      // Show "Back online!" screen first, then load
      setShowReconnected(true);
      setTimeout(() => {
        setShowReconnected(false);
        setRetrying(true);
        setLoadFailed(false);
        initializeApp().finally(() => setRetrying(false));
      }, 1500);
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [loadFailed, initializeApp, setLoading]);

  // Manual retry handler
  const handleRetry = useCallback(async () => {
    setRetrying(true);
    setLoadFailed(false);
    setLoading(true);
    try {
      await initializeApp();
    } finally {
      setRetrying(false);
    }
  }, [initializeApp, setLoading]);

  // Loading / offline state
  if (!mounted || isLoading) {
    // "Back online!" transition screen
    if (mounted && showReconnected) {
      return (
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-6 max-w-sm text-center px-6 animate-in fade-in duration-300">
            {/* Green icon container */}
            <div className="relative">
              {/* Success glow ring */}
              <div className="absolute inset-[-6px] rounded-full bg-emerald-500/15 animate-pulse" />
              {/* Inner circle */}
              <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/15 to-teal-500/10 border border-emerald-500/25 backdrop-blur-sm">
                <Wifi className="h-9 w-9 text-emerald-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
              </div>
              {/* Checkmark badge */}
              <div className="absolute -bottom-1 -right-1 flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
            </div>

            {/* Text */}
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-emerald-400 tracking-tight">
                Back online!
              </h2>
              <p className="text-sm text-muted-foreground">
                Connection restored. Loading your chats...
              </p>
            </div>

            {/* Loading dots */}
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      );
    }

    // Offline screen
    if (mounted && loadFailed && typeof navigator !== "undefined" && !navigator.onLine) {
      return (
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-6 max-w-sm text-center px-6">
            {/* Animated icon container */}
            <div className="relative">
              {/* Outer pulsing ring */}
              <div className="absolute inset-[-8px] rounded-full bg-amber-500/10 animate-ping" />
              <div className="absolute inset-[-4px] rounded-full bg-amber-500/5" />
              {/* Inner glow */}
              <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/15 to-rose-500/10 border border-amber-500/20 backdrop-blur-sm">
                <WifiOff className="h-9 w-9 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
              </div>
            </div>

            {/* Heading */}
            <div className="space-y-2.5">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">
                No internet connection
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Check your network connection and try again.
              </p>
              <p className="text-xs text-muted-foreground/50">
                We&apos;ll reconnect automatically when you&apos;re back online.
              </p>
            </div>

            {/* Retry button */}
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="group flex items-center gap-2.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary/90 to-primary text-primary-foreground text-sm font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <RefreshCw
                className={`h-4 w-4 transition-transform duration-300 ${
                  retrying ? "animate-spin" : "group-hover:rotate-45"
                }`}
              />
              {retrying ? "Connecting..." : "Try again"}
            </button>

            {/* Status hint */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Waiting for connection
            </div>
          </div>
        </div>
      );
    }

    // Normal loading spinner (online or first mount)
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">
            {retrying ? "Reconnecting..." : "Loading Setu..."}
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isConversationView = pathname.startsWith("/chat/");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <div
        className={`${isSidebarOpen ? "flex" : "hidden"} ${isConversationView ? "hidden md:flex" : "flex"} w-full md:w-auto flex-col border-r border-border bg-sidebar shrink-0`}
        style={{ width: undefined }}
      >
        <div className="flex flex-col h-full w-full md:hidden">
          <Sidebar />
        </div>
        <div
          className="hidden md:flex flex-col h-full"
          style={{ width: sidebarWidth }}
        >
          <Sidebar />
        </div>
      </div>

      {/* Resize Handle — overlaps sidebar border, only on md+ screens */}
      <div
        className={`hidden md:flex shrink-0 relative
          ${isDragging ? "sidebar-resize-handle dragging" : "sidebar-resize-handle"}`}
        style={{ width: "6px", marginLeft: "-3px", marginRight: "-3px" }}
        onMouseDown={handleMouseDown}
      />

      {/* Main content */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${
          !isConversationView ? "hidden md:flex" : "flex"
        }`}
      >
        <NewLoginBannerStack
          sessions={pendingSessions}
          onDismiss={dismissSession}
        />
        <NetworkBanner />
        {children}
      </div>
    </div>
  );
}
