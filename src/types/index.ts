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
  pinned_at: string | null;
}

export interface MessageFile {
  id: string;
  message_id: string;
  file_url: string;
  file_name: string;
  file_size: number | null;
  file_type: "image" | "video" | "audio" | "file";
  mime_type: string | null;
  display_order: number;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  message_type: "text" | "image" | "file" | "video" | "audio" | "system";
  reply_to: string | null;
  forwarded_from: string | null;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed";

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

// Per-user receipt detail (for group chat hover tooltip)
export interface MessageReceiptDetail {
  user_id: string;
  first_name: string;
  last_name: string;
  status: "sent" | "delivered" | "read";
}

// Extended types for joined queries
export interface MessageWithSender extends Message {
  sender: Profile;
  reply_message?: Message & { sender: Profile };
  forwarded_message?: { id: string; content: string | null; message_type: string; sender_id: string; created_at: string; sender: Profile };
  reactions?: MessageReaction[];
  files?: MessageFile[];
  status?: MessageStatus;
  receiptDetails?: MessageReceiptDetail[];
}

// Read receipt info for the other user(s) — returned by the messages API
export interface OtherReadReceipt {
  user_id: string;
  last_read_at: string;
  last_read_message_id: string | null;
  delivered_at: string | null;
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

// Client-side staged file for attachment preview
export interface StagedFile {
  id: string;
  file: File;
  preview?: string; // object URL for image thumbnails
  category: "image" | "video" | "audio" | "file";
}

// Data returned after a successful upload
export interface UploadedFileData {
  url: string;
  name: string;
  size: number;
  file_type: "image" | "video" | "audio" | "file";
  mime_type: string;
}

// Multi-session management
export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  device_name: string;
  device_type:
    | "desktop_app"
    | "desktop_browser"
    | "mobile_app"
    | "mobile_browser"
    | "tablet_browser";
  browser_name: string | null;
  os_name: string | null;
  ip_address: string | null;
  location: string | null;
  is_current?: boolean; // computed client-side
  last_active_at: string;
  created_at: string;
}
