"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { applyThemePreset, getStoredTheme } from "@/lib/theme-config";

/**
 * Applies the saved theme color preset on mount and whenever
 * the light/dark theme changes. Place inside <ThemeProvider>.
 */
export function ThemeColorProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();

  // Apply on mount
  useEffect(() => {
    applyThemePreset(getStoredTheme());
  }, []);

  // Re-apply when light/dark switches so dark-mode overrides are correct
  useEffect(() => {
    if (resolvedTheme) {
      // Small delay so next-themes has finished toggling the class
      const timer = setTimeout(() => {
        applyThemePreset(getStoredTheme());
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [resolvedTheme]);

  return <>{children}</>;
}
