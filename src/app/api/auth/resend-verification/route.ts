import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendVerificationEmail } from "@/lib/email";
import { generateToken } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = await createServiceClient();

    // Find user by email
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, first_name, is_email_verified")
      .eq("email", email)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "No account found with this email" },
        { status: 404 }
      );
    }

    if (profile.is_email_verified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      );
    }

    // Delete old tokens
    await supabase
      .from("verification_tokens")
      .delete()
      .eq("user_id", profile.id);

    // Generate new token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabase.from("verification_tokens").insert({
      user_id: profile.id,
      token,
      expires_at: expiresAt,
    });

    await sendVerificationEmail(email, token, profile.first_name);

    return NextResponse.json({
      message: "Verification email sent! Please check your inbox.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
