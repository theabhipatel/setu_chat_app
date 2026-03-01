"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { OnlineIndicator } from "@/components/shared/OnlineIndicator";
import { getInitials, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Users,
  Pin,
  PinOff,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ConversationWithDetails } from "@/types";

interface ChatHeaderProps {
  conversation: ConversationWithDetails;
}

export function ChatHeader({ conversation }: ChatHeaderProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { setSidebarOpen, updateConversation } = useChatStore();

  // Check if this conversation is pinned by the current user
  const currentMembership = conversation.members?.find(
    (m) => m.user_id === user?.id
  );
  const isPinned = !!currentMembership?.pinned_at;

  const handleTogglePin = async () => {
    try {
      const res = await fetch(`/api/conversations/${conversation.id}/pin`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (res.ok && data.data) {
        // Update the local conversation member's pinned_at
        const updatedMembers = conversation.members?.map((m) =>
          m.user_id === user?.id
            ? { ...m, pinned_at: data.data.pinned_at }
            : m
        );
        updateConversation(conversation.id, { members: updatedMembers });
      }
    } catch (error) {
      console.error("Failed to toggle pin:", error);
    }
  };

  const isGroup = conversation.type === "group";
  const isSelf = conversation.type === "self";
  const otherMember = !isGroup && !isSelf
    ? conversation.members?.find((m) => m.user_id !== user?.id)
    : null;
  const otherProfile = otherMember?.profile;

  const name = isSelf
    ? "Saved Messages"
    : isGroup
    ? conversation.name || "Group Chat"
    : otherProfile
    ? `${otherProfile.first_name} ${otherProfile.last_name}`
    : "Unknown User";

  const avatar = isSelf ? (user?.avatar_url || null) : isGroup ? conversation.avatar_url : otherProfile?.avatar_url;
  const isOnline = isSelf ? false : otherProfile?.is_online || false;
  const initials = isSelf
    ? (user ? getInitials(user.first_name, user.last_name) : "SM")
    : isGroup
    ? (conversation.name || "GC").substring(0, 2).toUpperCase()
    : otherProfile
    ? getInitials(otherProfile.first_name, otherProfile.last_name)
    : "??";

  const subtitle = isSelf
    ? "Your personal space"
    : isGroup
    ? `${conversation.members?.length || 0} members`
    : isOnline
    ? "Online"
    : otherProfile?.last_seen
    ? `Last seen ${formatDate(otherProfile.last_seen)}`
    : "Offline";

  const handleBack = () => {
    setSidebarOpen(true);
    router.push("/chat");
  };

  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-3 glass-strong">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden rounded-full"
          onClick={handleBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatar || ""} alt={name} />
            <AvatarFallback>
              {isGroup ? <Users className="h-5 w-5" /> : initials}
            </AvatarFallback>
          </Avatar>
          {!isGroup && !isSelf && (
            <OnlineIndicator
              isOnline={isOnline}
              size="sm"
              className="absolute -bottom-0.5 -right-0.5"
            />
          )}
        </div>

        <div>
          <h3 className="font-semibold text-sm">{name}</h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {!isGroup && isOnline && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            )}
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="rounded-full hidden sm:flex">
          <Phone className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full hidden sm:flex">
          <Video className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isGroup ? (
              <DropdownMenuItem
                onClick={() => router.push(`/chat/${conversation.id}/settings`)}
              >
                <Users className="mr-2 h-4 w-4" />
                Group Info
              </DropdownMenuItem>
            ) : !isSelf ? (
              <DropdownMenuItem
                onClick={() => {
                  if (otherMember?.user_id) {
                    router.push(`/user/${otherMember.user_id}`);
                  }
                }}
              >
                <Users className="mr-2 h-4 w-4" />
                View Profile
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onClick={handleTogglePin}>
              {isPinned ? (
                <>
                  <PinOff className="mr-2 h-4 w-4" />
                  Unpin Chat
                </>
              ) : (
                <>
                  <Pin className="mr-2 h-4 w-4" />
                  Pin Chat
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
