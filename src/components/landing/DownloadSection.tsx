"use client";

import { Download, ExternalLink, Smartphone, Laptop, Globe, Monitor, ArrowRight, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

/* ========== CDN icons from devicons ========== */
const ICONS = {
  android: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/android/android-original.svg",
  apple: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apple/apple-original.svg",
  windows: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/windows11/windows11-original.svg",
  linux: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg",
};

/* ========== Platform data ========== */
const mobilePlatforms = [
  {
    name: "Android",
    subtitle: "Google Play Store",
    version: "v2.4.1",
    size: "48 MB",
    requirement: "Android 8.0+",
    icon: ICONS.android,
    brandColor: "#3DDC84",
    gradient: "from-[#3DDC84] to-[#2EA165]",
    hoverShadow: "hover:shadow-[0_8px_40px_-8px_rgba(61,220,132,0.4)]",
    features: ["Material You", "Widgets", "Notifications"],
  },
  {
    name: "iPhone & iPad",
    subtitle: "App Store",
    version: "v2.4.0",
    size: "52 MB",
    requirement: "iOS 16+",
    icon: ICONS.apple,
    brandColor: "#000000",
    gradient: "from-[#555] to-[#000]",
    hoverShadow: "hover:shadow-[0_8px_40px_-8px_rgba(255,255,255,0.15)]",
    features: ["Face ID", "iCloud Sync", "Widgets"],
    invertIcon: true,
  },
];

const desktopPlatforms = [
  {
    name: "Windows",
    subtitle: "Windows 10 / 11 (64-bit)",
    version: "v2.4.1",
    size: "86 MB",
    fileType: ".exe installer",
    icon: ICONS.windows,
    brandColor: "#0078D4",
    gradient: "from-[#0078D4] to-[#00BCF2]",
    hoverShadow: "hover:shadow-[0_8px_40px_-8px_rgba(0,120,212,0.4)]",
    badgeColor: "bg-[#0078D4]",
  },
  {
    name: "macOS",
    subtitle: "macOS 12 Monterey+",
    version: "v2.4.0",
    size: "92 MB",
    fileType: ".dmg package",
    icon: ICONS.apple,
    brandColor: "#A2AAAD",
    gradient: "from-[#666] to-[#333]",
    hoverShadow: "hover:shadow-[0_8px_40px_-8px_rgba(255,255,255,0.12)]",
    badgeColor: "bg-[#555]",
    invertIcon: true,
  },
  {
    name: "Linux",
    subtitle: "Ubuntu, Debian, Fedora",
    version: "v2.4.1",
    size: "78 MB",
    fileType: ".deb / .AppImage",
    icon: ICONS.linux,
    brandColor: "#FCC624",
    gradient: "from-[#E8950A] to-[#FCC624]",
    hoverShadow: "hover:shadow-[0_8px_40px_-8px_rgba(252,198,36,0.3)]",
    badgeColor: "bg-[#E8950A]",
  },
];

export default function DownloadSection() {
  return (
    <section id="download" className="relative py-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/[0.02] to-background" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 animate-on-scroll">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <Download className="h-3.5 w-3.5" />
            Download Setu
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Available on <span className="gradient-text-hero">every platform</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Get Setu on your favorite device. All versions sync your conversations seamlessly.
          </p>
        </div>

        {/* ---- Mobile ---- */}
        <div className="mb-12 animate-on-scroll">
          <div className="flex items-center gap-2 mb-5">
            <Smartphone className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Mobile</h3>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {mobilePlatforms.map((p) => (
              <div
                key={p.name}
                className={`group relative rounded-2xl border border-border/30 bg-card/40 backdrop-blur-xl p-6 transition-all duration-500 ${p.hoverShadow} hover:border-border/60 hover:-translate-y-1`}
              >
                <div className="flex items-start gap-5">
                  {/* Real icon from CDN */}
                  <div className="relative flex-shrink-0">
                    <Image
                      src={p.icon}
                      alt={p.name}
                      width={56}
                      height={56}
                      className={`drop-shadow-lg transition-transform duration-500 group-hover:scale-110 ${p.invertIcon ? "dark:invert" : ""}`}
                      unoptimized
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-lg">{p.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.subtitle}</p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-[11px] text-muted-foreground">
                      <span>{p.requirement}</span>
                      <span>•</span>
                      <span>{p.version}</span>
                      <span>•</span>
                      <span>{p.size}</span>
                    </div>

                    {/* Feature chips */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {p.features.map((f) => (
                        <span key={f} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border/30">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <Button
                  className={`w-full mt-5 bg-gradient-to-r ${p.gradient} text-white border-0 font-semibold shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all duration-300 gap-2 h-11`}
                >
                  <Download className="h-4 w-4" />
                  Download for {p.name.split(" ")[0]}
                  <ArrowRight className="h-4 w-4 ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* ---- Desktop ---- */}
        <div className="mb-12 animate-on-scroll" style={{ transitionDelay: "100ms" }}>
          <div className="flex items-center gap-2 mb-5">
            <Laptop className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Desktop</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {desktopPlatforms.map((p) => (
              <div
                key={p.name}
                className={`group relative rounded-2xl border border-border/30 bg-card/40 backdrop-blur-xl overflow-hidden transition-all duration-500 ${p.hoverShadow} hover:border-border/60 hover:-translate-y-1`}
              >
                {/* Gradient accent bar */}
                <div className={`h-1 bg-gradient-to-r ${p.gradient}`} />

                <div className="p-6 flex flex-col items-center text-center">
                  {/* Real icon from CDN */}
                  <div className="mb-4">
                    <Image
                      src={p.icon}
                      alt={p.name}
                      width={64}
                      height={64}
                      className={`drop-shadow-xl transition-transform duration-500 group-hover:scale-110 ${p.invertIcon ? "dark:invert" : ""}`}
                      unoptimized
                    />
                  </div>

                  <h4 className="font-bold text-lg">{p.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.subtitle}</p>

                  {/* File type + meta */}
                  <div className="flex items-center gap-2 mt-3 text-[11px] text-muted-foreground">
                    <span className={`px-2 py-0.5 rounded text-white text-[10px] font-semibold ${p.badgeColor}`}>
                      {p.fileType.split(" ")[0]}
                    </span>
                    <span>{p.version}</span>
                    <span>•</span>
                    <span>{p.size}</span>
                  </div>

                  <Button
                    className={`w-full mt-5 bg-gradient-to-r ${p.gradient} text-white border-0 font-semibold shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all duration-300 gap-2 h-10`}
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ---- Web App ---- */}
        <div className="animate-on-scroll-scale" style={{ transitionDelay: "200ms" }}>
          <div className="flex items-center gap-2 mb-5">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Web</h3>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-primary/20 bg-gradient-to-r from-primary/[0.04] via-card/80 to-violet-500/[0.04] backdrop-blur-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,hsl(var(--primary)/0.07),transparent_50%)]" />

            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center text-white shadow-xl shadow-primary/25 flex-shrink-0">
                <Globe className="h-7 w-7" />
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
                  <h4 className="font-bold text-lg">Web Application</h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                    <Check className="h-2.5 w-2.5" /> No install
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Open Setu in any browser — Chrome, Firefox, Safari, Edge. Full-featured, zero downloads.
                </p>
              </div>

              <Button className="bg-gradient-to-r from-primary to-violet-600 text-white border-0 font-semibold gap-2 shadow-xl shadow-primary/25 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 px-6 flex-shrink-0 h-11">
                <ExternalLink className="h-4 w-4" />
                Launch Web App
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Sync bar */}
        <div className="flex items-center justify-center gap-3 mt-10 animate-on-scroll">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-1">
              {[0, 0.2, 0.4].map((d) => (
                <span key={d} className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: `${d}s` }} />
              ))}
            </div>
            <Laptop className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-1">
              {[0.6, 0.8, 1].map((d) => (
                <span key={d} className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: `${d}s` }} />
              ))}
            </div>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">Syncs across all your devices in real-time</p>
        </div>
      </div>
    </section>
  );
}
