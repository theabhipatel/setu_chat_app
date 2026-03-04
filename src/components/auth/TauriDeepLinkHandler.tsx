"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { isTauri } from "@/lib/tauri";
import { createClient } from "@/lib/supabase/client";

/**
 * TauriDeepLinkHandler
 *
 * Listens for deep link events via TWO channels:
 * 1. tauri-plugin-deep-link's onOpenUrl (direct deep link open)
 * 2. Custom 'deep-link-received' event (forwarded from single-instance plugin)
 *
 * On Windows, the single-instance plugin intercepts the second launch and
 * emits the deep link URL as a custom event to the running instance.
 */
export default function TauriDeepLinkHandler() {
  const router = useRouter();
  const isProcessing = useRef(false);

  useEffect(() => {
    if (!isTauri()) return;

    const cleanupFns: (() => void)[] = [];

    async function handleDeepLink(url: string) {
      if (isProcessing.current) return;

      try {
        if (!url.includes("auth/callback") && !url.includes("auth%2Fcallback")) {
          console.log("[DeepLink] Not an auth callback, ignoring:", url);
          return;
        }

        const queryString = url.split("?")[1];
        if (!queryString) {
          console.warn("[DeepLink] No query string in URL:", url);
          return;
        }

        isProcessing.current = true;
        console.log("[DeepLink] Processing auth callback...");

        const params = new URLSearchParams(queryString);
        const code = params.get("code");
        const error = params.get("error");

        if (error) {
          console.error("[DeepLink] Auth error:", error);
          isProcessing.current = false;
          return;
        }

        if (!code) {
          console.error("[DeepLink] No code in deep link");
          isProcessing.current = false;
          return;
        }

        console.log("[DeepLink] Exchanging code for session (client-side)...");

        const supabase = createClient();
        const { data, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError || !data.session) {
          console.error("[DeepLink] Code exchange failed:", exchangeError);
          isProcessing.current = false;
          return;
        }

        console.log("[DeepLink] Session set successfully!");

        // Sync Google profile data via server API
        try {
          await fetch("/api/auth/sync-google-profile", { method: "POST" });
        } catch (syncErr) {
          console.warn("[DeepLink] Profile sync failed:", syncErr);
        }

        // Check if user needs to set a username
        const userId = data.user?.id;
        if (userId) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", userId)
            .single();

          if (!profile?.username) {
            router.push("/select-username");
            router.refresh();
            return;
          }
        }

        router.push("/chat");
        router.refresh();
      } catch (err) {
        console.error("[DeepLink] Error handling deep link:", err);
      } finally {
        setTimeout(() => {
          isProcessing.current = false;
        }, 2000);
      }
    }

    async function setup() {
      // Listener 1: tauri-plugin-deep-link's onOpenUrl
      try {
        const { onOpenUrl } = await import("@tauri-apps/plugin-deep-link");
        const unlisten = await onOpenUrl(async (urls: string[]) => {
          console.log("[DeepLink] onOpenUrl received:", urls);
          for (const url of urls) {
            await handleDeepLink(url);
          }
        });
        cleanupFns.push(unlisten);
        console.log("[DeepLink] onOpenUrl listener registered");
      } catch (error) {
        console.error("[DeepLink] Failed to setup onOpenUrl:", error);
      }

      // Listener 2: Custom event from single-instance plugin (Windows)
      try {
        const { listen } = await import("@tauri-apps/api/event");
        const unlisten = await listen<string[]>("deep-link-received", async (event) => {
          console.log("[DeepLink] single-instance event received:", event.payload);
          for (const url of event.payload) {
            await handleDeepLink(url);
          }
        });
        cleanupFns.push(unlisten);
        console.log("[DeepLink] single-instance event listener registered");
      } catch (error) {
        console.error("[DeepLink] Failed to setup event listener:", error);
      }
    }

    setup();

    return () => {
      cleanupFns.forEach((fn) => fn());
    };
  }, [router]);

  return null;
}
