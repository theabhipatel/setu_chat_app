"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { usePresence } from "@/hooks/usePresence";
import { useRealtimeConversations } from "@/hooks/useRealtimeConversations";
import { Sidebar } from "@/components/chat/Sidebar";
import { Loader2 } from "lucide-react";
import type { ConversationWithDetails } from "@/types";

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
          setUser(profile);

          if (!profile.username) {
            router.push("/select-username");
            return;
          }
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
        className={`${
          isSidebarOpen ? "flex" : "hidden"
        } ${
          isConversationView ? "hidden md:flex" : "flex"
        } w-full md:w-80 lg:w-96 flex-col border-r border-border bg-sidebar`}
      >
        <Sidebar />
      </div>

      {/* Main content */}
      <div
        className={`flex-1 flex flex-col ${
          !isConversationView ? "hidden md:flex" : "flex"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
