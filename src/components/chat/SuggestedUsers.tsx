"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/stores/useChatStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OnlineIndicator } from "@/components/shared/OnlineIndicator";
import { getInitials } from "@/lib/utils";
import { Sparkles, Loader2 } from "lucide-react";
import type { SearchResult, ConversationWithDetails } from "@/types";

export function SuggestedUsers() {
  const router = useRouter();
  const { addConversation } = useChatStore();
  const [suggestedUsers, setSuggestedUsers] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startingChatWith, setStartingChatWith] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await fetch("/api/users/suggested");
        const data = await res.json();
        setSuggestedUsers(data.data || []);
      } catch {
        setSuggestedUsers([]);
      }
      setIsLoading(false);
    };

    fetchSuggestions();
  }, []);

  const handleStartChat = async (user: SearchResult) => {
    if (startingChatWith) return;
    setStartingChatWith(user.id);

    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "private",
          memberIds: [user.id],
        }),
      });

      const data = await res.json();
      if (data.data) {
        if (!data.existing) {
          addConversation(data.data as ConversationWithDetails);
        }
        setSuggestedUsers((prev) => prev.filter((u) => u.id !== user.id));
        router.push(`/chat/${data.data.id}`);
      }
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
    setStartingChatWith(null);
  };

  if (isLoading) {
    return (
      <div className="py-2">
        <div className="rounded-xl border border-border/50 bg-primary/[0.02] p-4">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  if (suggestedUsers.length === 0) return null;

  return (
    <div className="py-2">
      <div className="rounded-xl border border-border/50 bg-gradient-to-b from-primary/[0.04] to-transparent p-3">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3 px-1">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            People to chat with
          </span>
        </div>

        {/* User list */}
        <div className="space-y-0.5">
          {suggestedUsers.map((user) => (
            <button
              key={user.id}
              onClick={() => handleStartChat(user)}
              disabled={startingChatWith === user.id}
              className="w-full flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-all duration-150 hover:bg-primary/[0.06] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.avatar_url || ""} alt={user.first_name} />
                  <AvatarFallback className="text-xs">
                    {getInitials(user.first_name, user.last_name)}
                  </AvatarFallback>
                </Avatar>
                <OnlineIndicator
                  isOnline={user.is_online}
                  size="sm"
                  className="absolute -bottom-0.5 -right-0.5"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  @{user.username}
                </p>
              </div>

              {/* Loading indicator */}
              {startingChatWith === user.id && (
                <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
