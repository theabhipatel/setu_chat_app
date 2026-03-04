/**
 * Tauri Desktop App Utilities
 * Helpers for detecting Tauri environment and interacting with OS-level features.
 */

/**
 * Check if the app is running inside a Tauri desktop shell.
 */
export function isTauri(): boolean {
  return (
    typeof window !== "undefined" && "__TAURI_INTERNALS__" in window
  );
}

/**
 * Open a URL in the system's default browser (only works in Tauri).
 * Falls back to window.open for web environments.
 */
export async function openInBrowser(url: string): Promise<void> {
  if (isTauri()) {
    try {
      const { open } = await import("@tauri-apps/plugin-shell");
      await open(url);
    } catch (error) {
      console.error("[Tauri] Failed to open URL in browser:", error);
      // Fallback: try window.open
      window.open(url, "_blank");
    }
  } else {
    window.open(url, "_blank");
  }
}
