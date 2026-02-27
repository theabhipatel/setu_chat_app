"use client";

import { useRouter, usePathname } from "next/navigation";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { OnlineIndicator } from "@/components/shared/OnlineIndicator";
import { ConversationListSkeleton } from "@/components/shared/LoadingSkeleton";
import { getInitials, formatDate, truncate } from "@/lib/utils";
import { Users } from "lucide-react";
import type { ConversationWithDetails } from "@/types";

export function ConversationList() {
  const router = useRouter();
  const pathname = usePathname();
  const { conversations, conversationsLoaded } = useChatStore();
  const { user } = useAuthStore();

  if (!conversationsLoaded) return <ConversationListSkeleton />;

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-muted-foreground text-sm">
          No conversations yet. Search for users to start chatting!
        </p>
      </div>
    );
  }

  const getConversationInfo = (conversation: ConversationWithDetails) => {
    if (conversation.type === "group") {
      return {
        name: conversation.name || "Group Chat",
        avatar: conversation.avatar_url,
        isOnline: false,
        initials: (conversation.name || "GC").substring(0, 2).toUpperCase(),
      };
    }

    // Private chat — show the other person
    const otherMember = conversation.members?.find(
      (m) => m.user_id !== user?.id
    );
    const otherProfile = otherMember?.profile;

    return {
      name: otherProfile
        ? `${otherProfile.first_name} ${otherProfile.last_name}`
        : "Unknown User",
      avatar: otherProfile?.avatar_url,
      isOnline: otherProfile?.is_online || false,
      initials: otherProfile
        ? getInitials(otherProfile.first_name, otherProfile.last_name)
        : "??",
    };
  };

  return (
    <div className="space-y-0.5 px-2">
      {conversations.map((conversation) => {
        const info = getConversationInfo(conversation);
        const isActive = pathname === `/chat/${conversation.id}`;
        const lastMsg = conversation.last_message;

        return (
          <button
            key={conversation.id}
            onClick={() => router.push(`/chat/${conversation.id}`)}
            className={`w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-all duration-150 hover:bg-accent/50 ${
              isActive
                ? "bg-accent shadow-sm"
                : ""
            }`}
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <Avatar className="h-11 w-11">
                <AvatarImage src={info.avatar || ""} alt={info.name} />
                <AvatarFallback>
                  {conversation.type === "group" ? (
                    <Users className="h-5 w-5" />
                  ) : (
                    info.initials
                  )}
                </AvatarFallback>
              </Avatar>
              {conversation.type === "private" && (
                <OnlineIndicator
                  isOnline={info.isOnline}
                  size="sm"
                  className="absolute -bottom-0.5 -right-0.5"
                />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm truncate">
                  {info.name}
                </span>
                {lastMsg && (
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {formatDate(lastMsg.created_at)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-xs text-muted-foreground truncate">
                  {lastMsg?.is_deleted
                    ? "This message was deleted"
                    : lastMsg?.content
                    ? truncate(lastMsg.content, 40)
                    : lastMsg?.message_type === "image"
                    ? "📷 Image"
                    : lastMsg?.message_type === "file"
                    ? "📎 File"
                    : "Start a conversation"}
                </p>
                {(conversation.unread_count || 0) > 0 && (
                  <Badge className="ml-2 h-5 min-w-[20px] rounded-full text-xs px-1.5">
                    {conversation.unread_count}
                  </Badge>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
