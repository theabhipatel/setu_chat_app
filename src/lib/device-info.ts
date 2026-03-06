/**
 * Device Info Detection Utility
 * Uses User-Agent Client Hints API (Chrome 93+) as primary source,
 * falls back to UA string parsing for Firefox/Safari.
 */

import { isTauri } from "@/lib/tauri";

export interface DeviceInfo {
  deviceName: string;
  deviceType:
    | "desktop_app"
    | "desktop_browser"
    | "mobile_app"
    | "mobile_browser"
    | "tablet_browser";
  browserName: string;
  osName: string;
}

// --- Browser Detection (UA string) ---
function detectBrowser(ua: string): string {
  if (/SamsungBrowser/i.test(ua)) return "Samsung Internet";
  if (/OPR|Opera/i.test(ua)) return "Opera";
  if (/Edg\//i.test(ua)) return "Edge";
  if (/Brave/i.test(ua)) return "Brave";
  if (/Vivaldi/i.test(ua)) return "Vivaldi";
  if (/YaBrowser/i.test(ua)) return "Yandex";
  if (/UCBrowser/i.test(ua)) return "UC Browser";
  if (/Firefox|FxiOS/i.test(ua)) return "Firefox";
  if (/CriOS/i.test(ua)) return "Chrome";
  if (/Chrome/i.test(ua) && !/Chromium/i.test(ua)) return "Chrome";
  if (/Chromium/i.test(ua)) return "Chromium";
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return "Safari";
  return "Unknown Browser";
}

// --- OS Detection (UA string fallback for Firefox/Safari) ---
function detectOSFromUA(ua: string): string {
  // Android MUST come before Linux (Android UA contains "Linux")
  const androidMatch = ua.match(/Android\s*(\d+)/i);
  if (androidMatch) return `Android ${androidMatch[1]}`;

  // iOS
  const iphoneMatch = ua.match(/iPhone\s+OS\s+(\d+)/i);
  if (iphoneMatch) return `iOS ${iphoneMatch[1]}`;
  const ipadMatch = ua.match(/iPad.*OS\s+(\d+)/i);
  if (ipadMatch) return `iOS ${ipadMatch[1]}`;
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";

  // Windows
  if (/Windows/i.test(ua)) return "Windows";

  // macOS
  const macMatch = ua.match(/Mac\s+OS\s+X\s+(\d+)[_.](\d+)/i);
  if (macMatch) {
    const major = parseInt(macMatch[1]);
    const versionMap: Record<string, string> = {
      "15": "Sequoia",
      "14": "Sonoma",
      "13": "Ventura",
      "12": "Monterey",
      "11": "Big Sur",
    };
    const name = versionMap[String(major)] || "";
    return name ? `macOS ${name}` : `macOS`;
  }
  if (/Macintosh|Mac OS/i.test(ua)) return "macOS";

  // Linux distros (AFTER Android check so Android doesn't fall here)
  if (/Ubuntu/i.test(ua)) return "Ubuntu";
  if (/Fedora/i.test(ua)) return "Fedora";
  if (/CrOS/i.test(ua)) return "Chrome OS";
  if (/Linux/i.test(ua)) return "Linux";

  return "Unknown OS";
}

// --- Device Type Detection ---
function detectDeviceType(ua: string): DeviceInfo["deviceType"] {
  if (isTauri()) return "desktop_app";
  if (/iPad/i.test(ua)) return "tablet_browser";
  if (/Android/i.test(ua) && !/Mobile/i.test(ua)) return "tablet_browser";
  if (
    /iPhone|iPod|Android.*Mobile|webOS|BlackBerry|IEMobile|Opera Mini|Windows Phone/i.test(ua)
  ) {
    return "mobile_browser";
  }
  return "desktop_browser";
}

/**
 * Detect device type using Client Hints (more reliable than UA for mobile detection).
 */
function detectDeviceTypeFromHints(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hints: any,
  ua: string
): DeviceInfo["deviceType"] {
  if (isTauri()) return "desktop_app";

  const platform = hints.platform || "";
  const mobile = hints.mobile ?? false;

  if (platform === "Android" || platform === "iOS") {
    // Check if tablet (no "Mobile" in UA on Android tablets)
    if (/iPad/i.test(ua) || (platform === "Android" && !mobile)) {
      return "tablet_browser";
    }
    return "mobile_browser";
  }

  return "desktop_browser";
}

/**
 * Get OS name using Client Hints API (primary) or UA string (fallback).
 *
 * Client Hints advantages:
 * - Correctly distinguishes Windows 10 vs 11 (UA string can't)
 * - Correctly identifies Android (UA string contains "Linux" which is misleading)
 * - Returns device model for mobile devices
 */
async function detectOS(ua: string): Promise<{
  osName: string;
  model: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hints: any | null;
}> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav = navigator as any;
    if (nav.userAgentData?.getHighEntropyValues) {
      const hints = await nav.userAgentData.getHighEntropyValues([
        "platform",
        "platformVersion",
        "model",
        "mobile",
      ]);

      const platform = hints.platform || "";
      const version = hints.platformVersion || "";
      const model = hints.model || "";

      let osName: string;

      switch (platform) {
        case "Windows": {
          const major = parseInt(version.split(".")[0] || "0");
          osName = major >= 13 ? "Windows 11" : "Windows 10";
          break;
        }
        case "Android": {
          const androidMajor = version.split(".")[0] || "";
          osName = androidMajor ? `Android ${androidMajor}` : "Android";
          break;
        }
        case "macOS": {
          // Fall to UA for macOS version names (Client Hints doesn't have them)
          osName = detectOSFromUA(ua);
          break;
        }
        case "Chrome OS":
          osName = "Chrome OS";
          break;
        case "iOS":
          osName = version ? `iOS ${version.split(".")[0]}` : "iOS";
          break;
        case "Linux":
          osName = "Linux";
          break;
        default:
          osName = platform || detectOSFromUA(ua);
      }

      return { osName, model, hints };
    }
  } catch {
    // Client Hints not available
  }

  return { osName: detectOSFromUA(ua), model: "", hints: null };
}

/**
 * Get comprehensive device information from the current environment.
 * Async because Client Hints API is async.
 */
export async function getDeviceInfo(): Promise<DeviceInfo> {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      deviceName: "Unknown Device",
      deviceType: "desktop_browser",
      browserName: "Unknown",
      osName: "Unknown",
    };
  }

  const ua = navigator.userAgent;
  const browserName = detectBrowser(ua);
  const { osName, model, hints } = await detectOS(ua);
  const deviceType = hints
    ? detectDeviceTypeFromHints(hints, ua)
    : detectDeviceType(ua);

  // Construct human-readable device name
  let deviceName: string;
  if (deviceType === "desktop_app") {
    deviceName = `Setu Desktop on ${osName}`;
  } else if (
    (deviceType === "mobile_browser" || deviceType === "tablet_browser") &&
    model
  ) {
    // Include model for mobile devices (e.g. "Chrome on Android 14 · SM-S908B")
    deviceName = `${browserName} on ${osName} · ${model}`;
  } else {
    deviceName = `${browserName} on ${osName}`;
  }

  return {
    deviceName,
    deviceType,
    browserName,
    osName,
  };
}

/**
 * Get a display-friendly device type label.
 */
export function getDeviceTypeLabel(
  deviceType: DeviceInfo["deviceType"]
): string {
  const labels: Record<DeviceInfo["deviceType"], string> = {
    desktop_app: "Desktop App",
    desktop_browser: "Desktop Browser",
    mobile_app: "Mobile App",
    mobile_browser: "Mobile Browser",
    tablet_browser: "Tablet Browser",
  };
  return labels[deviceType] || "Unknown";
}

