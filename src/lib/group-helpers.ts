import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Get the role of a user in a conversation.
 * Returns "owner" | "admin" | "member" | null (null = not a member)
 */
export async function getMemberRole(
  serviceClient: SupabaseClient,
  conversationId: string,
  userId: string
): Promise<"owner" | "admin" | "member" | null> {
  const { data } = await serviceClient
    .from("conversation_members")
    .select("role")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .single();

  return data?.role || null;
}

/**
 * Send a system message in a conversation and update last_message_at.
 */
export async function sendSystemMessage(
  serviceClient: SupabaseClient,
  conversationId: string,
  senderId: string,
  content: string
) {
  await serviceClient.from("messages").insert({
    conversation_id: conversationId,
    sender_id: senderId,
    content,
    message_type: "system",
  });

  await serviceClient
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);
}

/**
 * Get display name for a user by ID (e.g. "Abhi Patel")
 */
export async function getUserDisplayName(
  serviceClient: SupabaseClient,
  userId: string
): Promise<string> {
  const { data } = await serviceClient
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", userId)
    .single();

  if (!data) return "Unknown User";
  return `${data.first_name} ${data.last_name}`.trim();
}

/**
 * Get display names for multiple user IDs.
 * Returns a comma-separated string: "Abhi Patel, Rahul S. and Priya K."
 */
export async function getUserDisplayNames(
  serviceClient: SupabaseClient,
  userIds: string[]
): Promise<string> {
  const { data } = await serviceClient
    .from("profiles")
    .select("id, first_name, last_name")
    .in("id", userIds);

  if (!data || data.length === 0) return "Unknown User";

  const names = userIds.map((id) => {
    const profile = data.find((p) => p.id === id);
    return profile
      ? `${profile.first_name} ${profile.last_name}`.trim()
      : "Unknown User";
  });

  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/**
 * Check if a user has at least the required permission level.
 * Permission hierarchy: owner > admin > member
 */
export function hasPermission(
  userRole: "owner" | "admin" | "member" | null,
  requiredLevel: "owner" | "admin" | "member"
): boolean {
  if (!userRole) return false;
  const hierarchy = { owner: 3, admin: 2, member: 1 };
  return hierarchy[userRole] >= hierarchy[requiredLevel];
}
