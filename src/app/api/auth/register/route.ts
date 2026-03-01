import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendVerificationEmail } from "@/lib/email";
import { generateToken } from "@/lib/utils";
import { registerSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = registerSchema.parse(body);

    const supabase = await createServiceClient();

    // Check if username is taken
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", validated.username)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 400 }
      );
    }

    // Check if email is taken
    const { data: existingEmail } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", validated.email)
      .single();

    if (existingEmail) {
      return NextResponse.json(
        { error: "Email is already registered" },
        { status: 400 }
      );
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: validated.email,
      password: validated.password,
      email_confirm: false,
      user_metadata: {
        first_name: validated.firstName,
        last_name: validated.lastName,
      },
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    // Update profile with username
    await supabase
      .from("profiles")
      .update({
        username: validated.username,
        first_name: validated.firstName,
        last_name: validated.lastName,
      })
      .eq("id", authData.user.id);

    // Create "Saved Messages" self-conversation for the new user
    const { data: selfConv } = await supabase
      .from("conversations")
      .insert({
        type: "self",
        name: "Saved Messages",
        created_by: authData.user.id,
      })
      .select()
      .single();

    if (selfConv) {
      await supabase.from("conversation_members").insert({
        conversation_id: selfConv.id,
        user_id: authData.user.id,
        role: "admin",
      });
    }

    // Generate verification token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabase.from("verification_tokens").insert({
      user_id: authData.user.id,
      token,
      expires_at: expiresAt,
    });

    // Send verification email
    await sendVerificationEmail(validated.email, token, validated.firstName);

    return NextResponse.json(
      {
        message:
          "Registration successful! Please check your email to verify your account.",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
