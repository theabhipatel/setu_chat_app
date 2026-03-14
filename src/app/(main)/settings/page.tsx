"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/useAuthStore";
import { createClient } from "@/lib/supabase/client";
import {
  THEME_PRESETS,
  getStoredTheme,
  applyThemePreset,
  type ThemePresetId,
} from "@/lib/theme-config";
import {
  setPasswordSchema,
  changePasswordSchema,
  type SetPasswordInput,
  type ChangePasswordInput,
} from "@/lib/validations";
import {
  clearSessionToken,
  getCurrentSessionId,
} from "@/lib/session-manager";
import {
  isNotificationSoundEnabled,
  setNotificationSoundEnabled,
  playNotificationSound,
} from "@/lib/notification-sound";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ActiveSessions } from "@/components/settings/ActiveSessions";
import {
  ArrowLeft,
  Moon,
  Sun,
  Bell,
  Volume2,
  VolumeX,
  Shield,
  HelpCircle,
  LogOut,
  Smartphone,
  Link2,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  Loader2,
  Pencil,
  Palette,
  Check,
} from "lucide-react";

// Google icon SVG component
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
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
);

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser, updateUser } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const sessionsRef = useRef<HTMLDivElement>(null);
  const [activeTheme, setActiveTheme] = useState<ThemePresetId>("midnight-violet");

  // Linked accounts state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [showConfirmPasswordField, setShowConfirmPasswordField] = useState(false);
  const [showCurrentPasswordField, setShowCurrentPasswordField] = useState(false);
  const [showNewPasswordField, setShowNewPasswordField] = useState(false);
  const [showConfirmNewPasswordField, setShowConfirmNewPasswordField] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState("");
  const [changePasswordSuccess, setChangePasswordSuccess] = useState("");
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [googleLinkError, setGoogleLinkError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SetPasswordInput>({
    resolver: zodResolver(setPasswordSchema),
  });

  const {
    register: registerChange,
    handleSubmit: handleSubmitChange,
    formState: { errors: changeErrors },
    reset: resetChange,
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const hasGoogle = user?.auth_providers?.includes("google") ?? false;
  const hasPassword = user?.auth_providers?.includes("email") ?? false;

  useEffect(() => {
    setSoundEnabled(isNotificationSoundEnabled());
    setActiveTheme(getStoredTheme());
  }, []);

  // Auto-scroll to sessions section if URL has #sessions
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#sessions") {
      // Small delay to ensure section is rendered
      setTimeout(() => {
        sessionsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 300);
    }
  }, []);

  const handleToggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    setNotificationSoundEnabled(newValue);
    // Play a preview so user hears what it sounds like
    if (newValue) {
      playNotificationSound();
    }
  };

  const handleSetPassword = async (data: SetPasswordInput) => {
    setIsSettingPassword(true);
    setPasswordError("");
    setPasswordSuccess("");
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setPasswordError(result.error || "Failed to set password");
        return;
      }

      // Update local user state
      if (result.auth_providers) {
        updateUser({ auth_providers: result.auth_providers });
      }
      setPasswordSuccess("Password created successfully!");
      setShowPasswordForm(false);
      reset();
    } catch {
      setPasswordError("Something went wrong. Please try again.");
    } finally {
      setIsSettingPassword(false);
    }
  };

  const handleChangePassword = async (data: ChangePasswordInput) => {
    setIsChangingPassword(true);
    setChangePasswordError("");
    setChangePasswordSuccess("");
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setChangePasswordError(result.error || "Failed to change password");
        return;
      }

      setChangePasswordSuccess("Password changed successfully!");
      setShowChangePasswordForm(false);
      resetChange();
    } catch {
      setChangePasswordError("Something went wrong. Please try again.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLinkGoogle = async () => {
    setIsLinkingGoogle(true);
    setGoogleLinkError("");

    try {
      const supabase = createClient();

      // Use standard OAuth redirect with a "linking" flag
      // Pass the current user's email so the callback can verify the Google account matches
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?linking=google&expected_email=${encodeURIComponent(user?.email || "")}`,
        },
      });

      if (error) {
        setGoogleLinkError(error.message);
        setIsLinkingGoogle(false);
      }
      // If successful, user will be redirected to Google OAuth,
      // then to /auth/callback?linking=google, which redirects to /settings?linked=google
    } catch {
      setGoogleLinkError("Failed to connect Google account.");
      setIsLinkingGoogle(false);
    }
  };

  // Handle the return from Google OAuth linking
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("linked") === "google") {
      // The callback already updated auth_providers in the DB.
      // Just refresh the local user state from the DB.
      const refreshUser = async () => {
        try {
          const supabase = createClient();
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("auth_providers")
              .eq("id", authUser.id)
              .single();
            if (profile?.auth_providers) {
              updateUser({ auth_providers: profile.auth_providers });
            }
          }
        } catch {
          // Silent fail — user can retry
        }
        // Clean up URL
        window.history.replaceState({}, "", "/settings");
      };
      refreshUser();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignOut = async () => {
    const supabase = createClient();

    // Delete the current session record
    const currentSessionId = getCurrentSessionId();
    if (currentSessionId) {
      try {
        await fetch(`/api/sessions/${currentSessionId}`, {
          method: "DELETE",
        });
      } catch {
        // Best-effort cleanup
      }
    }

    // Clear session token from localStorage
    clearSessionToken();

    await supabase
      .from("profiles")
      .update({ is_online: false, last_seen: new Date().toISOString() })
      .eq("id", user?.id);
    await supabase.auth.signOut({ scope: "local" });
    setUser(null);
    router.push("/login");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.push("/chat")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold">Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Appearance
            </h3>
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Moon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Theme</p>
                  <p className="text-xs text-muted-foreground">Toggle dark/light mode</p>
                </div>
              </div>
              <button
                aria-label="Toggle theme"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-lg hover:bg-primary/[0.06] transition-colors text-muted-foreground hover:text-foreground"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Palette className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Theme Color</p>
                  <p className="text-xs text-muted-foreground">Choose your accent color</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                {THEME_PRESETS.map((preset) => {
                  const isActive = activeTheme === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setActiveTheme(preset.id);
                        applyThemePreset(preset.id);
                      }}
                      className="group relative flex items-center justify-center"
                      title={preset.name}
                    >
                      <div
                        className={`w-7 h-7 rounded-full transition-all duration-200 ${
                          isActive
                            ? "ring-2 ring-offset-2 ring-offset-background scale-110"
                            : "hover:scale-110"
                        }`}
                        style={{
                          backgroundColor: preset.swatch,
                          boxShadow: isActive
                            ? `0 0 12px ${preset.swatch}60`
                            : undefined,
                          "--tw-ring-color": isActive ? preset.swatch : undefined,
                        } as React.CSSProperties}
                      />
                      {isActive && (
                        <Check className="absolute h-3.5 w-3.5 text-white drop-shadow-sm" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-1">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Notifications
            </h3>
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Push Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive browser notifications</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleToggleSound}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                {soundEnabled ? (
                  <Volume2 className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <VolumeX className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium">Notification Sound</p>
                  <p className="text-xs text-muted-foreground">
                    {soundEnabled ? "Sound plays when you receive a message" : "Notification sound is muted"}
                  </p>
                </div>
              </div>
              <div
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                  soundEnabled ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                    soundEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
            </button>
          </div>

          <Separator />

          {/* Active Sessions Section */}
          <div ref={sessionsRef} id="sessions" className="space-y-3 scroll-mt-4">
            <div className="flex items-center gap-3 p-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  Active Sessions
                </h3>
                <p className="text-xs text-muted-foreground">
                  Manage your active sessions across devices
                </p>
              </div>
            </div>
            <ActiveSessions />
          </div>

          <Separator />

          {/* Linked Accounts Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3">
              <Link2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  Linked Accounts
                </h3>
                <p className="text-xs text-muted-foreground">
                  Manage your sign-in methods
                </p>
              </div>
            </div>

            {/* Connected Providers */}
            <div className="space-y-2 px-3">
              {/* Google Provider */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                <div className="flex items-center gap-3">
                  <GoogleIcon className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-medium">Google</p>
                    <p className="text-xs text-muted-foreground">
                      {hasGoogle ? "Connected" : "Not connected"}
                    </p>
                  </div>
                </div>
                {hasGoogle ? (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <CheckCircle2 className="h-3 w-3 text-success" />
                    Connected
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLinkGoogle}
                    disabled={isLinkingGoogle}
                  >
                    {isLinkingGoogle ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <GoogleIcon className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Connect
                  </Button>
                )}
              </div>

              {/* Password Provider */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                <div className="flex items-center gap-3">
                  <KeyRound className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Password</p>
                    <p className="text-xs text-muted-foreground">
                      {hasPassword ? "Password set" : "No password set"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {hasPassword ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setShowChangePasswordForm(!showChangePasswordForm);
                          setChangePasswordError("");
                          setChangePasswordSuccess("");
                          resetChange();
                        }}
                      >
                        <Pencil className="mr-1 h-3 w-3" />
                        Change
                      </Button>
                      <Badge variant="secondary" className="text-xs gap-1">
                        <CheckCircle2 className="h-3 w-3 text-success" />
                        Set
                      </Badge>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowPasswordForm(!showPasswordForm);
                        setPasswordError("");
                        setPasswordSuccess("");
                      }}
                    >
                      <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                      Create Password
                    </Button>
                  )}
                </div>
              </div>

              {/* Google Link Error */}
              {googleLinkError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  {googleLinkError}
                </div>
              )}

              {/* Password Success */}
              {passwordSuccess && (
                <div className="rounded-lg bg-success/10 border border-success/20 p-3 text-sm text-success">
                  {passwordSuccess}
                </div>
              )}

              {/* Create Password Form */}
              {showPasswordForm && !hasPassword && (
                <form
                  onSubmit={handleSubmit(handleSetPassword)}
                  className="space-y-3 p-4 rounded-lg border border-border bg-muted/10"
                >
                  <p className="text-sm text-muted-foreground">
                    Create a password to sign in with your email ({user?.email}) and password.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPasswordField ? "text" : "password"}
                        placeholder="Create a strong password"
                        {...register("password")}
                        className="h-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswordField(!showPasswordField)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPasswordField ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-destructive">{errors.password.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Min. 8 characters, one uppercase letter, one number
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPasswordField ? "text" : "password"}
                        placeholder="Confirm your password"
                        {...register("confirmPassword")}
                        className="h-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPasswordField(!showConfirmPasswordField)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPasswordField ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                    )}
                  </div>

                  {passwordError && (
                    <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-sm text-destructive">
                      {passwordError}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSettingPassword}
                      className="flex-1"
                    >
                      {isSettingPassword && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                      Create Password
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordError("");
                        reset();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              {/* Change Password Success */}
              {changePasswordSuccess && (
                <div className="rounded-lg bg-success/10 border border-success/20 p-3 text-sm text-success">
                  {changePasswordSuccess}
                </div>
              )}

              {/* Change Password Form */}
              {showChangePasswordForm && hasPassword && (
                <form
                  onSubmit={handleSubmitChange(handleChangePassword)}
                  className="space-y-3 p-4 rounded-lg border border-border bg-muted/10"
                >
                  <p className="text-sm text-muted-foreground">
                    Enter your current password and choose a new one.
                  </p>

                  {/* Current Password */}
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-sm">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPasswordField ? "text" : "password"}
                        placeholder="Enter current password"
                        {...registerChange("currentPassword")}
                        className="h-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPasswordField(!showCurrentPasswordField)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showCurrentPasswordField ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {changeErrors.currentPassword && (
                      <p className="text-xs text-destructive">{changeErrors.currentPassword.message}</p>
                    )}
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-sm">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPasswordField ? "text" : "password"}
                        placeholder="Enter new password"
                        {...registerChange("newPassword")}
                        className="h-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPasswordField(!showNewPasswordField)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showNewPasswordField ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {changeErrors.newPassword && (
                      <p className="text-xs text-destructive">{changeErrors.newPassword.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Min. 8 characters, one uppercase letter, one number
                    </p>
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmNewPassword" className="text-sm">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmNewPassword"
                        type={showConfirmNewPasswordField ? "text" : "password"}
                        placeholder="Confirm new password"
                        {...registerChange("confirmNewPassword")}
                        className="h-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmNewPasswordField(!showConfirmNewPasswordField)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmNewPasswordField ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {changeErrors.confirmNewPassword && (
                      <p className="text-xs text-destructive">{changeErrors.confirmNewPassword.message}</p>
                    )}
                  </div>

                  {changePasswordError && (
                    <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-sm text-destructive">
                      {changePasswordError}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isChangingPassword}
                      className="flex-1"
                    >
                      {isChangingPassword && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                      Change Password
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowChangePasswordForm(false);
                        setChangePasswordError("");
                        resetChange();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-1">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Account
            </h3>
            <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Privacy & Security</p>
                <p className="text-xs text-muted-foreground">Manage your account security</p>
              </div>
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left">
              <HelpCircle className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Help & Support</p>
                <p className="text-xs text-muted-foreground">Get help with Setu</p>
              </div>
            </button>
          </div>

          <Separator />

          <Button variant="destructive" className="w-full" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
