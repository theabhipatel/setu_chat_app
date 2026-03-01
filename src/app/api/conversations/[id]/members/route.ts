import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  getMemberRole,
  hasPermission,
  sendSystemMessage,
  getUserDisplayName,
  getUserDisplayNames,
} from "@/lib/group-helpers";

// Add members to a group conversation (admin or owner only)
export async function POST(
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

  // Permission check — only admin or owner can add members
  const userRole = await getMemberRole(serviceClient, params.id, user.id);
  if (!hasPermission(userRole, "admin")) {
    return NextResponse.json(
      { error: "Only admins and the group owner can add members" },
      { status: 403 }
    );
  }

  const { memberIds } = await request.json();

  if (!memberIds || memberIds.length === 0) {
    return NextResponse.json(
      { error: "No members specified" },
      { status: 400 }
    );
  }

  const members = memberIds.map((userId: string) => ({
    conversation_id: params.id,
    user_id: userId,
    role: "member",
  }));

  const { error } = await serviceClient
    .from("conversation_members")
    .insert(members);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Descriptive system message with actual names
  const addedNames = await getUserDisplayNames(serviceClient, memberIds);
  await sendSystemMessage(
    serviceClient,
    params.id,
    user.id,
    `added ${addedNames} to the group`
  );

  // Return updated conversation with members
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

  return NextResponse.json({ data: updatedConv }, { status: 201 });
}

// Remove a member (permission-based)
export async function DELETE(
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

  const { userId } = await request.json();
  const isLeaving = userId === user.id;

  if (!isLeaving) {
    // Check permissions for removing others
    const actorRole = await getMemberRole(serviceClient, params.id, user.id);
    const targetRole = await getMemberRole(serviceClient, params.id, userId);

    if (!actorRole || !targetRole) {
      return NextResponse.json({ error: "User not found in group" }, { status: 404 });
    }

    // Owner can remove anyone
    // Admin can remove members only (not admins or owner)
    if (actorRole === "admin") {
      if (targetRole === "admin" || targetRole === "owner") {
        return NextResponse.json(
          { error: "Admins cannot remove other admins or the group owner" },
          { status: 403 }
        );
      }
    } else if (actorRole === "member") {
      return NextResponse.json(
        { error: "Members cannot remove other users" },
        { status: 403 }
      );
    }
    // owner can remove anyone — no restriction
  } else {
    // A user is leaving — check they're not the owner
    const actorRole = await getMemberRole(serviceClient, params.id, user.id);
    if (actorRole === "owner") {
      return NextResponse.json(
        { error: "The group owner cannot leave. Transfer ownership or delete the group instead." },
        { status: 403 }
      );
    }
  }

  const { error } = await serviceClient
    .from("conversation_members")
    .delete()
    .eq("conversation_id", params.id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Descriptive system message
  if (isLeaving) {
    await sendSystemMessage(serviceClient, params.id, user.id, "left the group");
  } else {
    const removedName = await getUserDisplayName(serviceClient, userId);
    await sendSystemMessage(
      serviceClient,
      params.id,
      user.id,
      `removed ${removedName} from the group`
    );
  }

  // Return updated conversation with members
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
