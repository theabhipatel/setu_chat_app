"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { broadcastReactionUpdate } from "@/hooks/useRealtimeMessages";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AnimatedEmoji } from "@/components/chat/AnimatedEmoji";
import { getInitials, formatTime, formatFileSize } from "@/lib/utils";
import { getEmojiInfo, getEmojiSize } from "@/lib/emoji";
import {
  Reply,
  Forward,
  Edit3,
  Trash2,
  SmilePlus,
  MoreHorizontal,
  FileText,
  CheckCheck,
} from "lucide-react";
import Image from "next/image";
import dynamic from "next/dynamic";
import type { MessageWithSender, ConversationMember, Profile } from "@/types";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => (
    <div className="h-[350px] w-[350px] bg-muted rounded-lg animate-pulse" />
  ),
});

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwn: boolean;
  showAvatar: boolean;
  members?: (ConversationMember & { profile: Profile })[];
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar,
  members,
}: MessageBubbleProps) {
  const { setReplyingTo, setForwardingMessage, updateMessage } = useChatStore();
  const { user } = useAuthStore();
  const [showActions, setShowActions] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || "");
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiPickerBtnRef = useRef<HTMLButtonElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [emojiPickerPos, setEmojiPickerPos] = useState<{ top: number; left: number } | null>(null);
  const [toolbarFlipped, setToolbarFlipped] = useState(false);

  const QUICK_REACTIONS = ["👍", "❤️", "😂"];

  // Close dropdown/emoji picker on click outside
  useEffect(() => {
    if (!showMoreMenu && !showEmojiPicker) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        showMoreMenu &&
        moreMenuRef.current &&
        !moreMenuRef.current.contains(target)
      ) {
        setShowMoreMenu(false);
      }
      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMoreMenu, showEmojiPicker]);

  // Detect emoji-only messages (1-3 emojis, no other text)
  const emojiInfo = useMemo(() => {
    if (message.message_type !== "text" || !message.content) {
      return { isEmojiOnly: false, count: 0, emojis: [] as string[] };
    }
    return getEmojiInfo(message.content);
  }, [message.content, message.message_type]);

  // Helper to get reactor names from member list
  const getReactorNames = (userIds: string[]) => {
    return userIds
      .map((uid) => {
        if (uid === user?.id) return "You";
        const member = members?.find((m) => m.user_id === uid);
        return member
          ? `${member.profile.first_name} ${member.profile.last_name}`
          : "Someone";
      })
      .join(", ");
  };

  const handleReaction = async (reaction: string) => {
    if (!user) return;
    // Guard: don't call API with temp IDs
    if (message.id.startsWith("temp-")) return;

    // Optimistic update
    const currentReactions = message.reactions || [];
    const existingIdx = currentReactions.findIndex(
      (r) => r.user_id === user.id && r.reaction === reaction
    );

    let optimisticReactions: typeof currentReactions;
    if (existingIdx >= 0) {
      // Remove reaction (toggle off)
      optimisticReactions = currentReactions.filter((_, i) => i !== existingIdx);
    } else {
      // Add reaction
      optimisticReactions = [
        ...currentReactions,
        {
          id: `temp-${Date.now()}`,
          message_id: message.id,
          user_id: user.id,
          reaction,
          created_at: new Date().toISOString(),
        },
      ];
    }

    // Update store immediately
    updateMessage(message.id, { reactions: optimisticReactions });

    try {
      const res = await fetch(`/api/messages/${message.id}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction }),
      });
      if (!res.ok) throw new Error("API error");
      // Broadcast to other users so they see the reaction in real-time
      broadcastReactionUpdate(message.id);
    } catch (error) {
      console.error("Failed to toggle reaction:", error);
      // Rollback on failure
      updateMessage(message.id, { reactions: currentReactions });
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim() || editContent.trim() === message.content) {
      setIsEditing(false);
      return;
    }
    // Guard: don't call API with temp IDs
    if (message.id.startsWith("temp-")) {
      setIsEditing(false);
      return;
    }

    const previousContent = message.content;
    // Optimistic update
    updateMessage(message.id, {
      content: editContent.trim(),
      is_edited: true,
    });
    setIsEditing(false);

    try {
      const res = await fetch(`/api/messages/${message.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent.trim() }),
      });
      if (!res.ok) throw new Error("API error");
    } catch (error) {
      console.error("Failed to edit message:", error);
      // Rollback
      updateMessage(message.id, {
        content: previousContent,
        is_edited: message.is_edited,
      });
    }
  };

  const handleDelete = async () => {
    // Guard: don't call API with temp IDs
    if (message.id.startsWith("temp-")) return;

    // Save original state for rollback
    const previousState = {
      content: message.content,
      file_url: message.file_url,
      is_deleted: message.is_deleted,
    };

    // Optimistic update — immediately show "This message was deleted"
    updateMessage(message.id, {
      is_deleted: true,
      content: null,
      file_url: null,
    });

    try {
      const res = await fetch(`/api/messages/${message.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("API error");
    } catch (error) {
      console.error("Failed to delete message:", error);
      // Rollback on failure
      updateMessage(message.id, previousState);
    }
  };

  const handleForward = () => {
    setForwardingMessage(message);
    setShowMoreMenu(false);
    setShowActions(false);
  };

  if (message.message_type === "system") {
    return (
      <div className="flex justify-center py-2">
        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {message.sender?.first_name} {message.content}
        </span>
      </div>
    );
  }

  if (message.is_deleted) {
    return (
      <div
        className={`flex ${isOwn ? "justify-end" : "justify-start"} py-0.5`}
      >
        <div
          className={`flex items-start gap-2 max-w-[70%] ${
            isOwn ? "flex-row-reverse" : "flex-row"
          }`}
        >
          {/* Avatar spacer to match normal messages */}
          {!isOwn && <div className="w-7 shrink-0" />}
          <div className="px-4 py-2 rounded-2xl bg-muted/50">
            <p className="text-sm text-muted-foreground italic">
              This message was deleted
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex ${isOwn ? "justify-end" : "justify-start"} py-0.5 group message-enter`}
    >
      <div
        className={`flex items-start gap-2 max-w-[70%] ${
          isOwn ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {/* Avatar */}
        {!isOwn && showAvatar ? (
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarImage
              src={message.sender?.avatar_url || ""}
              alt={message.sender?.first_name}
            />
            <AvatarFallback className="text-[10px]">
              {message.sender
                ? getInitials(
                    message.sender.first_name,
                    message.sender.last_name
                  )
                : "??"}
            </AvatarFallback>
          </Avatar>
        ) : !isOwn ? (
          <div className="w-7" />
        ) : null}

        <div className={`space-y-1 min-w-0 ${isOwn ? "items-end" : "items-start"}`}>
          {/* Sender name */}
          {!isOwn && showAvatar && (
            <p className="text-xs text-muted-foreground font-medium px-1">
              {message.sender?.first_name} {message.sender?.last_name}
            </p>
          )}

          {/* Message bubble */}
          <div
            className="relative"
            ref={bubbleRef}
            onMouseEnter={() => {
              setShowActions(true);
              if (bubbleRef.current) {
                const rect = bubbleRef.current.getBoundingClientRect();
                setToolbarFlipped(rect.top < 50);
              }
            }}
            onMouseLeave={() => {
              if (!showMoreMenu && !showEmojiPicker) {
                setShowActions(false);
              }
            }}
          >
            <div
              data-message-id={message.id}
              className={`rounded-2xl break-words ${
                emojiInfo.isEmojiOnly && !message.reply_message
                  ? "px-1 py-1"
                  : `px-4 py-2 ${
                      isOwn
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`
              }`}
              style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
            >
              {/* Forwarded indicator */}
              {message.forwarded_from && (
                <div className={`fwd-indicator ${isOwn ? "own" : ""}`}>
                  <Forward className="h-3 w-3" />
                  <span>Forwarded</span>
                </div>
              )}

              {/* Reply indicator — INSIDE the bubble */}
              {message.reply_message && (
                <div
                  onClick={() => {
                    // Dispatch custom event to scroll to the original message
                    window.dispatchEvent(
                      new CustomEvent("scroll-to-message", {
                        detail: { messageId: message.reply_message?.id },
                      })
                    );
                  }}
                  className={`text-xs px-3 py-2 rounded-lg mb-2 cursor-pointer transition-all duration-200 ${
                    isOwn ? "reply-preview-own" : "reply-preview-other"
                  }`}
                >
                  <span
                    className="font-semibold text-[11px]"
                    style={{ color: isOwn ? "#fbbf24" : "#22d3ee" }}
                  >
                    {message.reply_message.sender?.first_name}
                  </span>
                  <p
                    className={`mt-0.5 overflow-hidden ${
                      isOwn
                        ? "text-white/75"
                        : "text-foreground/70"
                    }`}
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {message.reply_message.content || "Media"}
                  </p>
                </div>
              )}
              {/* Image */}
              {message.message_type === "image" && message.file_url && (
                <div className="mb-2">
                  <Image
                    src={message.file_url}
                    alt="Shared image"
                    width={400}
                    height={256}
                    className="rounded-lg max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  />
                </div>
              )}

              {/* File */}
              {message.message_type === "file" && message.file_url && (
                <a
                  href={message.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 p-2 rounded-lg mb-2 ${
                    isOwn ? "bg-primary-foreground/10" : "bg-background/50"
                  }`}
                >
                  <FileText className="h-8 w-8 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {message.file_name}
                    </p>
                    {message.file_size && (
                      <p className="text-xs opacity-70">
                        {formatFileSize(message.file_size)}
                      </p>
                    )}
                  </div>
                </a>
              )}

              {/* Text content — emoji-only or regular */}
              {isEditing ? (
                <div className="msg-edit-container">
                  <div className="msg-edit-label">
                    <Edit3 className="h-3 w-3" />
                    Editing
                  </div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleEdit();
                      }
                      if (e.key === "Escape") {
                        setIsEditing(false);
                        setEditContent(message.content || "");
                      }
                    }}
                    className="msg-edit-textarea"
                    rows={Math.min(Math.max(editContent.split("\n").length, 2), 6)}
                    autoFocus
                  />
                  <div className="msg-edit-actions">
                    <span className="msg-edit-hint">Esc to cancel · Enter to save</span>
                    <div className="msg-edit-buttons">
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditContent(message.content || "");
                        }}
                        className="msg-edit-btn cancel"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleEdit}
                        className="msg-edit-btn save"
                        disabled={!editContent.trim() || editContent.trim() === message.content}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              ) : emojiInfo.isEmojiOnly && !message.reply_message ? (
                <div className="flex items-center gap-1 py-1">
                  {emojiInfo.emojis.map((emoji, i) => (
                    <AnimatedEmoji
                      key={i}
                      emoji={emoji}
                      size={getEmojiSize(emojiInfo.count)}
                    />
                  ))}
                </div>
              ) : (
                message.content && (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                )
              )}

              {/* Time & status */}
              <div
                className={`flex items-center gap-1 mt-1 ${
                  isOwn ? "justify-end" : "justify-start"
                }`}
              >
                <span className={`text-[10px] ${
                  emojiInfo.isEmojiOnly && !message.reply_message
                    ? "text-muted-foreground"
                    : "opacity-60"
                }`}>
                  {formatTime(message.created_at)}
                </span>
                {message.is_edited && (
                  <span className="text-[10px] opacity-50">edited</span>
                )}
                {isOwn && (
                  <CheckCheck className={`h-3 w-3 ${
                    emojiInfo.isEmojiOnly && !message.reply_message
                      ? "text-muted-foreground"
                      : "opacity-60"
                  }`} />
                )}
              </div>
            </div>

            {/* Reactions */}
            {message.reactions && message.reactions.length > 0 && (
              <div
                className={`flex flex-wrap gap-1 mt-1 ${
                  isOwn ? "justify-end" : "justify-start"
                }`}
              >
                {Object.entries(
                  message.reactions.reduce(
                    (acc, r) => {
                      if (!acc[r.reaction]) {
                        acc[r.reaction] = { count: 0, hasOwn: false, userIds: [] as string[] };
                      }
                      acc[r.reaction].count += 1;
                      acc[r.reaction].userIds.push(r.user_id);
                      if (r.user_id === user?.id) {
                        acc[r.reaction].hasOwn = true;
                      }
                      return acc;
                    },
                    {} as Record<string, { count: number; hasOwn: boolean; userIds: string[] }>
                  )
                ).map(([reaction, { count, hasOwn, userIds }]) => (
                  <button
                    key={reaction}
                    onClick={() => handleReaction(reaction)}
                    className={`msg-reaction-badge ${
                      hasOwn ? "own" : ""
                    }`}
                    title={getReactorNames(userIds)}
                  >
                    <span className="msg-reaction-emoji">{reaction}</span>
                    {count > 1 && <span className="msg-reaction-count">{count}</span>}
                  </button>
                ))}
              </div>
            )}

            {/* Teams-style action toolbar */}
            {showActions && !isEditing && (
              <div
                className={`msg-action-toolbar absolute ${
                  toolbarFlipped ? "bottom-0" : "top-0"
                } ${
                  toolbarFlipped ? "flipped" : ""
                } ${
                  isOwn ? "right-0" : "left-0"
                }`}
              >
                <div className="msg-action-toolbar-inner">
                  {/* Quick reaction emojis */}
                  {QUICK_REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(emoji)}
                      className="msg-action-quick-emoji"
                      title={`React with ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}

                  {/* Emoji picker button */}
                  <div className="relative" ref={emojiPickerRef}>
                    <button
                      ref={emojiPickerBtnRef}
                      onClick={() => {
                        if (!showEmojiPicker && emojiPickerBtnRef.current) {
                          const rect = emojiPickerBtnRef.current.getBoundingClientRect();
                          setEmojiPickerPos({
                            top: rect.top,
                            left: Math.min(rect.left, window.innerWidth - 360),
                          });
                        }
                        setShowEmojiPicker(!showEmojiPicker);
                        setShowMoreMenu(false);
                      }}
                      className={`msg-action-btn ${showEmojiPicker ? "active" : ""}`}
                      title="More reactions"
                    >
                      <SmilePlus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Separator */}
                  <div className="msg-action-separator" />

                  {/* Edit button (own messages only) */}
                  {isOwn && (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowActions(false);
                      }}
                      className="msg-action-btn"
                      title="Edit"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {/* More options */}
                  <div className="relative" ref={moreMenuRef}>
                    <button
                      onClick={() => {
                        setShowMoreMenu(!showMoreMenu);
                        setShowEmojiPicker(false);
                      }}
                      className={`msg-action-btn ${showMoreMenu ? "active" : ""}`}
                      title="More options"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                    {showMoreMenu && (
                      <div className={`msg-action-dropdown ${
                        isOwn ? "right-0" : "left-0"
                      }`}>
                        <button
                          className="msg-action-dropdown-item"
                          onClick={() => {
                            setReplyingTo(message);
                            setShowMoreMenu(false);
                            setShowActions(false);
                          }}
                        >
                          <Reply className="h-4 w-4" />
                          Reply
                        </button>
                        <button
                          className="msg-action-dropdown-item"
                          onClick={() => {
                            handleForward();
                          }}
                        >
                          <Forward className="h-4 w-4" />
                          Forward
                        </button>
                        {isOwn && (
                          <button
                            className="msg-action-dropdown-item text-destructive"
                            onClick={() => {
                              handleDelete();
                              setShowMoreMenu(false);
                              setShowActions(false);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed emoji picker overlay — outside all nested containers to prevent clipping */}
      {showEmojiPicker && emojiPickerPos && (
        <>
          <div
            className="fixed inset-0 z-[60]"
            onClick={() => setShowEmojiPicker(false)}
          />
          <div
            ref={emojiPickerRef}
            className="fixed z-[61] rounded-xl overflow-hidden shadow-2xl"
            style={{
              top: Math.max(8, emojiPickerPos.top - 358),
              left: Math.max(8, emojiPickerPos.left - 175),
            }}
          >
            <EmojiPicker
              onEmojiClick={(emojiData: { emoji: string }) => {
                handleReaction(emojiData.emoji);
                setShowEmojiPicker(false);
              }}
              // @ts-expect-error - theme type mismatch
              theme="auto"
              height={350}
              width={350}
              searchPlaceHolder="Search emoji..."
            />
          </div>
        </>
      )}
    </div>
  );
}
