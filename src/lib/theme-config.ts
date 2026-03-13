"use client";

// ─── Theme Presets ───────────────────────────────────────────────
// Each preset overrides the CSS variables that define the primary color palette.
// Non-primary semantic tokens (success, warning, info, destructive) stay unchanged.

export type ThemePresetId = "midnight-violet" | "ocean-sapphire" | "rose-ember";

export interface ThemePreset {
  id: ThemePresetId;
  name: string;
  description: string;
  /** Preview swatch color (hex for rendering the selector UI) */
  swatch: string;
  /** CSS variable overrides — values are HSL without hsl() wrapper, e.g. "250 67% 55%" */
  variables: Record<string, string>;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "midnight-violet",
    name: "Midnight Violet",
    description: "Sleek & modern",
    swatch: "#7c5cfc",
    variables: {
      "--primary": "250 67% 55%",
      "--primary-foreground": "210 40% 98%",
      "--primary-light": "250 67% 72%",
      "--primary-gradient-end": "270 65% 58%",
      "--tertiary": "285 65% 60%",
      "--ring": "250 67% 55%",
      "--sidebar-accent": "250 67% 95%",
      "--accent": "250 67% 95%",
      "--accent-foreground": "250 67% 25%",
    },
  },
  {
    id: "ocean-sapphire",
    name: "Ocean Sapphire",
    description: "Clean & professional",
    swatch: "#2d7ff9",
    variables: {
      "--primary": "217 90% 55%",
      "--primary-foreground": "210 40% 98%",
      "--primary-light": "210 85% 68%",
      "--primary-gradient-end": "195 85% 50%",
      "--tertiary": "190 80% 52%",
      "--ring": "217 90% 55%",
      "--sidebar-accent": "217 80% 95%",
      "--accent": "217 80% 95%",
      "--accent-foreground": "217 80% 25%",
    },
  },
  {
    id: "rose-ember",
    name: "Rose Ember",
    description: "Bold & unique",
    swatch: "#e84393",
    variables: {
      "--primary": "340 75% 55%",
      "--primary-foreground": "210 40% 98%",
      "--primary-light": "340 70% 70%",
      "--primary-gradient-end": "15 80% 55%",
      "--tertiary": "20 85% 58%",
      "--ring": "340 75% 55%",
      "--sidebar-accent": "340 70% 95%",
      "--accent": "340 70% 95%",
      "--accent-foreground": "340 70% 25%",
    },
  },
];

// Dark mode overrides — sidebar-accent needs darker values
const DARK_OVERRIDES: Record<ThemePresetId, Record<string, string>> = {
  "midnight-violet": {
    "--sidebar-accent": "250 67% 12%",
    "--accent": "250 67% 15%",
    "--accent-foreground": "250 30% 90%",
  },
  "ocean-sapphire": {
    "--sidebar-accent": "217 80% 12%",
    "--accent": "217 80% 15%",
    "--accent-foreground": "217 30% 90%",
  },
  "rose-ember": {
    "--sidebar-accent": "340 70% 12%",
    "--accent": "340 70% 15%",
    "--accent-foreground": "340 30% 90%",
  },
};

const STORAGE_KEY = "setu-theme-preset";
const DEFAULT_THEME: ThemePresetId = "midnight-violet";

/** Read saved theme from localStorage */
export function getStoredTheme(): ThemePresetId {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && THEME_PRESETS.some((p) => p.id === saved)) {
    return saved as ThemePresetId;
  }
  return DEFAULT_THEME;
}

/** Save theme to localStorage */
export function setStoredTheme(id: ThemePresetId): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, id);
}

/** Apply a theme preset's CSS variables to the document root */
export function applyThemePreset(id: ThemePresetId): void {
  const preset = THEME_PRESETS.find((p) => p.id === id);
  if (!preset) return;

  const root = document.documentElement;
  const isDark = root.classList.contains("dark");

  // Apply base variables
  for (const [varName, value] of Object.entries(preset.variables)) {
    root.style.setProperty(varName, value);
  }

  // Apply dark mode overrides if in dark mode
  if (isDark && DARK_OVERRIDES[id]) {
    for (const [varName, value] of Object.entries(DARK_OVERRIDES[id])) {
      root.style.setProperty(varName, value);
    }
  }

  setStoredTheme(id);
}

/** Re-apply the current theme (used when dark/light mode toggles) */
export function reapplyCurrentTheme(): void {
  applyThemePreset(getStoredTheme());
}
