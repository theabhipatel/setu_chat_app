import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// Get 5 most recently active users as suggestions
export async function GET() {
  const supabase = await createClient();
  const serviceClient = await createServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get users the current user already has private conversations with
  const { data: existingMembers } = await serviceClient
    .from("conversation_members")
    .select("conversation_id")
    .eq("user_id", user.id);

  let excludeUserIds: string[] = [user.id];

  if (existingMembers && existingMembers.length > 0) {
    const conversationIds = existingMembers.map((m) => m.conversation_id);

    // Get private conversations only
    const { data: privateConvs } = await serviceClient
      .from("conversations")
      .select("id")
      .in("id", conversationIds)
      .eq("type", "private");

    if (privateConvs && privateConvs.length > 0) {
      const privateConvIds = privateConvs.map((c) => c.id);

      // Get user IDs from those private conversations
      const { data: otherMembers } = await serviceClient
        .from("conversation_members")
        .select("user_id")
        .in("conversation_id", privateConvIds)
        .neq("user_id", user.id);

      if (otherMembers) {
        excludeUserIds = [
          ...excludeUserIds,
          ...otherMembers.map((m) => m.user_id),
        ];
      }
    }
  }

  // Fetch 5 most recently active users, excluding self and existing contacts
  const { data, error } = await serviceClient
    .from("profiles")
    .select(
      "id, username, first_name, last_name, full_name, avatar_url, is_online, last_seen"
    )
    .not("id", "in", `(${excludeUserIds.join(",")})`)
    .not("username", "is", null)
    .order("last_seen", { ascending: false, nullsFirst: false })
    .limit(5);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
}
