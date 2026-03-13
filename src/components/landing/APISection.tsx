"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Key, MessageSquare, Users, Hash, Send, ShieldCheck } from "lucide-react";

/* ---- Thunder bolt SVG ---- */
const ThunderSvg = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

/* ---- Circuit connection SVG ---- */
const ApiCircuitSvg = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Main horizontal bar */}
    <line x1="40" y1="60" x2="160" y2="60" stroke="currentColor" strokeWidth="2" opacity="0.3" />
    {/* Center hub */}
    <circle cx="100" cy="60" r="20" stroke="currentColor" strokeWidth="2" opacity="0.5" />
    <circle cx="100" cy="60" r="8" fill="currentColor" fillOpacity="0.2" />
    {/* Thunder in center */}
    <path d="M103 52l-7 9h5l-1 7 7-9h-5l1-7z" fill="currentColor" fillOpacity="0.6" />
    {/* Left endpoints */}
    <line x1="40" y1="60" x2="20" y2="30" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
    <line x1="40" y1="60" x2="20" y2="60" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
    <line x1="40" y1="60" x2="20" y2="90" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
    <circle cx="20" cy="30" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
    <circle cx="20" cy="60" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
    <circle cx="20" cy="90" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
    {/* Right endpoints */}
    <line x1="160" y1="60" x2="180" y2="30" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
    <line x1="160" y1="60" x2="180" y2="60" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
    <line x1="160" y1="60" x2="180" y2="90" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
    <circle cx="180" cy="30" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
    <circle cx="180" cy="60" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
    <circle cx="180" cy="90" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
    {/* Pulse dots on left */}
    <circle cx="20" cy="30" r="2.5" fill="currentColor" fillOpacity="0.3" />
    <circle cx="20" cy="60" r="2.5" fill="currentColor" fillOpacity="0.3" />
    <circle cx="20" cy="90" r="2.5" fill="currentColor" fillOpacity="0.3" />
    {/* Pulse dots on right */}
    <circle cx="180" cy="30" r="2.5" fill="currentColor" fillOpacity="0.3" />
    <circle cx="180" cy="60" r="2.5" fill="currentColor" fillOpacity="0.3" />
    <circle cx="180" cy="90" r="2.5" fill="currentColor" fillOpacity="0.3" />
  </svg>
);

const apiFeatures = [
  { icon: MessageSquare, label: "Private Messages", desc: "Send 1-on-1 messages via API" },
  { icon: Users, label: "Group Messages", desc: "Push messages to any group" },
  { icon: Hash, label: "Channels", desc: "Broadcast to channels at scale" },
  { icon: Send, label: "Bulk Messaging", desc: "Send to thousands in one call" },
  { icon: ShieldCheck, label: "Secure Tokens", desc: "Scoped API keys with revocation" },
  { icon: Key, label: "OAuth & Webhooks", desc: "Full webhook support for events" },
];

const steps = [
  { step: "01", title: "Create Account", desc: "Sign up for free on Setu", color: "from-blue-500 to-cyan-500" },
  { step: "02", title: "Generate Token", desc: "Get your API key in settings", color: "from-violet-500 to-purple-500" },
  { step: "03", title: "Send Messages", desc: "Hit the REST API endpoint", color: "from-amber-500 to-orange-500" },
];

export default function APISection() {
  return (
    <section id="api" className="relative py-28 overflow-hidden">
      {/* Background — gradient spanning from previous section */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-amber-500/[0.02] to-primary/[0.03]" />
      <div className="absolute inset-0 tech-grid opacity-30" />

      {/* Floating thunder bolts */}
      <div className="absolute top-16 left-[8%] animate-float text-warning/15">
        <ThunderSvg className="w-16 h-16 rotate-12" />
      </div>
      <div className="absolute bottom-20 right-[6%] animate-float-slow text-warning/10">
        <ThunderSvg className="w-12 h-12 -rotate-12" />
      </div>
      <div className="absolute top-1/2 right-[12%] animate-float-delay text-primary/10">
        <ThunderSvg className="w-8 h-8 rotate-45" />
      </div>

      {/* Orbs */}
      <div className="orb w-[500px] h-[500px] bg-warning/8 -top-40 right-0" />
      <div className="orb w-[400px] h-[400px] bg-primary/8 bottom-0 -left-40" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20 animate-on-scroll">
          <div className="inline-flex items-center gap-2 rounded-full border border-warning/30 bg-warning/5 px-4 py-1.5 text-sm font-medium text-warning mb-6">
            <ThunderSvg className="h-3.5 w-3.5" />
            Supercharged API
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            <span className="gradient-text-hero">Public API</span> — build anything
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Integrate Setu into your apps. Create an account, generate a token, and start sending messages
            to private chats, groups, and channels via our powerful REST API.
          </p>
        </div>

        {/* Main content — circuit visual + features */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          {/* Left — API circuit visual */}
          <div className="animate-on-scroll-left flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-warning/5 rounded-3xl blur-3xl scale-90" />
              <div className="relative rounded-2xl border border-border/40 bg-card/50 backdrop-blur-xl p-8 sm:p-10 overflow-hidden">
                {/* Powered by badge */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white">
                    <ThunderSvg className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold">Powered by Setu Engine</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">
                    v2.0
                  </span>
                </div>

                {/* Circuit diagram */}
                <div className="text-primary mb-6">
                  <ApiCircuitSvg className="w-full h-auto max-w-[320px] mx-auto" />
                </div>

                {/* Labels under circuit */}
                <div className="flex justify-between text-[10px] font-medium text-muted-foreground px-2">
                  <div className="text-center">
                    <p>Your App</p>
                    <p className="text-primary font-semibold">REST API</p>
                  </div>
                  <div className="text-center">
                    <p>Setu Engine</p>
                    <p className="text-warning font-semibold flex items-center gap-1 justify-center">
                      <ThunderSvg className="w-2.5 h-2.5" /> Powered
                    </p>
                  </div>
                  <div className="text-center">
                    <p>Recipients</p>
                    <p className="text-success font-semibold">Delivered</p>
                  </div>
                </div>

                {/* Scan line effect */}
                <div className="scan-line" />
              </div>
            </div>
          </div>

          {/* Right — API features */}
          <div className="animate-on-scroll-right space-y-6">
            <div className="grid grid-cols-2 gap-3">
              {apiFeatures.map((f) => (
                <div
                  key={f.label}
                  className="group flex items-start gap-3 p-3.5 rounded-xl border border-border/40 bg-card/30 hover:bg-card/60 hover:border-amber-500/20 transition-all duration-300"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110">
                    <f.icon className="h-4 w-4 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{f.label}</p>
                    <p className="text-[11px] text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Steps — How it works */}
        <div className="animate-on-scroll">
          <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl p-8 sm:p-10 overflow-hidden relative">
            {/* Thunder background accents */}
            <div className="absolute top-4 right-6 text-warning/5">
              <ThunderSvg className="w-32 h-32" />
            </div>
            <div className="absolute bottom-4 left-6 text-primary/5">
              <ThunderSvg className="w-24 h-24 rotate-180" />
            </div>

            <p className="text-sm font-semibold text-warning uppercase tracking-widest mb-6 relative z-10">Get started in 3 steps</p>
            <div className="grid sm:grid-cols-3 gap-6 relative z-10">
              {steps.map((s, i) => (
                <div key={s.step} className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white font-extrabold text-lg flex-shrink-0 shadow-lg`}>
                    {s.step}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{s.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="hidden sm:flex items-center absolute" style={{ left: `${33 * (i + 1)}%`, top: "50%", transform: "translateY(-50%)" }}>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-8 relative z-10">
              <Link href="/register">
                <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 font-semibold gap-2 shadow-xl shadow-amber-500/20 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 px-8">
                  <Key className="h-4 w-4" />
                  Get Your API Key
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
