"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { toast } from "@/stores/useToastStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";
import { validateFile } from "@/lib/file-validation";
import {
  ArrowLeft,
  Camera,
  Pencil,
  Check,
  X,
  Search,
  UserPlus,
  Loader2,
  MoreVertical,
  Shield,
  ShieldOff,
  UserMinus,
  LogOut,
  Trash2,
  Crown,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ConversationWithDetails, SearchResult, ConversationMember, Profile } from "@/types";

type MemberWithProfile = ConversationMember & { profile: Profile };

export default function GroupInfoPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;
  const { user } = useAuthStore();
  const { updateConversation, removeConversation } = useChatStore();

  // Conversation state
  const [conversation, setConversation] = useState<ConversationWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Editing states
  const [editingName, setEditingName] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [descriptionValue, setDescriptionValue] = useState("");
  const [savingField, setSavingField] = useState<string | null>(null);

  // Add member states
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingMembers, setAddingMembers] = useState(false);
  const [selectedNewMembers, setSelectedNewMembers] = useState<SearchResult[]>([]);

  // Avatar
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Confirmation dialogs
  const [confirmAction, setConfirmAction] = useState<{
    type: "remove" | "leave" | "delete" | "make-admin" | "remove-admin";
    targetUserId?: string;
    targetName?: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Derive current user's role
  const currentMember = conversation?.members?.find(
    (m) => m.user_id === user?.id
  );
  const myRole = currentMember?.role || "member";
  const isOwner = myRole === "owner";
  const isAdminOrOwner = myRole === "owner" || myRole === "admin";

  // Load conversation
  const loadConversation = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}`);
      const data = await res.json();
      if (data.data) {
        const conv = data.data as ConversationWithDetails;
        setConversation(conv);
        setNameValue(conv.name || "");
        setDescriptionValue(conv.description || "");
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
      router.push("/chat");
    }
    setIsLoading(false);
  }, [conversationId, router]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  // Search for users to add
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/users/search?q=${encodeURIComponent(searchQuery)}`
        );
        const data = await res.json();
        // Filter out existing members
        const existingIds = new Set(
          conversation?.members?.map((m) => m.user_id) || []
        );
        setSearchResults(
          (data.data || []).filter(
            (u: SearchResult) => !existingIds.has(u.id)
          )
        );
      } catch {
        setSearchResults([]);
      }
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, conversation?.members]);

  // --- Actions ---

  const handleSaveName = async () => {
    if (!nameValue.trim() || nameValue.trim() === conversation?.name) {
      setEditingName(false);
      return;
    }
    setSavingField("name");
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameValue.trim() }),
      });
      if (res.ok) {
        setConversation((prev) =>
          prev ? { ...prev, name: nameValue.trim() } : prev
        );
        updateConversation(conversationId, { name: nameValue.trim() });
      }
    } catch (error) {
      console.error("Failed to update name:", error);
    }
    setSavingField(null);
    setEditingName(false);
  };

  const handleSaveDescription = async () => {
    setSavingField("description");
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: descriptionValue.trim() }),
      });
      if (res.ok) {
        setConversation((prev) =>
          prev ? { ...prev, description: descriptionValue.trim() } : prev
        );
      }
    } catch (error) {
      console.error("Failed to update description:", error);
    }
    setSavingField(null);
    setEditingDescription(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file, "avatar");
    if (!validation.valid) {
      toast.error(validation.error!);
      e.target.value = "";
      return;
    }

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "group-avatars");
    formData.append("entityId", conversationId);

    try {
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (uploadData.data?.url) {
        const res = await fetch(`/api/conversations/${conversationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatar_url: uploadData.data.url }),
        });
        if (res.ok) {
          setConversation((prev) =>
            prev ? { ...prev, avatar_url: uploadData.data.url } : prev
          );
          updateConversation(conversationId, {
            avatar_url: uploadData.data.url,
          });
        }
      }
    } catch (error) {
      console.error("Avatar upload failed:", error);
    }
    setUploadingAvatar(false);
  };

  const handleRemoveAvatar = async () => {
    setSavingField("avatar");
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: null }),
      });
      if (res.ok) {
        setConversation((prev) =>
          prev ? { ...prev, avatar_url: null } : prev
        );
        updateConversation(conversationId, { avatar_url: null });
      }
    } catch (error) {
      console.error("Failed to remove avatar:", error);
    }
    setSavingField(null);
  };

  const toggleNewMember = (u: SearchResult) => {
    setSelectedNewMembers((prev) =>
      prev.some((s) => s.id === u.id)
        ? prev.filter((s) => s.id !== u.id)
        : [...prev, u]
    );
  };

  const handleAddMembers = async () => {
    if (selectedNewMembers.length === 0) return;
    setAddingMembers(true);
    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/members`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            memberIds: selectedNewMembers.map((u) => u.id),
          }),
        }
      );
      const data = await res.json();
      if (res.ok && data.data) {
        setConversation(data.data as ConversationWithDetails);
        updateConversation(conversationId, {
          members: (data.data as ConversationWithDetails).members,
        });
        setSelectedNewMembers([]);
        setSearchQuery("");
        setSearchResults([]);
        setShowAddMember(false);
      }
    } catch (error) {
      console.error("Failed to add members:", error);
    }
    setAddingMembers(false);
  };

  const executeConfirmAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);

    try {
      if (confirmAction.type === "remove" && confirmAction.targetUserId) {
        const res = await fetch(
          `/api/conversations/${conversationId}/members`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: confirmAction.targetUserId }),
          }
        );
        const data = await res.json();
        if (res.ok && data.data) {
          setConversation(data.data as ConversationWithDetails);
          updateConversation(conversationId, {
            members: (data.data as ConversationWithDetails).members,
          });
        }
      } else if (confirmAction.type === "leave") {
        const res = await fetch(
          `/api/conversations/${conversationId}/members`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user?.id }),
          }
        );
        if (res.ok) {
          removeConversation(conversationId);
          router.push("/chat");
          return;
        }
      } else if (confirmAction.type === "delete") {
        const res = await fetch(`/api/conversations/${conversationId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          removeConversation(conversationId);
          router.push("/chat");
          return;
        }
      } else if (
        (confirmAction.type === "make-admin" ||
          confirmAction.type === "remove-admin") &&
        confirmAction.targetUserId
      ) {
        const newRole =
          confirmAction.type === "make-admin" ? "admin" : "member";
        const res = await fetch(
          `/api/conversations/${conversationId}/members/role`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: confirmAction.targetUserId,
              newRole,
            }),
          }
        );
        const data = await res.json();
        if (res.ok && data.data) {
          setConversation(data.data as ConversationWithDetails);
          updateConversation(conversationId, {
            members: (data.data as ConversationWithDetails).members,
          });
        }
      }
    } catch (error) {
      console.error("Action failed:", error);
    }

    setActionLoading(false);
    setConfirmAction(null);
  };

  // Sort members: owner first, then admins, then members
  const sortedMembers = [...(conversation?.members || [])].sort(
    (a, b) => {
      const order = { owner: 0, admin: 1, member: 2 };
      return order[a.role] - order[b.role];
    }
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner":
        return (
          <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 hover:bg-amber-500/20 text-[10px] px-1.5 py-0 h-5 gap-1">
            <Crown className="h-3 w-3" />
            Owner
          </Badge>
        );
      case "admin":
        return (
          <Badge className="bg-blue-500/15 text-blue-500 border-blue-500/30 hover:bg-blue-500/20 text-[10px] px-1.5 py-0 h-5 gap-1">
            <Shield className="h-3 w-3" />
            Admin
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2
          className="h-8 w-8 text-primary"
          style={{ animation: "spin 1s linear infinite" }}
        />
      </div>
    );
  }

  if (!conversation || conversation.type !== "group") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <Users className="h-16 w-16 text-muted-foreground/30" />
        <p className="text-muted-foreground">Group not found</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header bar */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 glass-strong shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => router.push(`/chat/${conversationId}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="font-semibold text-sm">Group Info</h2>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto pb-8">
          {/* --- Group Avatar & Name --- */}
          <div className="flex flex-col items-center pt-8 pb-4 px-6">
            {/* Avatar */}
            <div className="relative mb-4">
              <Avatar className="h-24 w-24 border-2 border-border shadow-lg">
                <AvatarImage
                  src={conversation.avatar_url || ""}
                  alt={conversation.name || "Group"}
                />
                <AvatarFallback className="text-2xl">
                  <Users className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              {isAdminOrOwner && (
                <label className="absolute bottom-0 right-0 bg-primary rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors shadow-lg">
                  {uploadingAvatar ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
                  ) : (
                    <Camera className="h-4 w-4 text-primary-foreground" />
                  )}
                  <input
                    ref={avatarInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                  />
                </label>
              )}
            </div>

            {/* Remove avatar button */}
            {isAdminOrOwner && conversation.avatar_url && (
              <button
                onClick={handleRemoveAvatar}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors mb-2"
                disabled={savingField === "avatar"}
              >
                Remove photo
              </button>
            )}

            {/* Group Name */}
            {editingName ? (
              <div className="flex items-center gap-2 w-full max-w-xs">
                <Input
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  className="text-center h-9"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") {
                      setEditingName(false);
                      setNameValue(conversation.name || "");
                    }
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full"
                  onClick={handleSaveName}
                  disabled={savingField === "name"}
                >
                  {savingField === "name" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 text-emerald-500" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full"
                  onClick={() => {
                    setEditingName(false);
                    setNameValue(conversation.name || "");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">
                  {conversation.name || "Group Chat"}
                </h1>
                {isAdminOrOwner && (
                  <button
                    onClick={() => setEditingName(true)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            {/* Member count & created */}
            <p className="text-sm text-muted-foreground mt-1">
              {conversation.members?.length || 0} members
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Created{" "}
              {new Date(conversation.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <Separator className="mx-6" />

          {/* --- Description --- */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Description
              </h3>
              {isAdminOrOwner && !editingDescription && (
                <button
                  onClick={() => setEditingDescription(true)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {editingDescription ? (
              <div className="space-y-2">
                <textarea
                  value={descriptionValue}
                  onChange={(e) => setDescriptionValue(e.target.value)}
                  className="w-full rounded-lg bg-muted/50 border border-border p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  rows={3}
                  placeholder="Add a group description..."
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingDescription(false);
                      setDescriptionValue(conversation.description || "");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveDescription}
                    disabled={savingField === "description"}
                  >
                    {savingField === "description" && (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    )}
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {conversation.description || "No description added."}
              </p>
            )}
          </div>

          <Separator className="mx-6" />

          {/* --- Members List --- */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Members ({conversation.members?.length || 0})
              </h3>
              {isAdminOrOwner && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => setShowAddMember(!showAddMember)}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Add
                </Button>
              )}
            </div>

            {/* Add member section */}
            {showAddMember && (
              <div className="mb-4 space-y-3 p-3 rounded-lg bg-muted/30 border border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users to add..."
                    className="pl-9 h-9"
                  />
                </div>

                {/* Selected new members */}
                {selectedNewMembers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedNewMembers.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center gap-1 bg-primary/10 text-primary rounded-full pl-1 pr-2 py-0.5 text-xs"
                      >
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={u.avatar_url || ""} />
                          <AvatarFallback className="text-[7px]">
                            {getInitials(u.first_name, u.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{u.first_name}</span>
                        <button onClick={() => toggleNewMember(u)}>
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Search results */}
                <ScrollArea className="max-h-36">
                  {isSearching ? (
                    <div className="flex justify-center py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    searchResults.map((u) => {
                      const isSelected = selectedNewMembers.some(
                        (s) => s.id === u.id
                      );
                      return (
                        <button
                          key={u.id}
                          onClick={() => toggleNewMember(u)}
                          className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-accent rounded-md transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={u.avatar_url || ""} />
                              <AvatarFallback className="text-[9px]">
                                {getInitials(u.first_name, u.last_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="text-left">
                              <p className="text-xs font-medium">
                                {u.first_name} {u.last_name}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                @{u.username}
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </button>
                      );
                    })
                  )}
                </ScrollArea>

                {selectedNewMembers.length > 0 && (
                  <Button
                    size="sm"
                    onClick={handleAddMembers}
                    disabled={addingMembers}
                    className="w-full"
                  >
                    {addingMembers && (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    )}
                    Add {selectedNewMembers.length} Member
                    {selectedNewMembers.length > 1 ? "s" : ""}
                  </Button>
                )}
              </div>
            )}

            {/* Members */}
            <div className="space-y-0.5">
              {sortedMembers.map((member: MemberWithProfile) => {
                const profile = member.profile;
                const isSelf = member.user_id === user?.id;
                const canManage =
                  !isSelf &&
                  ((isOwner) ||
                    (myRole === "admin" && member.role === "member"));

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage
                          src={profile?.avatar_url || ""}
                          alt={profile?.first_name}
                        />
                        <AvatarFallback className="text-xs">
                          {profile
                            ? getInitials(
                                profile.first_name,
                                profile.last_name
                              )
                            : "??"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {profile?.first_name} {profile?.last_name}
                            {isSelf && (
                              <span className="text-muted-foreground ml-1">
                                (You)
                              </span>
                            )}
                          </p>
                          {getRoleBadge(member.role)}
                        </div>
                        {profile?.username && (
                          <p className="text-xs text-muted-foreground truncate">
                            @{profile.username}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions dropdown */}
                    {canManage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {/* Owner-only: promote/demote admin */}
                          {isOwner && member.role === "member" && (
                            <DropdownMenuItem
                              onClick={() =>
                                setConfirmAction({
                                  type: "make-admin",
                                  targetUserId: member.user_id,
                                  targetName: `${profile?.first_name} ${profile?.last_name}`,
                                })
                              }
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Make Admin
                            </DropdownMenuItem>
                          )}
                          {isOwner && member.role === "admin" && (
                            <DropdownMenuItem
                              onClick={() =>
                                setConfirmAction({
                                  type: "remove-admin",
                                  targetUserId: member.user_id,
                                  targetName: `${profile?.first_name} ${profile?.last_name}`,
                                })
                              }
                            >
                              <ShieldOff className="mr-2 h-4 w-4" />
                              Remove Admin
                            </DropdownMenuItem>
                          )}
                          {/* Remove from group */}
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() =>
                              setConfirmAction({
                                type: "remove",
                                targetUserId: member.user_id,
                                targetName: `${profile?.first_name} ${profile?.last_name}`,
                              })
                            }
                          >
                            <UserMinus className="mr-2 h-4 w-4" />
                            Remove from Group
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <Separator className="mx-6" />

          {/* --- Action Buttons --- */}
          <div className="px-6 py-4 space-y-2">
            {/* Leave group (not for owner) */}
            {!isOwner && (
              <Button
                variant="outline"
                className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setConfirmAction({ type: "leave" })}
              >
                <LogOut className="h-4 w-4" />
                Leave Group
              </Button>
            )}

            {/* Delete group (owner only) */}
            {isOwner && (
              <Button
                variant="destructive"
                className="w-full gap-2"
                onClick={() => setConfirmAction({ type: "delete" })}
              >
                <Trash2 className="h-4 w-4" />
                Delete Group
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "remove" &&
                `Remove ${confirmAction.targetName}?`}
              {confirmAction?.type === "leave" && "Leave group?"}
              {confirmAction?.type === "delete" && "Delete group?"}
              {confirmAction?.type === "make-admin" &&
                `Make ${confirmAction.targetName} an admin?`}
              {confirmAction?.type === "remove-admin" &&
                `Remove ${confirmAction.targetName} as admin?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "remove" &&
                `${confirmAction.targetName} will be removed from the group and won't be able to see new messages.`}
              {confirmAction?.type === "leave" &&
                "You will no longer receive messages from this group. You can only rejoin if someone adds you back."}
              {confirmAction?.type === "delete" &&
                "This group will be permanently deleted for all members. All messages will be lost. This action cannot be undone."}
              {confirmAction?.type === "make-admin" &&
                `${confirmAction.targetName} will be able to add and remove members, edit group info, and manage the group.`}
              {confirmAction?.type === "remove-admin" &&
                `${confirmAction.targetName} will no longer have admin privileges.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeConfirmAction}
              disabled={actionLoading}
              className={
                confirmAction?.type === "delete" ||
                confirmAction?.type === "remove"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {actionLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {confirmAction?.type === "remove" && "Remove"}
              {confirmAction?.type === "leave" && "Leave"}
              {confirmAction?.type === "delete" && "Delete"}
              {confirmAction?.type === "make-admin" && "Make Admin"}
              {confirmAction?.type === "remove-admin" && "Remove Admin"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
