"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { isTauri, openInBrowser } from "@/lib/tauri";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, LogIn, Loader2, MessageSquare } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [googleNotLinkedError, setGoogleNotLinkedError] = useState(false);
  const [googleEmailMismatchError, setGoogleEmailMismatchError] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isWaitingForBrowser, setIsWaitingForBrowser] = useState(false);

  // Check for error params from callback redirects
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "google_not_linked") {
      setGoogleNotLinkedError(true);
      window.history.replaceState({}, "", "/login");
    } else if (errorParam === "google_email_mismatch") {
      setGoogleEmailMismatchError(true);
      window.history.replaceState({}, "", "/login");
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setError("");
    try {
      console.log("[Login] Attempting sign in for:", data.email);
      console.log("[Login] Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

      const supabase = createClient();

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        console.error("[Login] Auth error:", authError.message, authError);
        if (authError.message.includes("Email not confirmed")) {
          setError(
            "Please verify your email before logging in. Check your inbox."
          );
          return;
        }
        setError(authError.message);
        return;
      }

      console.log("[Login] Sign in successful, checking profile...");

      // Check if email is verified in profiles
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        console.log("[Login] User found:", user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_email_verified, auth_providers")
          .eq("id", user.id)
          .single();

        console.log("[Login] Profile:", profile);

        if (profile?.auth_providers?.includes("email") && !profile?.auth_providers?.includes("google") && !profile.is_email_verified) {
          await supabase.auth.signOut({ scope: "local" });
          setError(
            "Please verify your email before logging in. Check your inbox."
          );
          return;
        }
      }

      console.log("[Login] Redirecting to /chat...");
      router.push("/chat");
      router.refresh();
    } catch (err) {
      console.error("[Login] Unexpected error:", err);
      if (err instanceof TypeError && err.message === "Failed to fetch") {
        setError(
          "Unable to reach the authentication server. This could mean the Supabase project is paused or your internet connection is down. Please check your Supabase dashboard."
        );
      } else {
        setError(
          `An unexpected error occurred: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    const supabase = createClient();

    if (isTauri()) {
      // --- Tauri Desktop: Open system browser for OAuth ---
      try {
        // Use the deployed URL for the desktop callback so it works everywhere
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const redirectTo = `${appUrl}/auth/desktop-callback`;

        // Get the OAuth URL from Supabase without auto-redirecting
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
            skipBrowserRedirect: true, // Don't redirect inside the webview
          },
        });

        if (error) {
          setError(error.message);
          setIsGoogleLoading(false);
          return;
        }

        if (data?.url) {
          // Open the OAuth URL in the system's default browser
          await openInBrowser(data.url);
          setIsWaitingForBrowser(true);
          // Auto-reset after 2 minutes if no response
          setTimeout(() => {
            setIsGoogleLoading(false);
            setIsWaitingForBrowser(false);
          }, 120000);
          return;
        }
      } catch (err) {
        console.error("[Login] Tauri OAuth error:", err);
        setError("Failed to open browser for authentication.");
      }
      setIsGoogleLoading(false);
    } else {
      // --- Web: Standard OAuth redirect ---
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        setIsGoogleLoading(false);
      }
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/20 via-background to-primary/5 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--primary)/0.1),transparent_40%)]" />
        <div className="relative z-10 max-w-md space-y-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary p-3">
              <MessageSquare className="h-8 w-8 text-primary-foreground" />
            </div>
            <span className="text-4xl font-extrabold gradient-text">Setu</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground leading-tight">
            Connect, communicate, and collaborate in real-time.
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            A modern messaging platform designed for seamless conversations.
            Private chats, group discussions, and everything in between.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              Real-time messaging
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              End-to-end secure
            </div>
          </div>
        </div>
      </div>

      {/* Right side — form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-3 justify-center mb-4">
            <div className="rounded-xl bg-primary p-2.5">
              <MessageSquare className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-3xl font-extrabold gradient-text">Setu</span>
          </div>
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          {googleNotLinkedError && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4 space-y-1.5">
              <p className="text-sm font-medium text-amber-500">
                Google account not linked
              </p>
              <p className="text-xs text-amber-500/80 leading-relaxed">
                Your account was created with email and password. To sign in with Google, 
                first log in with your password, then connect Google from{" "}
                <span className="font-medium">Settings → Linked Accounts</span>.
              </p>
            </div>
          )}

          {googleEmailMismatchError && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4 space-y-1.5">
              <p className="text-sm font-medium text-amber-500">
                Wrong Google account selected
              </p>
              <p className="text-xs text-amber-500/80 leading-relaxed">
                The Google account you selected doesn&apos;t match your account email. 
                Please log in with your password and try again from{" "}
                <span className="font-medium">Settings → Linked Accounts</span>, 
                selecting the correct Google account.
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register("email")}
                className="h-11 placeholder:text-muted-foreground/50"
              />
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  {...register("password")}
                  className="h-11 pr-10 placeholder:text-muted-foreground/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              Sign In
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full h-11"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {isWaitingForBrowser ? "Waiting for browser..." : "Continue with Google"}
          </Button>

          {isWaitingForBrowser && (
            <div className="text-center space-y-1">
              <p className="text-xs text-muted-foreground">
                Complete sign-in in your browser. This window will update automatically.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsGoogleLoading(false);
                  setIsWaitingForBrowser(false);
                }}
                className="text-xs text-primary hover:underline"
              >
                Cancel
              </button>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-primary hover:underline font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
