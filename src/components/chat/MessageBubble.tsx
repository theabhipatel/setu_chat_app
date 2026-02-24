"use client";

import { useState } from "react";
import { useChatStore } from "@/stores/useChatStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, formatTime, formatFileSize } from "@/lib/utils";
import {
  Reply,
  Forward,
  Edit3,
  Trash2,
  Smile,
  FileText,
  CheckCheck,
} from "lucide-react";
import Image from "next/image";
import type { MessageWithSender } from "@/types";

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwn: boolean;
  showAvatar: boolean;
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar,
}: MessageBubbleProps) {
  const { setReplyingTo } = useChatStore();
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || "");

  const handleReaction = async (reaction: string) => {
    try {
      await fetch(`/api/messages/${message.id}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction }),
      });
    } catch (error) {
      console.error("Failed to add reaction:", error);
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    try {
      await fetch(`/api/messages/${message.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to edit message:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/messages/${message.id}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  const handleForward = () => {
    // TODO: open conversation selector modal
    console.log("Forward message:", message.id);
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
        <div className="max-w-[70%] px-4 py-2 rounded-2xl bg-muted/50">
          <p className="text-sm text-muted-foreground italic">
            This message was deleted
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex ${isOwn ? "justify-end" : "justify-start"} py-0.5 group message-enter`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div
        className={`flex items-end gap-2 max-w-[70%] ${
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

        <div className={`space-y-1 ${isOwn ? "items-end" : "items-start"}`}>
          {/* Sender name */}
          {!isOwn && showAvatar && (
            <p className="text-xs text-muted-foreground font-medium px-1">
              {message.sender?.first_name} {message.sender?.last_name}
            </p>
          )}

          {/* Reply indicator */}
          {message.reply_message && (
            <div
              className={`text-xs px-3 py-1.5 rounded-lg mb-1 border-l-2 border-primary/50 ${
                isOwn
                  ? "bg-primary/20 text-primary-foreground/70"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <span className="font-medium">
                {message.reply_message.sender?.first_name}
              </span>
              <p className="truncate">
                {message.reply_message.content || "Media"}
              </p>
            </div>
          )}

          {/* Message bubble */}
          <div className="relative">
            <div
              className={`px-4 py-2 rounded-2xl break-words ${
                isOwn
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              }`}
            >
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

              {/* Text content */}
              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-transparent border border-primary-foreground/30 rounded p-1 text-sm resize-none"
                    rows={2}
                    autoFocus
                  />
                  <div className="flex gap-1 justify-end">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-xs opacity-70 hover:opacity-100 px-2 py-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleEdit}
                      className="text-xs bg-primary-foreground/20 rounded px-2 py-1"
                    >
                      Save
                    </button>
                  </div>
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
                <span className="text-[10px] opacity-60">
                  {formatTime(message.created_at)}
                </span>
                {message.is_edited && (
                  <span className="text-[10px] opacity-50">edited</span>
                )}
                {isOwn && (
                  <CheckCheck className="h-3 w-3 opacity-60" />
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
                      acc[r.reaction] = (acc[r.reaction] || 0) + 1;
                      return acc;
                    },
                    {} as Record<string, number>
                  )
                ).map(([reaction, count]) => (
                  <button
                    key={reaction}
                    onClick={() => handleReaction(reaction)}
                    className="bg-muted/80 hover:bg-muted rounded-full px-2 py-0.5 text-xs flex items-center gap-1 transition-colors"
                  >
                    {reaction} {count > 1 && count}
                  </button>
                ))}
              </div>
            )}

            {/* Action buttons */}
            {showActions && !isEditing && (
              <div
                className={`absolute top-0 ${
                  isOwn ? "-left-2 -translate-x-full" : "-right-2 translate-x-full"
                } flex items-center gap-0.5 bg-popover border rounded-lg p-0.5 shadow-lg`}
              >
                <button
                  onClick={() => handleReaction("👍")}
                  className="p-1 hover:bg-accent rounded text-xs"
                  title="React"
                >
                  <Smile className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setReplyingTo(message)}
                  className="p-1 hover:bg-accent rounded"
                  title="Reply"
                >
                  <Reply className="h-3.5 w-3.5" />
                </button>
                {isOwn && (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1 hover:bg-accent rounded"
                      title="Edit"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={handleDelete}
                      className="p-1 hover:bg-destructive/20 rounded text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
                <button
                  onClick={handleForward}
                  className="p-1 hover:bg-accent rounded"
                  title="Forward"
                >
                  <Forward className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
