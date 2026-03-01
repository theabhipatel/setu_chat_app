import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  getMemberRole,
  sendSystemMessage,
  getUserDisplayName,
} from "@/lib/group-helpers";

// Change a member's role (owner only)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const serviceClient = await createServiceClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only the owner can change roles
  const actorRole = await getMemberRole(serviceClient, params.id, user.id);
  if (actorRole !== "owner") {
    return NextResponse.json(
      { error: "Only the group owner can change member roles" },
      { status: 403 }
    );
  }

  const { userId, newRole } = await request.json();

  if (!userId || !newRole) {
    return NextResponse.json(
      { error: "userId and newRole are required" },
      { status: 400 }
    );
  }

  if (newRole !== "admin" && newRole !== "member") {
    return NextResponse.json(
      { error: "Role must be 'admin' or 'member'" },
      { status: 400 }
    );
  }

  // Cannot change own role
  if (userId === user.id) {
    return NextResponse.json(
      { error: "Cannot change your own role" },
      { status: 400 }
    );
  }

  // Check the target is a member of the group
  const targetRole = await getMemberRole(serviceClient, params.id, userId);
  if (!targetRole) {
    return NextResponse.json(
      { error: "User is not a member of this group" },
      { status: 404 }
    );
  }

  if (targetRole === newRole) {
    return NextResponse.json(
      { error: `User is already a ${newRole}` },
      { status: 400 }
    );
  }

  // Update role
  const { error } = await serviceClient
    .from("conversation_members")
    .update({ role: newRole })
    .eq("conversation_id", params.id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // System message
  const targetName = await getUserDisplayName(serviceClient, userId);
  if (newRole === "admin") {
    await sendSystemMessage(
      serviceClient,
      params.id,
      user.id,
      `made ${targetName} an admin`
    );
  } else {
    await sendSystemMessage(
      serviceClient,
      params.id,
      user.id,
      `removed ${targetName} as admin`
    );
  }

  // Return updated conversation
  const { data: updatedConv } = await serviceClient
    .from("conversations")
    .select(
      `
      *,
      members:conversation_members(
        *,
        profile:profiles(id, username, first_name, last_name, avatar_url, is_online, last_seen)
      )
    `
    )
    .eq("id", params.id)
    .single();

  return NextResponse.json({ data: updatedConv });
}
