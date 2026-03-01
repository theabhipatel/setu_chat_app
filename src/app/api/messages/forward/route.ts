import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// Forward a message to multiple conversations and/or users
export async function POST(request: Request) {
  const supabase = await createClient();
  const serviceClient = await createServiceClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    messageId,
    conversationIds = [],
    userIds = [],
  } = body as {
    messageId: string;
    conversationIds: string[];
    userIds: string[];
  };

  console.log("[Forward] Request:", { messageId, conversationIds, userIds });

  if (!messageId) {
    return NextResponse.json(
      { error: "messageId is required" },
      { status: 400 }
    );
  }

  if (conversationIds.length === 0 && userIds.length === 0) {
    return NextResponse.json(
      { error: "At least one recipient is required" },
      { status: 400 }
    );
  }

  // Fetch the original message
  const { data: originalMessage, error: msgError } = await serviceClient
    .from("messages")
    .select("*")
    .eq("id", messageId)
    .single();

  if (msgError || !originalMessage) {
    console.error("[Forward] Original message not found:", msgError?.message);
    return NextResponse.json(
      { error: "Message not found" },
      { status: 404 }
    );
  }

  console.log("[Forward] Original message found:", originalMessage.id, "type:", originalMessage.message_type);

  // Collect all target conversation IDs
  const targetConversationIds = [...conversationIds];

  // For each userId, find or create a private conversation
  for (const targetUserId of userIds) {
    let foundConvId: string | null = null;

    // Check if a private conversation already exists between current user and target
    const { data: myMemberships } = await serviceClient
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (myMemberships) {
      for (const membership of myMemberships) {
        const { data: conv } = await serviceClient
          .from("conversations")
          .select("id, type")
          .eq("id", membership.conversation_id)
          .eq("type", "private")
          .single();

        if (conv) {
          const { data: otherMember } = await serviceClient
            .from("conversation_members")
            .select("user_id")
            .eq("conversation_id", conv.id)
            .eq("user_id", targetUserId)
            .single();

          if (otherMember) {
            foundConvId = conv.id;
            break;
          }
        }
      }
    }

    // If no existing conversation, create one
    if (!foundConvId) {
      console.log("[Forward] Creating new private conversation with:", targetUserId);
      const { data: newConv, error: convError } = await serviceClient
        .from("conversations")
        .insert({
          type: "private",
          created_by: user.id,
        })
        .select()
        .single();

      if (convError || !newConv) {
        console.error("[Forward] Failed to create conversation:", convError?.message);
        continue;
      }

      const { error: membersError } = await serviceClient.from("conversation_members").insert([
        { conversation_id: newConv.id, user_id: user.id, role: "member" },
        { conversation_id: newConv.id, user_id: targetUserId, role: "member" },
      ]);

      if (membersError) {
        console.error("[Forward] Failed to add members:", membersError.message);
        continue;
      }

      foundConvId = newConv.id;
    }

    if (foundConvId) {
      targetConversationIds.push(foundConvId);
    }
  }

  console.log("[Forward] Target conversations:", targetConversationIds);

  // Send forwarded message to each conversation
  const results = [];
  const errors = [];
  for (const convId of targetConversationIds) {
    const insertData: Record<string, unknown> = {
      conversation_id: convId,
      sender_id: user.id,
      content: originalMessage.content,
      message_type: originalMessage.message_type || "text",
      file_url: originalMessage.file_url || null,
      file_name: originalMessage.file_name || null,
      file_size: originalMessage.file_size || null,
      forwarded_from: originalMessage.id,
    };

    console.log("[Forward] Inserting message to conv:", convId);

    const { data: forwardedMsg, error: insertError } = await serviceClient
      .from("messages")
      .insert(insertData)
      .select(
        `
        *,
        sender:profiles(id, username, first_name, last_name, avatar_url, is_online)
      `
      )
      .single();

    if (insertError) {
      console.error("[Forward] Insert failed for conv", convId, ":", insertError.message, insertError.details, insertError.hint);
      errors.push({ convId, error: insertError.message });
    } else {
      console.log("[Forward] Message forwarded successfully to:", convId, "msg id:", forwardedMsg?.id);
      // Update conversation's last_message_at
      await serviceClient
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", convId);

      results.push(forwardedMsg);
    }
  }

  console.log("[Forward] Results:", results.length, "successes,", errors.length, "failures");

  if (results.length === 0 && errors.length > 0) {
    return NextResponse.json(
      { error: "Failed to forward message", details: errors },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: results,
    forwardedCount: results.length,
    message: `Message forwarded to ${results.length} conversation(s)`,
  });
}
