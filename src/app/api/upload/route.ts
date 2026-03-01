import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const serviceClient = await createServiceClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const bucket = (formData.get("bucket") as string) || "chat-files";
  // For avatars: pass entityId (userId for profile, conversationId for group)
  const entityId = formData.get("entityId") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const isAvatarBucket =
    bucket === "profile-avatars" || bucket === "group-avatars";

  let filePath: string;

  if (isAvatarBucket && entityId) {
    // Avatar upload: use fixed path per entity — always overwrite
    const fileExt = file.name.split(".").pop() || "jpg";
    filePath = `${entityId}/avatar.${fileExt}`;

    // Delete any existing files in this entity's folder first
    const { data: existingFiles } = await serviceClient.storage
      .from(bucket)
      .list(entityId);

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map((f) => `${entityId}/${f.name}`);
      await serviceClient.storage.from(bucket).remove(filesToDelete);
    }

    // Upload with upsert (in case delete didn't work or race condition)
    const { data, error } = await serviceClient.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "0",
        upsert: true,
      });

    if (error) {
      console.error(`[Upload] Failed to upload avatar to ${bucket}:`, error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Add cache-busting param so browsers load the new image
    const {
      data: { publicUrl },
    } = serviceClient.storage.from(bucket).getPublicUrl(data.path);
    const cacheBustedUrl = `${publicUrl}?v=${Date.now()}`;

    return NextResponse.json({
      data: {
        url: cacheBustedUrl,
        path: data.path,
        name: file.name,
        size: file.size,
      },
    });
  }

  // Regular file upload (chat attachments) — unique name per file
  const fileExt = file.name.split(".").pop();
  const fileName = `${user.id}/${Date.now()}.${fileExt}`;

  const { data, error } = await serviceClient.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error(`[Upload] Failed to upload to ${bucket}:`, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = serviceClient.storage.from(bucket).getPublicUrl(data.path);

  return NextResponse.json({
    data: {
      url: publicUrl,
      path: data.path,
      name: file.name,
      size: file.size,
    },
  });
}
