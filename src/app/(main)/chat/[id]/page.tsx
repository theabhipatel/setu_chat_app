"use client";

import { useEffect, useState, useCallback } from "react";
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
import type { MessageWithSender, ConversationWithDetails } from "@/types";
import { Loader2 } from "lucide-react";

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
  } = useChatStore();

  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);

  // Realtime hooks
  useRealtimeMessages(conversationId);
  const { typingUsers, sendTyping } = useTypingIndicator(conversationId);

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
          setMessages(data.data as MessageWithSender[]);
          setHasMore(data.hasMore);
          setCursor(data.nextCursor);
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
  }, [conversationId, setMessages, setActiveConversation]);

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

  const { containerRef, scrollToBottom } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    isLoading: loadingMore,
    direction: "up",
  });

  // Scroll to bottom on new message from self
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender_id === user?.id) {
        scrollToBottom();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, user?.id, scrollToBottom]);

  // Send message
  const handleSendMessage = async (
    content: string,
    messageType: string = "text",
    fileData?: { url: string; name: string; size: number }
  ) => {
    if (!user) return;

    // Optimistic update
    const optimisticMessage: MessageWithSender = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      message_type: messageType as "text" | "image" | "file",
      file_url: fileData?.url || null,
      file_name: fileData?.name || null,
      file_size: fileData?.size || null,
      reply_to: replyingTo?.id || null,
      forwarded_from: null,
      is_edited: false,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: user,
      reply_message: replyingTo || undefined,
    };

    addMessage(optimisticMessage);
    scrollToBottom();

    try {
      await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          message_type: messageType,
          file_url: fileData?.url,
          file_name: fileData?.name,
          file_size: fileData?.size,
          reply_to: replyingTo?.id,
        }),
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  if (!activeConversation) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ChatHeader conversation={activeConversation} />

      {/* Messages */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-2"
      >
        {loadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
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
          <div className="space-y-1">
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender_id === user?.id}
                showAvatar={
                  index === 0 ||
                  messages[index - 1]?.sender_id !== message.sender_id
                }
              />
            ))}
          </div>
        )}

        {typingUsers.length > 0 && (
          <TypingIndicator users={typingUsers} />
        )}
      </div>

      <MessageInput
        onSend={handleSendMessage}
        onTyping={sendTyping}
        conversationId={conversationId}
      />
    </div>
  );
}
