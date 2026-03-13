"use client";

import { Zap, Radio, Eye, Clock, CheckCheck, Sparkles } from "lucide-react";

const realtimeFeatures = [
  { icon: Radio, label: "Live Message Sync", desc: "Messages appear instantly across all devices" },
  { icon: Clock, label: "Typing Indicators", desc: "See when someone is composing a message" },
  { icon: Eye, label: "Online Presence", desc: "Real-time online/offline status for every user" },
  { icon: CheckCheck, label: "Read Receipts", desc: "Know exactly when your messages are read" },
  { icon: Sparkles, label: "Optimistic UI", desc: "Messages feel instant with optimistic updates" },
  { icon: Zap, label: "Delivered Status", desc: "Delivery confirmation for every message sent" },
];

export default function RealtimeSection() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Gradient that spans into next section */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-primary/[0.06]" />
      <div className="orb w-[400px] h-[400px] bg-success/10 top-20 -left-40" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — animated chat preview */}
          <div className="animate-on-scroll-left">
            <div className="relative">
              <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-6 shadow-xl glow-pulse">
                <div className="space-y-4">
                  {/* Message with typing */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">A</div>
                    <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5">
                      <p className="text-sm">Have you tried the new real-time features?</p>
                    </div>
                  </div>
                  <div className="flex justify-end items-start gap-3">
                    <div className="rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-2.5">
                      <p className="text-sm">Yes! The typing indicator is so smooth ✨</p>
                    </div>
                  </div>
                  {/* Typing indicator */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">A</div>
                    <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3 flex items-center gap-1">
                      <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground/50" />
                      <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground/50" />
                      <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground/50" />
                    </div>
                  </div>
                </div>
                {/* Status bar */}
                <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    Abhi is online
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                    Read
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right — feature list */}
          <div className="animate-on-scroll-right space-y-8">
            <div>
              <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Real-Time Engine</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Powered by <span className="gradient-text-hero">Supabase Realtime</span>
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Every interaction happens in real-time. From the moment a message is sent to seeing the typing indicator — everything is instant.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {realtimeFeatures.map((f) => (
                <div key={f.label} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <f.icon className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{f.label}</p>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
