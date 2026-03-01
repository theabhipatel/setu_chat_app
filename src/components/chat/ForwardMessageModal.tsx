"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import {
  Search,
  X,
  Forward,
  Loader2,
  Check,
  Users,
  User,
  FileText,
  ImageIcon,
} from "lucide-react";
import type {
  ConversationWithDetails,
  SearchResult,
  Profile,
} from "@/types";

interface Recipient {
  id: string;
  type: "user" | "conversation";
  name: string;
  avatarUrl?: string | null;
  conversationId?: string;
}

export function ForwardMessageModal() {
  const { forwardingMessage, setForwardingMessage, conversations } =
    useChatStore();
  const { user } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isForwarding, setIsForwarding] = useState(false);
  const [forwardSuccess, setForwardSuccess] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const isOpen = !!forwardingMessage;

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSearchResults([]);
      setSelectedRecipients([]);
      setIsSearching(false);
      setIsForwarding(false);
      setForwardSuccess(false);
    }
  }, [isOpen]);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Search users with debounce
  const searchUsers = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/users/search?q=${encodeURIComponent(query)}`
        );
        const data = await res.json();
        setSearchResults(data.data || []);
      } catch (error) {
        console.error("Search failed:", error);
      }
      setIsSearching(false);
    },
    []
  );

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, searchUsers]);

  // Get filtered group conversations (limit to 3 when no search)
  const filteredGroups = conversations
    .filter((conv) => {
      if (conv.type !== "group") return false;
      if (!searchQuery) return true;
      return conv.name?.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .slice(0, searchQuery ? 20 : 3);

  // Get self conversation (Saved Messages)
  const selfConversation = conversations.find((conv) => conv.type === "self");

  // Get filtered private conversations (when no search query, show recent chats)
  const recentPrivateChats = conversations
    .filter((conv) => {
      if (conv.type !== "private") return false;
      const otherMember = conv.members?.find((m) => m.user_id !== user?.id);
      if (!otherMember) return false;
      if (!searchQuery) return true;
      const fullName = `${otherMember.profile.first_name} ${otherMember.profile.last_name}`;
      return fullName.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .slice(0, searchQuery ? 20 : 3);

  const isRecipientSelected = (id: string) =>
    selectedRecipients.some((r) => r.id === id);

  const toggleUserRecipient = (result: SearchResult) => {
    if (isRecipientSelected(result.id)) {
      setSelectedRecipients((prev) => prev.filter((r) => r.id !== result.id));
    } else {
      setSelectedRecipients((prev) => [
        ...prev,
        {
          id: result.id,
          type: "user",
          name: `${result.first_name} ${result.last_name}`,
          avatarUrl: result.avatar_url,
        },
      ]);
    }
  };

  const toggleConversationRecipient = (conv: ConversationWithDetails) => {
    const recipientId = `conv-${conv.id}`;
    if (isRecipientSelected(recipientId)) {
      setSelectedRecipients((prev) =>
        prev.filter((r) => r.id !== recipientId)
      );
    } else {
      let name = conv.name || "Group";
      let avatarUrl = conv.avatar_url;
      if (conv.type === "private") {
        const otherMember = conv.members?.find(
          (m) => m.user_id !== user?.id
        );
        if (otherMember) {
          name = `${otherMember.profile.first_name} ${otherMember.profile.last_name}`;
          avatarUrl = otherMember.profile.avatar_url;
        }
      }
      setSelectedRecipients((prev) => [
        ...prev,
        {
          id: recipientId,
          type: "conversation",
          name,
          avatarUrl,
          conversationId: conv.id,
        },
      ]);
    }
  };

  const togglePrivateChatRecipient = (conv: ConversationWithDetails) => {
    const otherMember = conv.members?.find((m) => m.user_id !== user?.id);
    if (!otherMember) return;

    // Check if already selected as user or conversation
    const userId = otherMember.user_id;
    const convRecipientId = `conv-${conv.id}`;

    if (isRecipientSelected(userId) || isRecipientSelected(convRecipientId)) {
      setSelectedRecipients((prev) =>
        prev.filter((r) => r.id !== userId && r.id !== convRecipientId)
      );
    } else {
      setSelectedRecipients((prev) => [
        ...prev,
        {
          id: userId,
          type: "user",
          name: `${otherMember.profile.first_name} ${otherMember.profile.last_name}`,
          avatarUrl: otherMember.profile.avatar_url,
        },
      ]);
    }
  };

  const isPrivateChatSelected = (conv: ConversationWithDetails) => {
    const otherMember = conv.members?.find((m) => m.user_id !== user?.id);
    if (!otherMember) return false;
    return (
      isRecipientSelected(otherMember.user_id) ||
      isRecipientSelected(`conv-${conv.id}`)
    );
  };

  const removeRecipient = (id: string) => {
    setSelectedRecipients((prev) => prev.filter((r) => r.id !== id));
  };

  const handleForward = async () => {
    if (!forwardingMessage || selectedRecipients.length === 0) return;

    setIsForwarding(true);
    try {
      const conversationIds = selectedRecipients
        .filter((r) => r.type === "conversation")
        .map((r) => r.conversationId!)
        .filter(Boolean);

      const userIds = selectedRecipients
        .filter((r) => r.type === "user")
        .map((r) => r.id);

      const res = await fetch("/api/messages/forward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: forwardingMessage.id,
          conversationIds,
          userIds,
        }),
      });

      const data = await res.json();
      console.log("Forward response:", res.status, data);

      if (!res.ok) {
        throw new Error(data.error || "Forward failed");
      }

      if (data.forwardedCount > 0) {
        setForwardSuccess(true);
        setTimeout(() => {
          setForwardingMessage(null);
        }, 1200);
      } else {
        console.error("Forward returned 0 successful forwards:", data);
      }
    } catch (error) {
      console.error("Failed to forward message:", error);
    }
    setIsForwarding(false);
  };

  const getMessagePreview = () => {
    if (!forwardingMessage) return "";
    if (forwardingMessage.message_type === "image") return "📷 Photo";
    if (forwardingMessage.message_type === "file")
      return `📎 ${forwardingMessage.file_name || "File"}`;
    return forwardingMessage.content || "";
  };

  const getMessageTypeIcon = () => {
    if (!forwardingMessage) return null;
    if (forwardingMessage.message_type === "image")
      return <ImageIcon className="h-4 w-4 text-blue-400" />;
    if (forwardingMessage.message_type === "file")
      return <FileText className="h-4 w-4 text-amber-400" />;
    return null;
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) setForwardingMessage(null);
      }}
    >
      <DialogContent className="fwd-modal">
        <DialogHeader className="fwd-modal-header">
          <DialogTitle className="fwd-modal-title">
            <Forward className="h-5 w-5 text-primary" />
            Forward Message
          </DialogTitle>
          <DialogDescription className="sr-only">
            Search for users or groups to forward this message to
          </DialogDescription>
        </DialogHeader>

        {/* Success state */}
        {forwardSuccess ? (
          <div className="fwd-modal-success">
            <div className="fwd-modal-success-icon">
              <Check className="h-8 w-8 text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-emerald-400">
              Message forwarded successfully!
            </p>
          </div>
        ) : (
          <>
            {/* Selected recipients chips */}
            {selectedRecipients.length > 0 && (
              <div className="fwd-chips-container">
                {selectedRecipients.map((recipient) => (
                  <div key={recipient.id} className="fwd-chip">
                    <span className="fwd-chip-name">{recipient.name}</span>
                    <button
                      onClick={() => removeRecipient(recipient.id)}
                      className="fwd-chip-remove"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search bar */}
            <div className="fwd-search-wrapper">
              <Search className="fwd-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users or groups..."
                className="fwd-search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="fwd-search-clear"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Results list */}
            <div className="fwd-results-container">
              {isSearching ? (
                <div className="fwd-results-loading">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Searching...
                  </span>
                </div>
              ) : (
                <>
                  {/* Saved Messages (self conversation) */}
                  {selfConversation && !searchQuery && (
                    <div className="fwd-results-section">
                      <button
                        onClick={() => toggleConversationRecipient(selfConversation)}
                        className={`fwd-result-item ${
                          isRecipientSelected(`conv-${selfConversation.id}`)
                            ? "selected"
                            : ""
                        }`}
                      >
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage src={user?.avatar_url || ""} alt="Saved Messages" />
                          <AvatarFallback className="text-xs bg-primary/20">
                            {user ? getInitials(user.first_name, user.last_name) : "SM"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="fwd-result-info">
                          <span className="fwd-result-name">Saved Messages</span>
                          <span className="fwd-result-meta">Forward to yourself</span>
                        </div>
                        <div
                          className={`fwd-result-check ${
                            isRecipientSelected(`conv-${selfConversation.id}`)
                              ? "checked"
                              : ""
                          }`}
                        >
                          {isRecipientSelected(`conv-${selfConversation.id}`) && (
                            <Check className="h-3 w-3" />
                          )}
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Group conversations */}
                  {filteredGroups.length > 0 && (
                    <div className="fwd-results-section">
                      <p className="fwd-results-section-title">
                        <Users className="h-3.5 w-3.5" />
                        Groups
                      </p>
                      {filteredGroups.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => toggleConversationRecipient(conv)}
                          className={`fwd-result-item ${
                            isRecipientSelected(`conv-${conv.id}`)
                              ? "selected"
                              : ""
                          }`}
                        >
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarImage src={conv.avatar_url || ""} />
                            <AvatarFallback className="text-xs bg-primary/20 text-primary">
                              {conv.name?.[0]?.toUpperCase() || "G"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="fwd-result-info">
                            <span className="fwd-result-name">
                              {conv.name || "Group"}
                            </span>
                            <span className="fwd-result-meta">
                              {conv.members?.length || 0} members
                            </span>
                          </div>
                          <div
                            className={`fwd-result-check ${
                              isRecipientSelected(`conv-${conv.id}`)
                                ? "checked"
                                : ""
                            }`}
                          >
                            {isRecipientSelected(`conv-${conv.id}`) && (
                              <Check className="h-3 w-3" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Recent private chats (shown when no search or when searching) */}
                  {recentPrivateChats.length > 0 && (
                    <div className="fwd-results-section">
                      <p className="fwd-results-section-title">
                        <User className="h-3.5 w-3.5" />
                        {searchQuery ? "Conversations" : "Recent Chats"}
                      </p>
                      {recentPrivateChats.map((conv) => {
                        const otherMember = conv.members?.find(
                          (m) => m.user_id !== user?.id
                        );
                        if (!otherMember) return null;
                        const profile = otherMember.profile;
                        return (
                          <button
                            key={conv.id}
                            onClick={() => togglePrivateChatRecipient(conv)}
                            className={`fwd-result-item ${
                              isPrivateChatSelected(conv) ? "selected" : ""
                            }`}
                          >
                            <div className="relative">
                              <Avatar className="h-9 w-9 shrink-0">
                                <AvatarImage
                                  src={profile.avatar_url || ""}
                                />
                                <AvatarFallback className="text-xs">
                                  {getInitials(
                                    profile.first_name,
                                    profile.last_name
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              {profile.is_online && (
                                <span className="fwd-online-dot" />
                              )}
                            </div>
                            <div className="fwd-result-info">
                              <span className="fwd-result-name">
                                {profile.first_name} {profile.last_name}
                              </span>
                              <span className="fwd-result-meta">
                                {profile.is_online ? "Online" : "Offline"}
                              </span>
                            </div>
                            <div
                              className={`fwd-result-check ${
                                isPrivateChatSelected(conv) ? "checked" : ""
                              }`}
                            >
                              {isPrivateChatSelected(conv) && (
                                <Check className="h-3 w-3" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Search results (users from search API) */}
                  {searchQuery.length >= 2 && searchResults.length > 0 && (
                    <div className="fwd-results-section">
                      <p className="fwd-results-section-title">
                        <User className="h-3.5 w-3.5" />
                        Users
                      </p>
                      {searchResults
                        .filter((result) => {
                          // Don't show users already shown in recent chats
                          return !recentPrivateChats.some((conv) =>
                            conv.members?.some(
                              (m) =>
                                m.user_id === result.id &&
                                m.user_id !== user?.id
                            )
                          );
                        })
                        .map((result) => (
                          <button
                            key={result.id}
                            onClick={() => toggleUserRecipient(result)}
                            className={`fwd-result-item ${
                              isRecipientSelected(result.id) ? "selected" : ""
                            }`}
                          >
                            <div className="relative">
                              <Avatar className="h-9 w-9 shrink-0">
                                <AvatarImage
                                  src={result.avatar_url || ""}
                                />
                                <AvatarFallback className="text-xs">
                                  {getInitials(
                                    result.first_name,
                                    result.last_name
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              {result.is_online && (
                                <span className="fwd-online-dot" />
                              )}
                            </div>
                            <div className="fwd-result-info">
                              <span className="fwd-result-name">
                                {result.first_name} {result.last_name}
                              </span>
                              <span className="fwd-result-meta">
                                @{result.username || "user"}
                              </span>
                            </div>
                            <div
                              className={`fwd-result-check ${
                                isRecipientSelected(result.id) ? "checked" : ""
                              }`}
                            >
                              {isRecipientSelected(result.id) && (
                                <Check className="h-3 w-3" />
                              )}
                            </div>
                          </button>
                        ))}
                    </div>
                  )}

                  {/* Empty state */}
                  {searchQuery.length >= 2 &&
                    searchResults.length === 0 &&
                    filteredGroups.length === 0 &&
                    recentPrivateChats.length === 0 && (
                      <div className="fwd-results-empty">
                        <p className="text-sm text-muted-foreground">
                          No users or groups found
                        </p>
                      </div>
                    )}
                </>
              )}
            </div>

            {/* Message preview */}
            <div className="fwd-preview">
              <p className="fwd-preview-label">Message to forward</p>
              <div className="fwd-preview-card">
                <div className="fwd-preview-sender">
                  <Avatar className="h-5 w-5">
                    <AvatarImage
                      src={forwardingMessage?.sender?.avatar_url || ""}
                    />
                    <AvatarFallback className="text-[8px]">
                      {forwardingMessage?.sender
                        ? getInitials(
                            forwardingMessage.sender.first_name,
                            forwardingMessage.sender.last_name
                          )
                        : "??"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="fwd-preview-sender-name">
                    {forwardingMessage?.sender?.first_name}{" "}
                    {forwardingMessage?.sender?.last_name}
                  </span>
                </div>
                <div className="fwd-preview-content">
                  {getMessageTypeIcon()}
                  <p className="fwd-preview-text">{getMessagePreview()}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="fwd-modal-footer">
              <button
                onClick={() => setForwardingMessage(null)}
                className="fwd-btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleForward}
                disabled={selectedRecipients.length === 0 || isForwarding}
                className="fwd-btn-forward"
              >
                {isForwarding ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Forward className="h-4 w-4" />
                    Forward
                    {selectedRecipients.length > 0 && (
                      <span className="fwd-btn-count">
                        {selectedRecipients.length}
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
