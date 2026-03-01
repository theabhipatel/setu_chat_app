"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { usePresence } from "@/hooks/usePresence";
import { useRealtimeConversations } from "@/hooks/useRealtimeConversations";
import { Sidebar } from "@/components/chat/Sidebar";
import { Loader2 } from "lucide-react";
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
  const { user, setUser, isLoading } = useAuthStore();
  const { setConversations, isSidebarOpen } = useChatStore();
  const [mounted, setMounted] = useState(false);

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

  useEffect(() => {
    setMounted(true);
    const supabase = createClient();

    const getUser = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

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
        } else {
          setUser(null);
          router.push("/login");
        }
      } catch (error) {
        console.error("Failed to get user:", error);
        setUser(null);
        router.push("/login");
      }
    };

    const loadConversations = async () => {
      try {
        const res = await fetch("/api/conversations");
        const data = await res.json();
        if (data.data) {
          setConversations(data.data as ConversationWithDetails[]);
        }
      } catch (error) {
        console.error("Failed to load conversations:", error);
      }
    };

    getUser().then(() => loadConversations());

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router, setUser, setConversations]);

  if (!mounted || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading Setu...</p>
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
        {children}
      </div>
    </div>
  );
}

