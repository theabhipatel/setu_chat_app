"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { MessageInput } from "@/components/chat/MessageInput";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { MessageListSkeleton } from "@/components/shared/LoadingSkeleton";
import { ForwardMessageModal } from "@/components/chat/ForwardMessageModal";
import { getFailedMessages, addFailedMessage, removeFailedMessage } from "@/lib/failed-messages";
import type { MessageWithSender, ConversationWithDetails, UploadedFileData, OtherReadReceipt, MessageStatus, MessageReceiptDetail } from "@/types";
import { Loader2, ChevronDown } from "lucide-react";

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;
  const { user } = useAuthStore();
  const {
    messages,
    setMessages,
    addMessage,
    prependMessages,
    activeConversation,
    setActiveConversation,
    replyingTo,
    resetUnreadCount,
  } = useChatStore();

  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // New message indicator state (for messages arriving while scrolled up)
  const [newMessageCount, setNewMessageCount] = useState(0);
  const prevMessageCountRef = useRef(0);

  // For scrolling to unread divider
  const hasScrolledToUnread = useRef(false);
  const unreadDividerRef = useRef<HTMLDivElement>(null);

  // Ref to track typing indicator element
  const typingIndicatorRef = useRef<HTMLDivElement>(null);

  // Realtime hooks
  useRealtimeMessages(conversationId);
  const { typingUsers, sendTyping } = useTypingIndicator(conversationId);

  // Reset unread count in sidebar when entering a conversation
  useEffect(() => {
    resetUnreadCount(conversationId);
    hasScrolledToUnread.current = false;
    setUnreadCount(0);
    setNewMessageCount(0);
  }, [conversationId, resetUnreadCount]);


  // Load conversation details
  useEffect(() => {
    const loadConversation = async () => {
      try {
        const res = await fetch(`/api/conversations/${conversationId}`);
        const data = await res.json();
        if (data.data) {
          setActiveConversation(data.data as ConversationWithDetails);
        }
      } catch (error) {
        console.error("Failed to load conversation:", error);
        router.push("/chat");
      }
    };

    loadConversation();
  }, [conversationId, setActiveConversation, router]);

  // Helper: compute per-user receipt details for a single own message
  const computeReceiptDetails = useCallback(
    (
      msg: MessageWithSender,
      receipts: OtherReadReceipt[],
      otherMembers: { user_id: string; first_name: string; last_name: string }[]
    ): MessageReceiptDetail[] => {
      return otherMembers.map((member) => {
        const receipt = receipts.find((r) => r.user_id === member.user_id);
        let status: "sent" | "delivered" | "read" = "sent";
        if (receipt) {
          if (receipt.last_read_at && msg.created_at <= receipt.last_read_at) {
            status = "read";
          } else if (receipt.delivered_at && msg.created_at <= receipt.delivered_at) {
            // User's browser received the message but they haven't opened the chat
            status = "delivered";
          }
          // If neither read nor delivered → stays "sent"
        }
        return {
          user_id: member.user_id,
          first_name: member.first_name,
          last_name: member.last_name,
          status,
        };
      });
    },
    []
  );

  // Helper: compute aggregate status from per-user receipt details
  const getAggregateStatus = useCallback(
    (details: MessageReceiptDetail[]): MessageStatus => {
      if (details.length === 0) return "sent";
      if (details.every((d) => d.status === "read")) return "read";
      if (details.every((d) => d.status === "read" || d.status === "delivered"))
        return "delivered";
      return "sent";
    },
    []
  );

  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/conversations/${conversationId}/messages?limit=50`
        );
        const data = await res.json();
        if (data.data) {
          const receipts: OtherReadReceipt[] = data.otherReadReceipts || [];
          const conversation = useChatStore.getState().activeConversation;

          // Build other members list for receipt details
          const otherMembers = (conversation?.members || [])
            .filter((m) => m.user_id !== user?.id)
            .map((m) => ({
              user_id: m.user_id,
              first_name: m.profile.first_name,
              last_name: m.profile.last_name,
            }));

          const isGroup = conversation?.type === "group";

          const messagesWithStatus = (data.data as MessageWithSender[]).map(
            (msg) => {
              if (msg.sender_id !== user?.id) return msg;

              // Compute per-user receipt details
              const details = computeReceiptDetails(msg, receipts, otherMembers);
              const aggregateStatus = getAggregateStatus(details);

              return {
                ...msg,
                status: aggregateStatus,
                // Only attach details for group chats (private shows simple tooltip)
                receiptDetails: isGroup ? details : undefined,
              };
            }
          );

          // Merge in any failed messages from localStorage
          const savedFailed = getFailedMessages(conversationId);
          const allMessages = [...messagesWithStatus, ...savedFailed];

          setMessages(allMessages);
          setHasMore(data.hasMore);
          setCursor(data.nextCursor);
          // API returns the unread count (calculated BEFORE marking read)
          if (data.unreadCount > 0) {
            setUnreadCount(data.unreadCount);
          }
          // Initialize prevMessageCount
          prevMessageCountRef.current = allMessages.length;
        }
      } catch (error) {
        console.error("Failed to load messages:", error);
      }
      setIsLoading(false);
    };

    loadMessages();

    return () => {
      setMessages([]);
      setActiveConversation(null);
    };
  }, [conversationId, setMessages, setActiveConversation, computeReceiptDetails, getAggregateStatus]);

  // Smart scroll: scroll to unread divider or bottom after messages load
  useEffect(() => {
    if (isLoading || messages.length === 0 || hasScrolledToUnread.current)
      return;

    hasScrolledToUnread.current = true;

    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      if (unreadCount > 0 && unreadDividerRef.current && containerRef.current) {
        const container = containerRef.current;
        const divider = unreadDividerRef.current;
        const containerHeight = container.clientHeight;
        const dividerOffset = divider.offsetTop;

        // Position the divider in the upper-middle portion of the viewport
        const scrollTarget = dividerOffset - containerHeight * 0.35;
        container.scrollTop = Math.max(0, scrollTarget);
      } else if (containerRef.current) {
        // No unread messages — scroll to bottom
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    });
  }, [isLoading, messages.length, unreadCount]);

  // Load more messages
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !cursor) return;
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/messages?limit=50&cursor=${cursor}`
      );
      const data = await res.json();
      if (data.data) {
        prependMessages(data.data as MessageWithSender[]);
        setHasMore(data.hasMore);
        setCursor(data.nextCursor);
      }
    } catch (error) {
      console.error("Failed to load more messages:", error);
    }
    setLoadingMore(false);
  }, [loadingMore, hasMore, cursor, conversationId, prependMessages]);

  const { containerRef, scrollToBottom, isAtBottom } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    isLoading: loadingMore,
    direction: "up",
  });

  // Listen for "scroll to message" events (when user clicks a reply preview)
  useEffect(() => {
    const handleScrollToMessage = (e: Event) => {
      const { messageId } = (e as CustomEvent).detail;
      if (!messageId || !containerRef.current) return;

      const messageEl = containerRef.current.querySelector(
        `[data-message-id="${messageId}"]`
      ) as HTMLElement | null;

      if (messageEl) {
        // Scroll the message into view
        messageEl.scrollIntoView({ behavior: "smooth", block: "center" });

        // Remove class first to allow re-triggering the animation
        messageEl.classList.remove("message-highlight");
        // Force reflow so the browser registers the removal
        void messageEl.offsetWidth;
        // Add highlight class
        messageEl.classList.add("message-highlight");

        // Remove highlight after animation completes
        setTimeout(() => {
          messageEl.classList.remove("message-highlight");
        }, 3200);
      }
    };

    window.addEventListener("scroll-to-message", handleScrollToMessage);
    return () =>
      window.removeEventListener("scroll-to-message", handleScrollToMessage);
  }, [containerRef]);

  // Smart auto-scroll on new messages
  useEffect(() => {
    if (messages.length === 0 || isLoading) return;
    
    const currentCount = messages.length;
    const prevCount = prevMessageCountRef.current;
    
    // Only act if new message(s) were added (not prepended from load-more)
    if (currentCount > prevCount && prevCount > 0) {
      const lastMessage = messages[messages.length - 1];
      const isSelfMessage = lastMessage.sender_id === user?.id;

      if (isSelfMessage || isAtBottom) {
        // Auto-scroll if it's our own message OR we're already at the bottom
        requestAnimationFrame(() => {
          scrollToBottom();
        });
        // Reset new message count when auto-scrolling
        setNewMessageCount(0);
      } else {
        // Not at bottom and received someone else's message — increment counter
        setNewMessageCount((prev) => prev + (currentCount - prevCount));
      }
    }

    prevMessageCountRef.current = currentCount;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, user?.id, isAtBottom]);

  // Auto-scroll to show typing indicator when user is at the bottom
  useEffect(() => {
    if (typingUsers.length > 0 && isAtBottom) {
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typingUsers.length, isAtBottom]);

  // Reset new message count when user scrolls to bottom
  useEffect(() => {
    if (isAtBottom) {
      setNewMessageCount(0);
    }
  }, [isAtBottom]);

  // Handle scroll to bottom button click
  const handleScrollToBottomClick = useCallback(() => {
    scrollToBottom(true); // smooth scroll
    setNewMessageCount(0);
  }, [scrollToBottom]);

  // Send message (new signature: content + optional files array)
  const handleSendMessage = async (
    content: string,
    files?: UploadedFileData[]
  ) => {
    if (!user) return;

    // Capture replyingTo IMMEDIATELY before it gets cleared
    const currentReplyingTo = useChatStore.getState().replyingTo;
    // Guard: don't send temp IDs as reply_to (FK would fail)
    const replyToId =
      currentReplyingTo?.id && !currentReplyingTo.id.startsWith("temp-")
        ? currentReplyingTo.id
        : null;

    // Clear the unread divider once user sends a message
    setUnreadCount(0);

    // Determine message_type from files
    let messageType: "text" | "image" | "video" | "audio" | "file" = "text";
    if (files && files.length > 0) {
      const firstFileType = files[0].file_type;
      messageType = firstFileType;
    }

    // Build initial receipt details for group chats (all members start as "sent")
    const isGroup = activeConversation?.type === "group";
    const initialReceiptDetails = isGroup
      ? (activeConversation?.members || [])
          .filter((m) => m.user_id !== user.id)
          .map((m) => ({
            user_id: m.user_id,
            first_name: m.profile.first_name,
            last_name: m.profile.last_name,
            status: "sent" as const,
          }))
      : undefined;

    // Optimistic update
    const optimisticMessage: MessageWithSender = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: user.id,
      content: content || null,
      message_type: messageType,
      reply_to: replyToId,
      forwarded_from: null,
      is_edited: false,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: user,
      reply_message: currentReplyingTo || undefined,
      status: "sending" as MessageStatus,
      receiptDetails: initialReceiptDetails,
      files: files?.map((f, i) => ({
        id: `temp-file-${i}`,
        message_id: `temp-${Date.now()}`,
        file_url: f.url,
        file_name: f.name,
        file_size: f.size,
        file_type: f.file_type,
        mime_type: f.mime_type,
        display_order: i,
        created_at: new Date().toISOString(),
      })),
    };

    addMessage(optimisticMessage);
    scrollToBottom();

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content || null,
          message_type: messageType,
          reply_to: replyToId,
          files: files?.map((f) => ({
            url: f.url,
            name: f.name,
            size: f.size,
            file_type: f.file_type,
            mime_type: f.mime_type,
          })),
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        console.error("Failed to send message:", errData);
        // Mark as failed and persist
        const failedMsg = { ...optimisticMessage, status: "failed" as MessageStatus };
        useChatStore.getState().updateMessage(optimisticMessage.id, { status: "failed" });
        addFailedMessage(conversationId, failedMsg);
      } else {
        // Replace temp ID with real ID from the server, mark as sent
        const { data: savedMessage } = await res.json();
        if (savedMessage?.id) {
          useChatStore.getState().updateMessage(optimisticMessage.id, {
            ...savedMessage,
            status: "sent",
            reply_message: optimisticMessage.reply_message,
            receiptDetails: optimisticMessage.receiptDetails,
          });
          // In case this was a retry, remove from failed storage
          removeFailedMessage(conversationId, optimisticMessage.id);
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      // Mark as failed and persist
      const failedMsg = { ...optimisticMessage, status: "failed" as MessageStatus };
      useChatStore.getState().updateMessage(optimisticMessage.id, { status: "failed" });
      addFailedMessage(conversationId, failedMsg);
    }
  };

  // Retry sending a failed message
  const handleRetry = async (failedMessage: MessageWithSender) => {
    if (!user) return;

    // Update UI to show "sending" again
    useChatStore.getState().updateMessage(failedMessage.id, { status: "sending" });

    const replyToId =
      failedMessage.reply_to && !failedMessage.reply_to.startsWith("temp-")
        ? failedMessage.reply_to
        : null;

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: failedMessage.content || null,
          message_type: failedMessage.message_type,
          reply_to: replyToId,
          files: failedMessage.files?.map((f) => ({
            url: f.file_url,
            name: f.file_name,
            size: f.file_size,
            file_type: f.file_type,
            mime_type: f.mime_type,
          })),
        }),
      });

      if (!res.ok) {
        console.error("Retry failed:", await res.json());
        useChatStore.getState().updateMessage(failedMessage.id, { status: "failed" });
      } else {
        const { data: savedMessage } = await res.json();
        if (savedMessage?.id) {
          useChatStore.getState().updateMessage(failedMessage.id, {
            ...savedMessage,
            status: "sent",
            reply_message: failedMessage.reply_message,
            receiptDetails: failedMessage.receiptDetails,
          });
          // Remove from localStorage on success
          removeFailedMessage(conversationId, failedMessage.id);
        }
      }
    } catch (error) {
      console.error("Retry failed:", error);
      useChatStore.getState().updateMessage(failedMessage.id, { status: "failed" });
    }
  };

  // Calculate where to place the unread divider
  const unreadDividerIndex =
    unreadCount > 0 && messages.length > 0
      ? messages.length - unreadCount
      : -1;

  // Show scroll-to-bottom button when not at bottom
  const showScrollButton = !isAtBottom && !isLoading;

  if (!activeConversation) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2
          className="h-8 w-8 text-primary"
          style={{ animation: "spin 1s linear infinite" }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ChatHeader conversation={activeConversation} />

      {/* Messages container wrapper (relative for FAB positioning) */}
      <div className="relative flex-1">
        <div
          ref={containerRef}
          className="absolute inset-0 overflow-y-auto px-4 py-2"
        >
          {loadingMore && (
            <div className="flex justify-center py-2">
              <Loader2
                className="h-5 w-5 text-primary"
                style={{ animation: "spin 1s linear infinite" }}
              />
            </div>
          )}

          {isLoading ? (
            <MessageListSkeleton />
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">
                  No messages yet. Start the conversation! 👋
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-1 pb-6">
              {messages.map((message, index) => (
                <div key={message.id}>
                  {/* Unread messages divider */}
                  {index === unreadDividerIndex && unreadDividerIndex > 0 && (
                    <div
                      ref={unreadDividerRef}
                      className="flex items-center gap-3 my-4 px-2"
                    >
                      <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-primary/60 to-primary/60" />
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                        <ChevronDown className="h-3 w-3 text-primary" />
                        <span className="text-xs font-medium text-primary whitespace-nowrap">
                          {unreadCount} unread message{unreadCount > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent via-primary/60 to-primary/60" />
                    </div>
                  )}
                  <MessageBubble
                    message={message}
                    isOwn={message.sender_id === user?.id}
                    showAvatar={
                      index === 0 ||
                      messages[index - 1]?.sender_id !== message.sender_id
                    }
                    members={activeConversation?.members}
                    onRetry={handleRetry}
                  />
                </div>
              ))}
            </div>
          )}

          {typingUsers.length > 0 && (
            <div ref={typingIndicatorRef}>
              <TypingIndicator users={typingUsers} />
            </div>
          )}
        </div>

        {/* Scroll to bottom FAB */}
        {showScrollButton && (
          <button
            onClick={handleScrollToBottomClick}
            className="scroll-to-bottom-btn"
            aria-label="Scroll to bottom"
          >
            <ChevronDown className="h-5 w-5" />
            {newMessageCount > 0 && (
              <span className="new-message-badge">
                {newMessageCount > 99 ? "99+" : newMessageCount}
              </span>
            )}
          </button>
        )}
      </div>

      <MessageInput
        onSend={handleSendMessage}
        onTyping={sendTyping}
        conversationId={conversationId}
      />

      {/* Forward message modal */}
      <ForwardMessageModal />
    </div>
  );
}
