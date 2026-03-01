"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/stores/useToastStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { getInitials, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Camera,
  Loader2,
  Mail,
  Calendar,
  Shield,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name);
      setLastName(user.last_name);
      setUsername(user.username || "");
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/users/${user?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          username,
        }),
      });

      const data = await res.json();
      if (res.ok && data.data) {
        updateUser(data.data);
        setMessage("Profile updated successfully!");
      } else {
        setMessage(data.error || "Failed to update profile");
      }
    } catch {
      setMessage("Something went wrong");
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1MB limit
    if (file.size > 1 * 1024 * 1024) {
      toast.error("Image must be less than 1 MB");
      e.target.value = "";
      return;
    }

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "profile-avatars");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.data) {
        const supabase = createClient();
        await supabase
          .from("profiles")
          .update({ avatar_url: data.data.url })
          .eq("id", user?.id);

        updateUser({ avatar_url: data.data.url });
      }
    } catch {
      console.error("Avatar upload failed");
    }
    setUploadingAvatar(false);
  };

  if (!user) return null;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => router.push("/chat")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold">Profile</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto p-6 space-y-8">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.avatar_url || ""} alt={user.first_name} />
                <AvatarFallback className="text-2xl">
                  {getInitials(user.first_name, user.last_name)}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 bg-primary rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors shadow-lg">
                {uploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
                ) : (
                  <Camera className="h-4 w-4 text-primary-foreground" />
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                />
              </label>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold">
                {user.first_name} {user.last_name}
              </h3>
              <p className="text-muted-foreground">@{user.username}</p>
            </div>
          </div>

          <Separator />

          {/* Account Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Account Information
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Auth Provider</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm capitalize">{user.auth_provider}</p>
                    <Badge variant="secondary" className="text-xs">
                      {user.is_email_verified ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          Verified
                        </span>
                      ) : (
                        "Unverified"
                      )}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Member since</p>
                  <p className="text-sm">{formatDate(user.created_at)}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Edit Profile */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Edit Profile
            </h4>

            {message && (
              <div className={`rounded-lg p-3 text-sm ${
                message.includes("success")
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : "bg-destructive/10 text-destructive border border-destructive/20"
              }`}>
                {message}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
