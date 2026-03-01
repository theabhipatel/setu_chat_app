import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getMemberRole, hasPermission, sendSystemMessage, getUserDisplayName } from "@/lib/group-helpers";

// Get conversation details
export async function GET(
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

  const { data, error } = await serviceClient
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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// Update conversation (group only — admin or owner)
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

  // Permission check — only admin or owner can update
  const userRole = await getMemberRole(serviceClient, params.id, user.id);
  if (!hasPermission(userRole, "admin")) {
    return NextResponse.json(
      { error: "Only admins and the group owner can update group settings" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};
  const systemMessages: string[] = [];

  // Get current conversation for comparison
  const { data: currentConv } = await serviceClient
    .from("conversations")
    .select("name, avatar_url")
    .eq("id", params.id)
    .single();

  if (body.name !== undefined && body.name !== currentConv?.name) {
    updates.name = body.name;
    systemMessages.push(`changed the group name to "${body.name}"`);
  }
  if (body.description !== undefined) updates.description = body.description;
  if (body.avatar_url !== undefined && body.avatar_url !== currentConv?.avatar_url) {
    updates.avatar_url = body.avatar_url;
    if (body.avatar_url) {
      systemMessages.push("changed the group photo");
    } else {
      systemMessages.push("removed the group photo");
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ data: currentConv });
  }

  const { data, error } = await serviceClient
    .from("conversations")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Send system messages for changes
  for (const msg of systemMessages) {
    await sendSystemMessage(serviceClient, params.id, user.id, msg);
  }

  return NextResponse.json({ data });
}

// Soft delete conversation (owner only)
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

  // Check if this is a group — only owner can delete groups
  const { data: conv } = await serviceClient
    .from("conversations")
    .select("type, created_by")
    .eq("id", params.id)
    .single();

  if (conv?.type === "group") {
    const userRole = await getMemberRole(serviceClient, params.id, user.id);
    if (userRole !== "owner") {
      return NextResponse.json(
        { error: "Only the group owner can delete the group" },
        { status: 403 }
      );
    }

    // Send system message before soft deleting
    await sendSystemMessage(serviceClient, params.id, user.id, "deleted this group");

    // Soft delete
    const { error } = await serviceClient
      .from("conversations")
      .update({ is_deleted: true })
      .eq("id", params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Group deleted" });
  }

  // For non-group conversations, keep existing behavior
  const { error } = await serviceClient
    .from("conversations")
    .delete()
    .eq("id", params.id)
    .eq("created_by", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Conversation deleted" });
}
