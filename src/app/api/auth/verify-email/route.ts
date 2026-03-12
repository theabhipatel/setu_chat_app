import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const supabase = await createServiceClient();

    // Find the verification token
    const { data: tokenData, error: tokenError } = await supabase
      .from("verification_tokens")
      .select("*")
      .eq("token", token)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      await supabase
        .from("verification_tokens")
        .delete()
        .eq("id", tokenData.id);

      return NextResponse.json(
        { error: "Verification token has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Mark email as verified
    await supabase
      .from("profiles")
      .update({ is_email_verified: true })
      .eq("id", tokenData.user_id);

    // Update Supabase auth user email confirmation
    await supabase.auth.admin.updateUserById(tokenData.user_id, {
      email_confirm: true,
    });

    // Delete the used token
    await supabase
      .from("verification_tokens")
      .delete()
      .eq("id", tokenData.id);

    return NextResponse.json({
      message: "Email verified successfully! You can now log in.",
    });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
