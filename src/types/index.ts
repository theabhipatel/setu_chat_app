// ============================================
// TypeScript Types for Setu Chat Application
// ============================================

export interface Profile {
  id: string;
  email: string;
  username: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar_url: string | null;
  auth_provider: "email" | "google";
  is_email_verified: boolean;
  is_online: boolean;
  last_seen: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  type: "private" | "group" | "self";
  name: string | null;
  description: string | null;
  avatar_url: string | null;
  created_by: string | null;
  is_deleted: boolean;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  message_type: "text" | "image" | "file" | "system";
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  reply_to: string | null;
  forwarded_from: string | null;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction: string;
  created_at: string;
}

export interface ReadReceipt {
  id: string;
  conversation_id: string;
  user_id: string;
  last_read_message_id: string | null;
  last_read_at: string;
}

export interface PinnedMessage {
  id: string;
  conversation_id: string;
  message_id: string;
  pinned_by: string;
  pinned_at: string;
}

export interface VerificationToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

// Extended types for joined queries
export interface MessageWithSender extends Message {
  sender: Profile;
  reply_message?: Message & { sender: Profile };
  forwarded_message?: { id: string; content: string | null; message_type: string; sender_id: string; created_at: string; sender: Profile };
  reactions?: MessageReaction[];
}

export interface ConversationWithDetails extends Conversation {
  members: (ConversationMember & { profile: Profile })[];
  last_message?: MessageWithSender;
  unread_count?: number;
}

// API types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface SearchResult {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar_url: string | null;
  is_online: boolean;
}

export interface TypingUser {
  user_id: string;
  username: string;
  timestamp: number;
}
