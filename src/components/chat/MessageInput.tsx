"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChatStore } from "@/stores/useChatStore";
import {
  Send,
  Paperclip,
  Smile,
  X,
  Loader2,
} from "lucide-react";
import dynamic from "next/dynamic";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => (
    <div className="h-[350px] w-[350px] bg-muted rounded-lg animate-pulse" />
  ),
});

interface MessageInputProps {
  onSend: (
    content: string,
    messageType?: string,
    fileData?: { url: string; name: string; size: number }
  ) => void;
  onTyping: () => void;
  conversationId: string;
}

export function MessageInput({
  onSend,
  onTyping,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  conversationId: _conversationId,
}: MessageInputProps) {
  const { replyingTo, setReplyingTo } = useChatStore();
  const [message, setMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const hasContent = message.trim().length > 0;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [message]);

  // Auto-focus textarea when replying
  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingTo]);

  // Close emoji picker on click outside
  useEffect(() => {
    if (!showEmoji) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target as Node)
      ) {
        setShowEmoji(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowEmoji(false);
        textareaRef.current?.focus();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showEmoji]);

  const handleSend = useCallback(() => {
    if (!message.trim()) return;
    onSend(message.trim());
    setMessage("");
    setReplyingTo(null);
    setShowEmoji(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [message, onSend, setReplyingTo]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const isImage = file.type.startsWith("image/");
    formData.append("bucket", isImage ? "chat-images" : "chat-files");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.data) {
        onSend(isImage ? "" : file.name, isImage ? "image" : "file", {
          url: data.data.url,
          name: data.data.name,
          size: data.data.size,
        });
      }
    } catch (error) {
      console.error("Upload failed:", error);
    }
    setUploading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEmojiClick = (emojiData: { emoji: string }) => {
    setMessage((prev) => prev + emojiData.emoji);
    textareaRef.current?.focus();
  };

  return (
    <div className="msg-input-wrapper">
      {/* Reply preview */}
      {replyingTo && (
        <div className="msg-input-reply-preview">
          <div className="msg-input-reply-bar" />
          <div className="flex-1 min-w-0">
            <p className="msg-input-reply-name">
              Replying to {replyingTo.sender?.first_name}
            </p>
            <p className="msg-input-reply-text">
              {replyingTo.content || "Media"}
            </p>
          </div>
          <button
            className="msg-input-reply-close"
            onClick={() => setReplyingTo(null)}
            aria-label="Cancel reply"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Unified input container */}
      <div className={`msg-input-container ${isFocused ? "focused" : ""}`}>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileUpload}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.mp3,.mp4"
        />

        {/* Attach button (left side) */}
        <button
          className="msg-input-action-btn attach-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          aria-label="Attach file"
          title="Attach file"
        >
          {uploading ? (
            <Loader2 className="h-[18px] w-[18px] animate-spin" />
          ) : (
            <Paperclip className="h-[18px] w-[18px]" />
          )}
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            onTyping();
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Type a message..."
          className="msg-input-textarea"
          rows={1}
        />

        {/* Right actions */}
        <div className="msg-input-right-actions">
          {/* Emoji picker */}
          <div className="relative" ref={emojiPickerRef}>
            <button
              className={`msg-input-action-btn emoji-btn ${showEmoji ? "active" : ""}`}
              onClick={() => setShowEmoji(!showEmoji)}
              aria-label="Emoji"
              title="Emoji"
            >
              <Smile className="h-[18px] w-[18px]" />
            </button>
            {showEmoji && (
              <div className="msg-input-emoji-dropdown">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  // @ts-expect-error - theme type mismatch
                  theme="auto"
                  height={350}
                  width={350}
                  searchPlaceHolder="Search emoji..."
                />
              </div>
            )}
          </div>

          {/* Send button */}
          <button
            className={`msg-input-send-btn ${hasContent ? "active" : ""}`}
            onClick={handleSend}
            disabled={!hasContent || uploading}
            aria-label="Send message"
            title="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
