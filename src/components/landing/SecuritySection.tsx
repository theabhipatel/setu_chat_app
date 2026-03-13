"use client";

import { Shield, Lock, Eye, KeyRound, ServerCrash, Fingerprint } from "lucide-react";

const securityFeatures = [
  { icon: Lock, title: "Row Level Security", desc: "Supabase RLS ensures users only access their own data" },
  { icon: Eye, title: "Scoped Conversations", desc: "Users can only read conversations they belong to" },
  { icon: KeyRound, title: "Secure Sessions", desc: "HttpOnly cookies with automatic session persistence" },
  { icon: ServerCrash, title: "Protected Routes", desc: "Middleware-guarded pages redirect unauthorized users" },
  { icon: Fingerprint, title: "Email Verification", desc: "Token-based verification with 24-hour expiry" },
  { icon: Shield, title: "Role-based Access", desc: "Admin-only group management and owner-only deletion" },
];

export default function SecuritySection() {
  return (
    <section id="security" className="relative py-24 overflow-hidden">
      {/* Dark overlay for this section */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.06] via-background to-background" />
      <div className="orb w-[500px] h-[500px] bg-primary/8 bottom-0 right-0" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-on-scroll">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Security</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Built with <span className="gradient-text-hero">security first</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Enterprise-grade security with Supabase Row Level Security, encrypted sessions, and role-based access control.
          </p>
        </div>

        {/* Shield visual + grid */}
        <div className="grid lg:grid-cols-5 gap-8 items-center">
          {/* Center shield */}
          <div className="lg:col-span-2 flex justify-center animate-on-scroll-scale">
            <div className="relative">
              <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center glow-pulse">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center border border-primary/20">
                  <Shield className="h-16 w-16 sm:h-20 sm:w-20 text-primary animate-float-slow" />
                </div>
              </div>
              {/* Orbiting dots */}
              <div className="absolute top-2 right-4 w-3 h-3 rounded-full bg-success animate-pulse" />
              <div className="absolute bottom-4 left-2 w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: "0.5s" }} />
              <div className="absolute top-1/2 -right-2 w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" style={{ animationDelay: "1s" }} />
            </div>
          </div>

          {/* Feature cards */}
          <div className="lg:col-span-3 grid sm:grid-cols-2 gap-4">
            {securityFeatures.map((f, i) => (
              <div
                key={f.title}
                className="animate-on-scroll landing-card rounded-xl p-5 group"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{f.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
