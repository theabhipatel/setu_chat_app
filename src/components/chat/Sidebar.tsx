"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { UserSearch } from "@/components/search/UserSearch";
import { ConversationList } from "@/components/chat/ConversationList";
import { CreateGroupModal } from "@/components/group/CreateGroupModal";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";
import {
  MessageSquare,
  Users,
  LogOut,
  User,
  Settings,
} from "lucide-react";
import type { SearchResult } from "@/types";

export function Sidebar() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const { addConversation } = useChatStore();
  const [showGroupModal, setShowGroupModal] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ is_online: false, last_seen: new Date().toISOString() })
      .eq("id", user?.id);
    await supabase.auth.signOut();
    setUser(null);
    router.push("/login");
  };

  const handleSelectUser = async (selectedUser: SearchResult) => {
    try {
      console.log("[Sidebar] handleSelectUser called with:", selectedUser);
      const requestBody = {
        type: "private",
        memberIds: [selectedUser.id],
      };
      console.log("[Sidebar] POST /api/conversations body:", requestBody);

      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      console.log("[Sidebar] Response status:", res.status);
      const data = await res.json();
      console.log("[Sidebar] Response data:", data);

      if (data.data) {
        console.log("[Sidebar] Conversation found/created:", data.data.id, "existing:", data.existing);
        if (!data.existing) {
          addConversation(data.data);
        }
        router.push(`/chat/${data.data.id}`);
      } else {
        console.error("[Sidebar] No conversation data in response. Error:", data.error);
      }
    } catch (error) {
      console.error("[Sidebar] Failed to create conversation:", error);
    }
  };

  if (!user) return null;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold gradient-text">Setu</h1>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar_url || ""} alt={user.first_name} />
                  <AvatarFallback className="text-xs">
                    {getInitials(user.first_name, user.last_name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  @{user.username}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <UserSearch onSelect={handleSelectUser} />
      </div>

      {/* New Group Button */}
      <div className="px-3 pb-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-sm"
          onClick={() => setShowGroupModal(true)}
        >
          <Users className="h-4 w-4" />
          New Group Chat
        </Button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        <ConversationList />
      </div>

      {/* Group Modal */}
      <CreateGroupModal
        open={showGroupModal}
        onClose={() => setShowGroupModal(false)}
      />
    </div>
  );
}
