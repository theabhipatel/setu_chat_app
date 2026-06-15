"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Zap,
  Shield,
  Users,
  Download,
  Smartphone,
  Monitor,
  Wifi,
  Battery,
  Signal,
} from "lucide-react";
import setuLogo from "@/app/setu-white-tr.png";

/* ---- CDN icons (same source as DownloadSection) ---- */
const ANDROID_ICON =
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/android/android-original.svg";

/* ---- Inline SVG tech decorations ---- */
const ChipSvg = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="16" y="16" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="2" />
    <rect x="22" y="22" width="20" height="20" rx="2" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
    {/* Pins */}
    {[24, 32, 40].map((p) => (
      <g key={`pin-${p}`}>
        <line x1={p} y1="16" x2={p} y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1={p} y1="48" x2={p} y2="56" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="16" y1={p} x2="8" y2={p} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="48" y1={p} x2="56" y2={p} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    ))}
    <circle cx="32" cy="32" r="4" fill="currentColor" fillOpacity="0.4" />
  </svg>
);

const CircuitSvg = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 40h15M55 40h15M40 10v15M40 55v15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="40" cy="40" r="12" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="40" cy="40" r="5" fill="currentColor" fillOpacity="0.3" />
    <circle cx="10" cy="40" r="3" fill="currentColor" fillOpacity="0.5" />
    <circle cx="70" cy="40" r="3" fill="currentColor" fillOpacity="0.5" />
    <circle cx="40" cy="10" r="3" fill="currentColor" fillOpacity="0.5" />
    <circle cx="40" cy="70" r="3" fill="currentColor" fillOpacity="0.5" />
    <path d="M28 28l-10-10M52 28l10-10M28 52l-10 10M52 52l10 10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
  </svg>
);

const BoltSvg = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

/* ======== Shared chat messages for both devices ======== */
const chatMessages = [
  { text: "Hey! Welcome to Setu 🎉", time: "10:30 AM", sent: false, delay: "0.2s" },
  { text: "This looks amazing! 🚀", time: "10:31 AM", sent: true, delay: "0.6s" },
  { text: "Try the group chat feature! 👥", time: "10:31 AM", sent: false, delay: "1s" },
  { text: "On it! Love the design ✨", time: "10:32 AM", sent: true, delay: "1.4s" },
];

/* ======== Laptop Chat Mockup ======== */
function LaptopMockup() {
  return (
    <div className="hero-laptop-frame shimmer-border w-[370px]">
      {/* Title bar */}
      <div className="flex items-center gap-3 border-b border-border/50 px-5 py-3.5">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500/80" />
          <span className="w-3 h-3 rounded-full bg-warning/80" />
          <span className="w-3 h-3 rounded-full bg-success/80" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 px-4 py-1 rounded-md bg-muted/40 text-[10px] text-muted-foreground">
            <Monitor className="h-2.5 w-2.5" />
            setu.chat
          </div>
        </div>
      </div>

      {/* Chat header */}
      <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-xs font-bold">
          S
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">Setu Team</p>
          <p className="text-xs text-success flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-success inline-block animate-pulse" />
            Online
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="p-3.5 space-y-2.5 min-h-[180px]">
        {chatMessages.map((msg, i) => (
          <div
            key={i}
            className={`chat-bubble-animate flex ${msg.sent ? "justify-end" : "justify-start"}`}
            style={{ animationDelay: msg.delay }}
          >
            <div
              className={`rounded-2xl px-3.5 py-2 max-w-[75%] ${
                msg.sent
                  ? "rounded-tr-sm bg-primary text-primary-foreground"
                  : "rounded-tl-sm bg-muted"
              }`}
            >
              <p className="text-[12px]">{msg.text}</p>
              <p
                className={`text-[9px] mt-0.5 ${
                  msg.sent ? "text-primary-foreground/60" : "text-muted-foreground"
                }`}
              >
                {msg.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-border/50 px-3.5 py-2.5 flex items-center gap-2">
        <div className="flex-1 rounded-full bg-muted/50 px-3.5 py-1.5 text-[11px] text-muted-foreground flex items-center">
          Type a message...
          <span className="hero-typing-cursor" />
        </div>
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
          <ArrowRight className="h-3 w-3 text-primary-foreground" />
        </div>
      </div>

      {/* Laptop base */}
      <div className="hero-laptop-base" />
    </div>
  );
}

/* ======== Phone Chat Mockup ======== */
function PhoneMockup() {
  return (
    <div className="hero-phone-frame shimmer-border w-[190px]">
      {/* Phone notch */}
      <div className="hero-phone-notch" />

      {/* Status bar */}
      <div className="hero-phone-status">
        <span>9:41</span>
        <div className="flex items-center gap-1">
          <Signal className="h-2.5 w-2.5" />
          <Wifi className="h-2.5 w-2.5" />
          <Battery className="h-2.5 w-2.5" />
        </div>
      </div>

      {/* Chat header */}
      <div className="flex items-center gap-2 border-b border-border/50 px-3 py-2">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-[9px] font-bold">
          S
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[11px]">Setu Team</p>
          <p className="text-[8px] text-success flex items-center gap-0.5">
            <span className="w-1 h-1 rounded-full bg-success inline-block animate-pulse" />
            Online
          </p>
        </div>
      </div>

      {/* Messages (compact) */}
      <div className="p-2.5 space-y-1.5 min-h-[150px]">
        {chatMessages.map((msg, i) => (
          <div
            key={i}
            className={`chat-bubble-animate flex ${msg.sent ? "justify-end" : "justify-start"}`}
            style={{ animationDelay: `${parseFloat(msg.delay) + 0.3}s` }}
          >
            <div
              className={`rounded-xl px-2.5 py-1.5 max-w-[80%] ${
                msg.sent
                  ? "rounded-tr-sm bg-primary text-primary-foreground"
                  : "rounded-tl-sm bg-muted"
              }`}
            >
              <p className="text-[10px] leading-tight">{msg.text}</p>
              <p
                className={`text-[7px] mt-0.5 ${
                  msg.sent ? "text-primary-foreground/60" : "text-muted-foreground"
                }`}
              >
                {msg.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-border/50 px-2.5 py-2 flex items-center gap-1.5">
        <div className="flex-1 rounded-full bg-muted/50 px-2.5 py-1 text-[9px] text-muted-foreground">
          Message...
        </div>
        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
          <ArrowRight className="h-2.5 w-2.5 text-primary-foreground" />
        </div>
      </div>

      {/* Phone home indicator */}
      <div className="flex justify-center py-1.5">
        <div className="w-16 h-1 rounded-full bg-muted-foreground/20" />
      </div>
    </div>
  );
}

/* ======== Main Hero Section ======== */
export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 noise-overlay">
      {/* Background */}
      <div className="absolute inset-0 gradient-mesh pointer-events-none" />
      <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />
      <div className="orb w-[500px] h-[500px] bg-primary/20 -top-40 -left-40" />
      <div className="orb w-[400px] h-[400px] bg-purple-500/15 -bottom-32 -right-32" />
      <div className="orb w-[300px] h-[300px] bg-indigo-400/10 top-1/3 right-1/4" />

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[
          { top: "15%", left: "10%", size: 4, delay: "0s", duration: "3s" },
          { top: "25%", left: "85%", size: 3, delay: "1s", duration: "4s" },
          { top: "60%", left: "15%", size: 5, delay: "0.5s", duration: "3.5s" },
          { top: "70%", left: "90%", size: 3, delay: "2s", duration: "3s" },
          { top: "40%", left: "5%", size: 4, delay: "1.5s", duration: "4.5s" },
          { top: "80%", left: "70%", size: 3, delay: "0.8s", duration: "3.2s" },
        ].map((p, i) => (
          <div
            key={i}
            className="particle absolute rounded-full bg-primary"
            style={{
              top: p.top, left: p.left, width: p.size, height: p.size,
              "--delay": p.delay, "--duration": p.duration,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Floating tech SVG decorations */}
      <div className="hidden xl:block absolute top-24 right-[7%] animate-float-slow text-primary/20">
        <ChipSvg className="w-20 h-20 rotate-12" />
      </div>
      <div className="hidden xl:block absolute bottom-28 left-[5%] animate-float-delay text-primary/15">
        <CircuitSvg className="w-24 h-24 -rotate-6" />
      </div>
      <div className="hidden xl:block absolute top-[42%] left-[3%] animate-float text-warning/20">
        <BoltSvg className="w-10 h-10" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — Copy */}
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Zap className="h-3.5 w-3.5" />
              Real-time messaging platform
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.1]">
              Connect with{" "}
              <span className="gradient-text-hero">anyone,</span>
              <br />
              <span className="gradient-text-hero">anywhere</span> instantly
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Setu is a premium, enterprise-grade chat application with private
              & group messaging, real-time presence, and end-to-end security.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link href="/login">
                <Button size="lg" className="h-12 px-8 text-base font-semibold gap-2.5 w-full sm:w-auto group">
                  <Image src={setuLogo} alt="Setu" width={20} height={20} className="object-contain" />
                  Chat Now
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>

              <a
                href="/setu.v1.0.apk"
                download
                className="h-12 px-6 text-base font-semibold gap-2.5 w-full sm:w-auto group inline-flex items-center justify-center rounded-md bg-card/80 backdrop-blur-sm border border-border/60 text-foreground shadow-lg shadow-primary/5 cursor-pointer hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              >
                <Image
                  src={ANDROID_ICON}
                  alt="Android"
                  width={22}
                  height={22}
                  className="drop-shadow-md"
                  unoptimized
                />
                <span>Download APK</span>
                <Download className="h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>

            {/* Explore features text link */}
            <div className="flex items-center gap-1 justify-center lg:justify-start">
              <a
                href="#features"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors group inline-flex items-center gap-1.5"
              >
                Explore Features
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </a>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap items-center gap-3 justify-center lg:justify-start">
              {[
                { icon: Zap, label: "Blazing Fast", color: "text-warning" },
                { icon: Shield, label: "Secure", color: "text-success" },
                { icon: Users, label: "Groups & 1-on-1", color: "text-blue-500" },
                { icon: Smartphone, label: "Mobile + Web", color: "text-primary" },
              ].map((t) => (
                <div
                  key={t.label}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors"
                >
                  <t.icon className={`h-3 w-3 ${t.color}`} />
                  {t.label}
                </div>
              ))}
            </div>
          </div>

          {/* Right — Dual Device Mockup (decorative only, must not capture cursor) */}
          <div className="hidden lg:flex justify-center pointer-events-none">
            <div className="relative hero-perspective">
              {/* Pulse rings behind everything */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] h-[460px]">
                <div className="absolute inset-0 rounded-full border border-primary/10 pulse-ring" />
                <div className="absolute inset-0 rounded-full border border-primary/10 pulse-ring" style={{ animationDelay: "0.7s" }} />
                <div className="absolute inset-0 rounded-full border border-primary/10 pulse-ring" style={{ animationDelay: "1.4s" }} />
              </div>

              {/* Glow effects */}
              <div className="hero-device-glow hero-device-glow-primary w-[300px] h-[300px] -top-10 -left-10" />
              <div className="hero-device-glow hero-device-glow-android w-[200px] h-[200px] bottom-0 right-0" />

              {/* Laptop — background, slightly left */}
              <div className="relative animate-float-slow">
                <LaptopMockup />
              </div>

              {/* Phone — foreground, overlapping bottom-right */}
              <div className="absolute -bottom-8 -right-8 animate-float-delay z-10">
                <PhoneMockup />

                {/* Android available badge */}
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <div className="hero-android-badge rounded-full px-3 py-1 text-[10px] font-semibold flex items-center gap-1.5 shadow-lg">
                    <Image
                      src={ANDROID_ICON}
                      alt="Android"
                      width={12}
                      height={12}
                      unoptimized
                    />
                    Available on Android
                  </div>
                </div>
              </div>

              {/* Floating status card — bottom-left of laptop */}
              <div className="absolute -bottom-6 -left-14 animate-float-delay z-20">
                <div className="rounded-xl bg-card/80 backdrop-blur-xl border border-border/50 px-4 py-3 shadow-lg flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">3 online now</p>
                    <p className="text-[10px] text-muted-foreground">Design Team</p>
                  </div>
                </div>
              </div>

              {/* Floating notification — top-right of phone */}
              <div className="absolute -top-4 -right-12 animate-float-slow z-20">
                <div className="rounded-xl bg-card/80 backdrop-blur-xl border border-border/50 px-3 py-2 shadow-lg flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Zap className="h-3 w-3 text-primary" />
                  </div>
                  <p className="text-[10px] font-medium">Message delivered</p>
                </div>
              </div>

              {/* Sync indicator between devices */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                <div className="flex items-center gap-1">
                  {[0, 0.2, 0.4].map((d) => (
                    <span
                      key={d}
                      className="w-1 h-1 rounded-full bg-primary animate-pulse"
                      style={{ animationDelay: `${d}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scan line */}
      <div className="scan-line" />
    </section>
  );
}
