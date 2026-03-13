"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Monitor,
  Smartphone,
  Tablet,
  AppWindow,
  Loader2,
  ShieldAlert,
  LogOut,
  MapPin,
  Globe,
  Clock,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { getSessionToken } from "@/lib/session-manager";
import {
  markSessionAsRevoking,
  markMultipleSessionsAsRevoking,
  setSuppressSignOut,
} from "@/hooks/useRealtimeSessions";
import { useToastStore } from "@/stores/useToastStore";
import type { UserSession } from "@/types";

const MAX_SESSIONS = 5;

function getDeviceIcon(deviceType: string) {
  const iconClass = "h-6 w-6";
  switch (deviceType) {
    case "desktop_app":
      return <AppWindow className={iconClass} />;
    case "desktop_browser":
      return <Monitor className={iconClass} />;
    case "mobile_app":
    case "mobile_browser":
      return <Smartphone className={iconClass} />;
    case "tablet_browser":
      return <Tablet className={iconClass} />;
    default:
      return <Monitor className={iconClass} />;
  }
}

function getDeviceTypeLabel(deviceType: string): string {
  const labels: Record<string, string> = {
    desktop_app: "Desktop App",
    desktop_browser: "Desktop",
    mobile_app: "Mobile App",
    mobile_browser: "Mobile",
    tablet_browser: "Tablet",
  };
  return labels[deviceType] || "Unknown";
}

function formatLastActive(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "Active now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function formatCreatedDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ActiveSessions() {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const addToast = useToastStore((s) => s.addToast);

  const fetchSessions = useCallback(async () => {
    try {
      const token = getSessionToken();
      const res = await fetch("/api/sessions", {
        headers: { "x-session-token": token || "" },
      });
      const data = await res.json();
      if (data.data) {
        setSessions(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingId(sessionId);
    setConfirmRevokeId(null);
    // Mark this session ID as being revoked by us (prevents realtime sign-out)
    markSessionAsRevoking(sessionId);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        addToast({ type: "success", message: "Session revoked successfully" });
      } else {
        addToast({ type: "error", message: "Failed to revoke session" });
      }
    } catch {
      addToast({ type: "error", message: "Failed to revoke session" });
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAll = async () => {
    setRevokingAll(true);
    setConfirmRevokeAll(false);
    // Mark all other session IDs as being revoked by us
    const otherSessions = sessions.filter((s) => !s.is_current);
    markMultipleSessionsAsRevoking(otherSessions.map((s) => s.id));
    // Also set global suppress flag as a safety net
    setSuppressSignOut(true);
    try {
      const token = getSessionToken();
      const res = await fetch("/api/sessions", {
        method: "DELETE",
        headers: { "x-session-token": token || "" },
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.is_current));
        addToast({
          type: "success",
          message: "All other sessions have been revoked",
        });
      } else {
        addToast({ type: "error", message: "Failed to revoke sessions" });
      }
    } catch {
      addToast({ type: "error", message: "Failed to revoke sessions" });
    } finally {
      setRevokingAll(false);
      // Reset global suppress after a generous delay for all DELETE events to arrive
      setTimeout(() => setSuppressSignOut(false), 10_000);
    }
  };

  const otherSessionCount = sessions.filter((s) => !s.is_current).length;

  if (loading) {
    return (
      <div className="space-y-3">
        {/* Skeleton */}
        {[1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 animate-pulse"
          >
            <div className="w-10 h-10 rounded-xl bg-muted/50" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-32 rounded bg-muted/50" />
              <div className="h-2.5 w-48 rounded bg-muted/50" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with session count + revoke all */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {sessions.length} of {MAX_SESSIONS} sessions
          </span>
          {/* Progress dots */}
          <div className="flex items-center gap-0.5">
            {Array.from({ length: MAX_SESSIONS }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i < sessions.length
                    ? "bg-primary"
                    : "bg-muted-foreground/20"
                }`}
              />
            ))}
          </div>
        </div>
        {otherSessionCount > 0 && (
          <div className="relative">
            {confirmRevokeAll ? (
              <div className="flex items-center gap-1.5 animate-in fade-in duration-200">
                <span className="text-xs text-muted-foreground">Sure?</span>
                <button
                  onClick={handleRevokeAll}
                  disabled={revokingAll}
                  className="text-xs font-medium text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
                >
                  {revokingAll ? "Revoking..." : "Yes, revoke all"}
                </button>
                <span className="text-muted-foreground/50">·</span>
                <button
                  onClick={() => setConfirmRevokeAll(false)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmRevokeAll(true)}
                className="flex items-center gap-1 text-xs font-medium text-destructive/80 hover:text-destructive transition-colors"
              >
                <LogOut className="h-3 w-3" />
                Sign out all others
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sessions list */}
      <div className="space-y-2">
        {sessions.map((session) => {
          const isExpanded = expandedId === session.id;
          const lastActive = formatLastActive(session.last_active_at);
          const isActive = lastActive === "Active now";

          return (
            <div
              key={session.id}
              className={`group rounded-xl border transition-all duration-200 ${
                session.is_current
                  ? "border-primary/20 bg-primary/[0.03]"
                  : "border-border/50 bg-card/50 hover:border-border hover:bg-card/80"
              }`}
            >
              {/* Main row */}
              <button
                onClick={() =>
                  setExpandedId(isExpanded ? null : session.id)
                }
                className="w-full flex items-center gap-3 p-3 text-left"
              >
                {/* Device icon */}
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${
                    session.is_current
                      ? "bg-primary/10 text-primary"
                      : "bg-muted/50 text-muted-foreground"
                  }`}
                >
                  {getDeviceIcon(session.device_type)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">
                      {session.device_name}
                    </p>
                    {session.is_current && (
                      <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-success/15 text-success border border-success/20">
                        This device
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                    <span className="truncate">
                      {getDeviceTypeLabel(session.device_type)}
                    </span>
                    {session.location && (
                      <>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="truncate">{session.location}</span>
                      </>
                    )}
                    <span className="text-muted-foreground/40">·</span>
                    <span
                      className={`shrink-0 ${
                        isActive ? "text-success" : ""
                      }`}
                    >
                      {isActive && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-success mr-1 animate-pulse" />
                      )}
                      {lastActive}
                    </span>
                  </div>
                </div>

                {/* Revoke button (non-current only) */}
                {!session.is_current && (
                  <div
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {confirmRevokeId === session.id ? (
                      <div className="flex items-center gap-1 animate-in fade-in duration-200">
                        <button
                          onClick={() => handleRevokeSession(session.id)}
                          disabled={revokingId === session.id}
                          className="px-2 py-1 rounded-md text-[11px] font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
                        >
                          {revokingId === session.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Revoke"
                          )}
                        </button>
                        <button
                          onClick={() => setConfirmRevokeId(null)}
                          className="px-2 py-1 rounded-md text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setConfirmRevokeId(session.id)}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>Revoke session</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                )}
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-0 animate-in slide-in-from-top-1 duration-200">
                  <Separator className="mb-3" />
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {session.ip_address && (
                      <div className="flex items-start gap-2">
                        <Globe className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-muted-foreground">IP Address</p>
                          <p className="font-mono text-foreground/80">
                            {session.ip_address}
                          </p>
                        </div>
                      </div>
                    )}
                    {session.location && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-muted-foreground">Location</p>
                          <p className="text-foreground/80">
                            {session.location}
                          </p>
                        </div>
                      </div>
                    )}
                    {session.browser_name && (
                      <div className="flex items-start gap-2">
                        <Monitor className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-muted-foreground">Browser</p>
                          <p className="text-foreground/80">
                            {session.browser_name}
                          </p>
                        </div>
                      </div>
                    )}
                    {session.os_name && (
                      <div className="flex items-start gap-2">
                        <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-muted-foreground">
                            Operating System
                          </p>
                          <p className="text-foreground/80">
                            {session.os_name}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-muted-foreground">Session Created</p>
                        <p className="text-foreground/80">
                          {formatCreatedDate(session.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Revoke button for mobile (always visible) */}
                  {!session.is_current && (
                    <div className="mt-3 md:hidden">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full text-xs"
                        disabled={revokingId === session.id}
                        onClick={() => handleRevokeSession(session.id)}
                      >
                        {revokingId === session.id ? (
                          <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="mr-1.5 h-3 w-3" />
                        )}
                        Revoke this session
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {sessions.length === 0 && !loading && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No active sessions found
        </div>
      )}
    </div>
  );
}
