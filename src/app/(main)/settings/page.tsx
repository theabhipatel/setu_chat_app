"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { createClient } from "@/lib/supabase/client";
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
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { ActiveSessions } from "@/components/settings/ActiveSessions";
import {
  ArrowLeft,
  Moon,
  Bell,
  Volume2,
  VolumeX,
  Shield,
  HelpCircle,
  LogOut,
  Smartphone,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const sessionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSoundEnabled(isNotificationSoundEnabled());
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
              <ThemeToggle />
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
