import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// Get messages for a conversation (paginated)
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

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const limit = parseInt(searchParams.get("limit") || "50");

  let query = serviceClient
    .from("messages")
    .select(
      `
      *,
      sender:profiles(id, username, first_name, last_name, avatar_url, is_online),
      reactions:message_reactions(id, user_id, reaction),
      files:message_files(id, file_url, file_name, file_size, file_type, mime_type, display_order)
    `
    )
    .eq("conversation_id", params.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data: messages, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Sort files by display_order within each message
  const messagesWithSortedFiles = (messages || []).map((msg) => ({
    ...msg,
    files: (msg.files || []).sort(
      (a: { display_order: number }, b: { display_order: number }) =>
        a.display_order - b.display_order
    ),
  }));

  // Get reply messages and forwarded message info
  const messagesWithReplies = await Promise.all(
    messagesWithSortedFiles.map(async (msg) => {
      let enriched = { ...msg };

      if (msg.reply_to) {
        const { data: replyMsg } = await serviceClient
          .from("messages")
          .select(
            `
            id, content, message_type, sender_id,
            sender:profiles(id, username, first_name, last_name, avatar_url)
          `
          )
          .eq("id", msg.reply_to)
          .single();

        enriched = { ...enriched, reply_message: replyMsg };
      }

      if (msg.forwarded_from) {
        const { data: fwdMsg } = await serviceClient
          .from("messages")
          .select(
            `
            id, content, message_type, sender_id, created_at,
            sender:profiles(id, username, first_name, last_name, avatar_url)
          `
          )
          .eq("id", msg.forwarded_from)
          .single();

        if (fwdMsg) {
          enriched = { ...enriched, forwarded_message: fwdMsg };
        }
      }

      return enriched;
    })
  );

  // Calculate unread count BEFORE updating read receipt (only on initial load)
  let unreadCount = 0;
  if (!cursor && messages && messages.length > 0) {
    const { data: readReceipt } = await serviceClient
      .from("read_receipts")
      .select("last_read_at")
      .eq("conversation_id", params.id)
      .eq("user_id", user.id)
      .single();

    if (readReceipt) {
      const { count } = await serviceClient
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", params.id)
        .gt("created_at", readReceipt.last_read_at)
        .neq("sender_id", user.id);

      unreadCount = count || 0;
    } else {
      // No read receipt = never opened → all messages from others are unread
      const { count } = await serviceClient
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", params.id)
        .neq("sender_id", user.id);

      unreadCount = count || 0;
    }
  }

  // Update read receipt (marks everything as read AND delivered)
  if (messages && messages.length > 0) {
    await serviceClient.from("read_receipts").upsert(
      {
        conversation_id: params.id,
        user_id: user.id,
        last_read_message_id: messages[0].id,
        last_read_at: new Date().toISOString(),
        delivered_at: new Date().toISOString(),
      },
      {
        onConflict: "conversation_id,user_id",
      }
    );
  }

  // Fetch read receipts of OTHER users in this conversation (for status indicators)
  const { data: otherReadReceipts } = await serviceClient
    .from("read_receipts")
    .select("user_id, last_read_at, last_read_message_id, delivered_at")
    .eq("conversation_id", params.id)
    .neq("user_id", user.id);

  const hasMore = messages?.length === limit;
  const nextCursor = messages?.length
    ? messages[messages.length - 1].created_at
    : null;

  return NextResponse.json({
    data: messagesWithReplies?.reverse() || [],
    hasMore,
    nextCursor,
    unreadCount,
    otherReadReceipts: otherReadReceipts || [],
  });
}

// Send a message
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

  const body = await request.json();

  // Insert the message
  const { data: message, error } = await serviceClient
    .from("messages")
    .insert({
      conversation_id: params.id,
      sender_id: user.id,
      content: body.content,
      message_type: body.message_type || "text",
      reply_to: body.reply_to || null,
      forwarded_from: body.forwarded_from || null,
    })
    .select(
      `
      *,
      sender:profiles(id, username, first_name, last_name, avatar_url, is_online)
    `
    )
    .single();

  if (error) {
    console.error("Message insert error:", error.message, "Body:", JSON.stringify(body));
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Insert message files if provided
  if (body.files && Array.isArray(body.files) && body.files.length > 0) {
    const fileRows = body.files.map(
      (
        f: {
          url: string;
          name: string;
          size: number;
          file_type: string;
          mime_type: string;
        },
        index: number
      ) => ({
        message_id: message.id,
        file_url: f.url,
        file_name: f.name,
        file_size: f.size,
        file_type: f.file_type,
        mime_type: f.mime_type,
        display_order: index,
      })
    );

    const { data: insertedFiles, error: filesError } = await serviceClient
      .from("message_files")
      .insert(fileRows)
      .select("id, file_url, file_name, file_size, file_type, mime_type, display_order");

    if (filesError) {
      console.error("Message files insert error:", filesError.message);
    }

    // Attach files to the response
    return NextResponse.json(
      { data: { ...message, files: insertedFiles || [] } },
      { status: 201 }
    );
  }

  return NextResponse.json({ data: { ...message, files: [] } }, { status: 201 });
}
