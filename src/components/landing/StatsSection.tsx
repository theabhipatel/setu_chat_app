"use client";

import { MessageSquare, Users, Zap, Globe, TrendingUp } from "lucide-react";

const stats = [
  { icon: MessageSquare, label: "Messages Sent Daily", value: "10M+", color: "text-primary", gradient: "from-primary/20 to-violet-500/20", borderGlow: "group-hover:shadow-primary/20" },
  { icon: Users, label: "Active Users", value: "500K+", color: "text-success", gradient: "from-success/20 to-success/10", borderGlow: "group-hover:shadow-success/20" },
  { icon: Zap, label: "Uptime Guarantee", value: "99.9%", color: "text-warning", gradient: "from-warning/20 to-warning/10", borderGlow: "group-hover:shadow-warning/20" },
  { icon: Globe, label: "Countries", value: "120+", color: "text-blue-500", gradient: "from-blue-500/20 to-cyan-500/20", borderGlow: "group-hover:shadow-blue-500/20" },
];

export default function StatsSection() {
  return (
    <section className="relative py-20 -mt-10 z-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="animate-on-scroll grid grid-cols-2 md:grid-cols-4 gap-5">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`group relative rounded-2xl border border-border/40 bg-card/50 backdrop-blur-xl p-6 text-center overflow-hidden transition-all duration-500 hover:shadow-2xl ${s.borderGlow} hover:border-transparent`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              {/* Top gradient bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${s.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              {/* Background glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />
              
              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mx-auto mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                  <s.icon className={`h-6 w-6 ${s.color}`} />
                </div>
                <p className="text-3xl sm:text-4xl font-extrabold tracking-tight counter-mono">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1.5 flex items-center justify-center gap-1">
                  <TrendingUp className="h-3 w-3 text-success" />
                  {s.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
