"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Shield, Users } from "lucide-react";

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

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 noise-overlay">
      {/* Background */}
      <div className="absolute inset-0 gradient-mesh" />
      <div className="absolute inset-0 dot-grid opacity-30" />
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

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/register">
                <Button size="lg" className="h-12 px-8 text-base font-semibold gap-2 w-full sm:w-auto group">
                  Start Chatting Free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg" className="h-12 px-8 text-base font-medium w-full sm:w-auto">
                  Explore Features
                </Button>
              </a>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap items-center gap-3 justify-center lg:justify-start">
              {[
                { icon: Zap, label: "Blazing Fast", color: "text-warning" },
                { icon: Shield, label: "Secure", color: "text-success" },
                { icon: Users, label: "Groups & 1-on-1", color: "text-blue-500" },
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

          {/* Right — Chat mockup */}
          <div className="hidden lg:flex justify-center">
            <div className="relative">
              {/* Pulse rings behind the mockup */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px]">
                <div className="absolute inset-0 rounded-full border border-primary/10 pulse-ring" />
                <div className="absolute inset-0 rounded-full border border-primary/10 pulse-ring" style={{ animationDelay: "0.7s" }} />
                <div className="absolute inset-0 rounded-full border border-primary/10 pulse-ring" style={{ animationDelay: "1.4s" }} />
              </div>

              <div className="relative animate-float">
                <div className="w-[380px] rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl shadow-primary/10 overflow-hidden shimmer-border">
                  {/* Mockup header */}
                  <div className="flex items-center gap-3 border-b border-border/50 px-5 py-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-sm font-bold">S</div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">Setu Team</p>
                      <p className="text-xs text-success flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-success inline-block animate-pulse" />
                        Online
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-red-500/80" />
                      <span className="w-3 h-3 rounded-full bg-warning/80" />
                      <span className="w-3 h-3 rounded-full bg-success/80" />
                    </div>
                  </div>
                  {/* Messages */}
                  <div className="p-4 space-y-3 min-h-[260px]">
                    <div className="chat-bubble-animate flex justify-start" style={{ animationDelay: "0.2s" }}>
                      <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 max-w-[75%]">
                        <p className="text-sm">Hey! Welcome to Setu 🎉</p>
                        <p className="text-[10px] text-muted-foreground mt-1">10:30 AM</p>
                      </div>
                    </div>
                    <div className="chat-bubble-animate flex justify-end" style={{ animationDelay: "0.6s" }}>
                      <div className="rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-2.5 max-w-[75%]">
                        <p className="text-sm">This looks amazing! 🚀</p>
                        <p className="text-[10px] text-primary-foreground/70 mt-1">10:31 AM</p>
                      </div>
                    </div>
                    <div className="chat-bubble-animate flex justify-start" style={{ animationDelay: "1s" }}>
                      <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 max-w-[75%]">
                        <p className="text-sm">Try the group chat feature! 👥</p>
                        <p className="text-[10px] text-muted-foreground mt-1">10:31 AM</p>
                      </div>
                    </div>
                    <div className="chat-bubble-animate flex justify-end" style={{ animationDelay: "1.4s" }}>
                      <div className="rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-2.5 max-w-[75%]">
                        <p className="text-sm">On it! Love the design ✨</p>
                        <p className="text-[10px] text-primary-foreground/70 mt-1">10:32 AM</p>
                      </div>
                    </div>
                  </div>
                  {/* Input */}
                  <div className="border-t border-border/50 px-4 py-3 flex items-center gap-2">
                    <div className="flex-1 rounded-full bg-muted/50 px-4 py-2 text-xs text-muted-foreground">Type a message...</div>
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center hover:scale-105 transition-transform">
                      <ArrowRight className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating status card */}
              <div className="absolute -bottom-6 -left-12 animate-float-delay">
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

              {/* Floating notification */}
              <div className="absolute -top-4 -right-10 animate-float-slow">
                <div className="rounded-xl bg-card/80 backdrop-blur-xl border border-border/50 px-3 py-2 shadow-lg flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Zap className="h-3 w-3 text-primary" />
                  </div>
                  <p className="text-[10px] font-medium">Message delivered</p>
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
