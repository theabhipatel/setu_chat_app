import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// Add members to a group conversation
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

  const { memberIds } = await request.json();

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

  // Add system message
  await serviceClient.from("messages").insert({
    conversation_id: params.id,
    sender_id: user.id,
    content: `added ${memberIds.length} member(s) to the group`,
    message_type: "system",
  });

  return NextResponse.json({ message: "Members added" }, { status: 201 });
}

// Remove a member
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

  const { error } = await serviceClient
    .from("conversation_members")
    .delete()
    .eq("conversation_id", params.id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Add system message
  const isLeaving = userId === user.id;
  await serviceClient.from("messages").insert({
    conversation_id: params.id,
    sender_id: user.id,
    content: isLeaving ? "left the group" : `removed a member from the group`,
    message_type: "system",
  });

  return NextResponse.json({ message: "Member removed" });
}
