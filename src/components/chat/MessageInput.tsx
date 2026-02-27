"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChatStore } from "@/stores/useChatStore";
import { Button } from "@/components/ui/button";
import {
  Send,
  Paperclip,
  Smile,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => <div className="h-[350px] w-[350px] bg-muted rounded-lg animate-pulse" />,
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

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

    // Delay adding listener to avoid the toggle click from immediately closing
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
        onSend(
          isImage ? "" : file.name,
          isImage ? "image" : "file",
          {
            url: data.data.url,
            name: data.data.name,
            size: data.data.size,
          }
        );
      }
    } catch (error) {
      console.error("Upload failed:", error);
    }
    setUploading(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEmojiClick = (emojiData: { emoji: string }) => {
    setMessage((prev) => prev + emojiData.emoji);
    textareaRef.current?.focus();
  };

  return (
    <div className="border-t border-border px-4 py-3 bg-background">
      {/* Reply preview */}
      {replyingTo && (
        <div className="flex items-center gap-2 mb-2 p-2.5 reply-input-preview">
          <div className="flex-1 min-w-0 pl-2">
            <p className="text-xs font-semibold" style={{ color: "#22d3ee" }}>
              Replying to {replyingTo.sender?.first_name}
            </p>
            <p
              className="text-xs text-muted-foreground mt-0.5 overflow-hidden"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {replyingTo.content || "Media"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
            onClick={() => setReplyingTo(null)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* File upload */}
        <div className="relative shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.mp3,.mp4"
          />
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-10 w-10 text-muted-foreground hover:text-foreground"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
        </div>

        {/* Message input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              onTyping();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="w-full resize-none rounded-2xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background placeholder:text-muted-foreground min-h-[42px] max-h-[120px]"
            rows={1}
          />
        </div>

        {/* Emoji picker */}
        <div className="relative shrink-0" ref={emojiPickerRef}>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-10 w-10 text-muted-foreground hover:text-foreground"
            onClick={() => setShowEmoji(!showEmoji)}
          >
            <Smile className="h-5 w-5" />
          </Button>
          {showEmoji && (
            <div className="absolute bottom-12 right-0 z-50">
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
        <Button
          size="icon"
          className="rounded-full shrink-0 h-10 w-10"
          onClick={handleSend}
          disabled={!message.trim() || uploading}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
