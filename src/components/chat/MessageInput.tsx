"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChatStore } from "@/stores/useChatStore";
import { toast } from "@/stores/useToastStore";
import { validateFile, getFileCategory } from "@/lib/file-validation";
import { getDraft, saveDraft, clearDraft } from "@/lib/draft-messages";
import { AttachmentMenu } from "@/components/chat/AttachmentMenu";
import { FilePreviewBar } from "@/components/chat/FilePreviewBar";
import {
  Send,
  Paperclip,
  Smile,
  X,
  Loader2,
} from "lucide-react";
import dynamic from "next/dynamic";
import type { StagedFile, UploadedFileData } from "@/types";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => (
    <div className="h-[350px] w-[350px] bg-muted rounded-lg animate-pulse" />
  ),
});

interface MessageInputProps {
  onSend: (content: string, files?: UploadedFileData[]) => void;
  onTyping: () => void;
  conversationId: string;
}

export function MessageInput({
  onSend,
  onTyping,
  conversationId,
}: MessageInputProps) {
  const { replyingTo, setReplyingTo } = useChatStore();
  const [message, setMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageRef = useRef(message);
  const isLoadingDraftRef = useRef(false);
  const prevConversationIdRef = useRef(conversationId);

  // Keep messageRef in sync for use in cleanup functions
  useEffect(() => {
    messageRef.current = message;
  }, [message]);

  // Save draft for OLD conversation and load draft for NEW conversation
  useEffect(() => {
    // Save old conversation's draft immediately before switching
    if (prevConversationIdRef.current !== conversationId) {
      saveDraft(prevConversationIdRef.current, messageRef.current);
      prevConversationIdRef.current = conversationId;
    }

    // Load draft for the new conversation
    isLoadingDraftRef.current = true;
    const draft = getDraft(conversationId);
    setMessage(draft);

    // Allow debounce saves after a tick (once message state has settled)
    requestAnimationFrame(() => {
      isLoadingDraftRef.current = false;
    });
  }, [conversationId]);

  // Debounced save to localStorage (1 second)
  useEffect(() => {
    // Skip saving during conversation switch to avoid overwriting the new draft
    if (isLoadingDraftRef.current) return;

    if (draftTimerRef.current) {
      clearTimeout(draftTimerRef.current);
    }

    draftTimerRef.current = setTimeout(() => {
      saveDraft(conversationId, message);
    }, 1000);

    return () => {
      if (draftTimerRef.current) {
        clearTimeout(draftTimerRef.current);
      }
    };
  }, [message, conversationId]);

  // Save draft immediately on tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveDraft(conversationId, messageRef.current);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [conversationId]);

  const hasContent = message.trim().length > 0 || stagedFiles.length > 0;

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

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      stagedFiles.forEach((f) => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Close attachment menu on click outside
  useEffect(() => {
    if (!showAttachMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        attachMenuRef.current &&
        !attachMenuRef.current.contains(e.target as Node)
      ) {
        setShowAttachMenu(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowAttachMenu(false);
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
  }, [showAttachMenu]);

  // Determine what file category is currently staged
  const getStagedCategory = useCallback((): "image" | "video" | "audio" | "file" | null => {
    if (stagedFiles.length === 0) return null;
    return stagedFiles[0].category;
  }, [stagedFiles]);

  const addStagedFiles = useCallback(
    (files: FileList, category: "image" | "video" | "audio" | "file") => {
      const fileArray = Array.from(files);
      const newStaged: StagedFile[] = [];
      const existingCategory = getStagedCategory();

      for (const file of fileArray) {
        // Validate each file
        const validation = validateFile(file, "chatFile");
        if (!validation.valid) {
          toast.error(validation.error!);
          continue;
        }

        const detectedCategory = getFileCategory(file);

        // FIX 4: Enforce single file type per message
        if (existingCategory && existingCategory !== detectedCategory) {
          const categoryLabels: Record<string, string> = {
            image: "photos",
            video: "a video",
            audio: "an audio file",
            file: "a file",
          };
          toast.error(
            `You already have ${categoryLabels[existingCategory]} staged. Remove ${existingCategory === "image" ? "them" : "it"} first to add ${categoryLabels[detectedCategory]}.`
          );
          return;
        }

        // Check if new files being added mix with previous new files in this batch
        if (newStaged.length > 0 && newStaged[0].category !== detectedCategory) {
          toast.error("You can only send one type of attachment per message.");
          return;
        }

        // Enforce limits by category
        if (detectedCategory === "image") {
          const currentImages = stagedFiles.filter((f) => f.category === "image");
          if (currentImages.length + newStaged.filter((f) => f.category === "image").length >= 10) {
            toast.error("Maximum 10 images allowed per message.");
            break;
          }
        } else {
          // Non-image: only 1 at a time — replace if already exists
          if (stagedFiles.some((f) => f.category === detectedCategory)) {
            // Clear existing and add new
            stagedFiles.forEach((f) => {
              if (f.preview) URL.revokeObjectURL(f.preview);
            });
            setStagedFiles([]);
          }
        }

        const staged: StagedFile = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          file,
          category: detectedCategory,
          preview:
            detectedCategory === "image"
              ? URL.createObjectURL(file)
              : undefined,
        };
        newStaged.push(staged);
      }

      if (newStaged.length > 0) {
        setStagedFiles((prev) => {
          // Non-image: replace all
          if (newStaged[0].category !== "image") {
            prev.forEach((f) => {
              if (f.preview) URL.revokeObjectURL(f.preview);
            });
            return [...newStaged];
          }
          return [...prev, ...newStaged];
        });
      }

      textareaRef.current?.focus();
    },
    [stagedFiles, getStagedCategory]
  );

  const handleRemoveStagedFile = useCallback((fileId: string) => {
    setStagedFiles((prev) => {
      const file = prev.find((f) => f.id === fileId);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter((f) => f.id !== fileId);
    });
  }, []);

  const handlePhotosSelect = useCallback(
    (files: FileList) => addStagedFiles(files, "image"),
    [addStagedFiles]
  );

  const handleVideoSelect = useCallback(
    (files: FileList) => addStagedFiles(files, "video"),
    [addStagedFiles]
  );

  const handleFileSelect = useCallback(
    (files: FileList) => addStagedFiles(files, "file"),
    [addStagedFiles]
  );

  const handleSend = useCallback(async () => {
    if (!message.trim() && stagedFiles.length === 0) return;

    const textContent = message.trim();

    // If we have files, upload them first
    if (stagedFiles.length > 0) {
      setUploading(true);

      try {
        const formData = new FormData();
        stagedFiles.forEach((sf) => formData.append("file", sf.file));
        formData.append("bucket", "chat-files");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Upload failed");
          setUploading(false);
          return;
        }

        // Normalize response to array
        const uploadedArray = Array.isArray(data.data)
          ? data.data
          : [data.data];

        const uploadedFiles: UploadedFileData[] = uploadedArray.map(
          (
            f: { url: string; name: string; size: number; mime_type: string },
            i: number
          ) => ({
            url: f.url,
            name: f.name,
            size: f.size,
            file_type: stagedFiles[i]?.category || "file",
            mime_type: f.mime_type || stagedFiles[i]?.file.type || "",
          })
        );

        onSend(textContent, uploadedFiles);
      } catch (error) {
        console.error("Upload failed:", error);
        toast.error("Upload failed. Please try again.");
        setUploading(false);
        return;
      }

      setUploading(false);
    } else {
      // Text-only message
      onSend(textContent);
    }

    // Cleanup
    setMessage("");
    clearDraft(conversationId);
    stagedFiles.forEach((f) => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });
    setStagedFiles([]);
    setReplyingTo(null);
    setShowEmoji(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [message, stagedFiles, onSend, setReplyingTo, conversationId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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

      {/* Staged files preview */}
      <FilePreviewBar files={stagedFiles} onRemove={handleRemoveStagedFile} />

      {/* Unified input container */}
      <div className={`msg-input-container ${isFocused ? "focused" : ""}`}>
        {/* Attach button (left side) */}
        <div className="relative" ref={attachMenuRef}>
          <button
            className="msg-input-action-btn attach-btn group"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
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

          {showAttachMenu && (
            <AttachmentMenu
              onPhotosSelect={handlePhotosSelect}
              onVideoSelect={handleVideoSelect}
              onFileSelect={handleFileSelect}
              onClose={() => setShowAttachMenu(false)}
            />
          )}
        </div>

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
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
