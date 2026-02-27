"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { OnlineIndicator } from "@/components/shared/OnlineIndicator";
import { getInitials, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Mail,
  Calendar,
  AtSign,
  User,
  Clock,
  MessageSquare,
  Loader2,
} from "lucide-react";
import type { Profile } from "@/types";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visibleChars = Math.min(3, Math.floor(local.length / 2));
  const masked =
    local.slice(0, visibleChars) + "••••" + "@" + domain;
  return masked;
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const { user: currentUser } = useAuthStore();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/users/${userId}`);
        const data = await res.json();
        if (data.data) {
          setProfile(data.data as Profile);
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      }
      setIsLoading(false);
    };

    loadProfile();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Loader2
          className="h-8 w-8 text-primary"
          style={{ animation: "spin 1s linear infinite" }}
        />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background gap-4">
        <User className="h-16 w-16 text-muted-foreground/30" />
        <p className="text-muted-foreground">User not found</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  const isSelf = currentUser?.id === profile.id;

  return (
    <div className="flex h-full flex-col bg-background overflow-y-auto">
      {/* Header bar */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 glass-strong">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="font-semibold text-sm">Profile</h2>
      </div>

      {/* Profile content */}
      <div className="flex-1 flex flex-col">
        {/* Cover gradient + Avatar section */}
        <div className="relative">
          {/* Gradient cover */}
          <div
            className="h-32 sm:h-40 w-full"
            style={{
              background:
                "linear-gradient(135deg, hsl(243 75% 59% / 0.5), hsl(280 70% 50% / 0.4), hsl(243 75% 40% / 0.6))",
            }}
          />

          {/* Avatar overlapping the cover */}
          <div className="flex justify-center -mt-16">
            <div className="relative">
              <Avatar className="h-28 w-28 border-4 border-background shadow-xl">
                <AvatarImage
                  src={profile.avatar_url || ""}
                  alt={profile.first_name}
                />
                <AvatarFallback className="text-2xl font-bold">
                  {getInitials(profile.first_name, profile.last_name)}
                </AvatarFallback>
              </Avatar>
              <OnlineIndicator
                isOnline={profile.is_online}
                size="md"
                className="absolute bottom-1 right-1"
              />
            </div>
          </div>
        </div>

        {/* Name & username */}
        <div className="text-center mt-4 px-6">
          <h1 className="text-xl font-bold">
            {profile.first_name} {profile.last_name}
          </h1>
          {profile.username && (
            <p className="text-sm text-muted-foreground mt-0.5">
              @{profile.username}
            </p>
          )}
          <div className="flex items-center justify-center gap-2 mt-2">
            {profile.is_online ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                <Clock className="h-3 w-3" />
                Last seen {formatDate(profile.last_seen)}
              </span>
            )}
          </div>
        </div>

        {/* Info cards */}
        <div className="px-6 mt-6 space-y-3 max-w-md mx-auto w-full pb-8">
          {/* Email */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 shrink-0">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                Email
              </p>
              <p className="text-sm font-medium mt-0.5 truncate">
                {maskEmail(profile.email)}
              </p>
            </div>
          </div>

          {/* Username */}
          {profile.username && (
            <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 shrink-0">
                <AtSign className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                  Username
                </p>
                <p className="text-sm font-medium mt-0.5">
                  @{profile.username}
                </p>
              </div>
            </div>
          )}

          {/* Member since */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 shrink-0">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                Member Since
              </p>
              <p className="text-sm font-medium mt-0.5">
                {new Date(profile.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Send message button (if viewing someone else's profile) */}
          {!isSelf && (
            <Button
              className="w-full mt-4 gap-2 rounded-xl h-11"
              onClick={() => router.back()}
            >
              <MessageSquare className="h-4 w-4" />
              Send Message
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
