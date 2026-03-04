import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * POST /api/auth/sync-google-profile
 *
 * Syncs Google OAuth profile data (name, avatar) to the user's profile.
 * Called after desktop OAuth to ensure profile data is up to date.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const serviceClient = await createServiceClient();
    const meta = user.user_metadata || {};

    // Extract real name from Google OAuth metadata
    const fullName = meta.full_name || meta.name || "";
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = meta.given_name || nameParts[0] || "";
    const lastName = meta.family_name || nameParts.slice(1).join(" ") || "";

    // Get current profile
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("username, first_name, last_name, avatar_url")
      .eq("id", user.id)
      .single();

    // Update name if needed
    const currentFirst = profile?.first_name || "";
    const needsNameUpdate =
      !currentFirst ||
      currentFirst === user.email?.split("@")[0] ||
      (firstName && currentFirst !== firstName);

    if (needsNameUpdate && firstName) {
      await serviceClient
        .from("profiles")
        .update({ first_name: firstName, last_name: lastName })
        .eq("id", user.id);
    }

    // Update avatar from Google if not already set
    const googleAvatar = meta.picture || meta.avatar_url;
    if (googleAvatar && !profile?.avatar_url) {
      await serviceClient
        .from("profiles")
        .update({ avatar_url: googleAvatar })
        .eq("id", user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SyncProfile] Error:", error);
    return NextResponse.json(
      { error: "Failed to sync profile" },
      { status: 500 }
    );
  }
}
