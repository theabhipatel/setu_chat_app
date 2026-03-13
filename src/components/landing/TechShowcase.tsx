"use client";

import { Cpu, Brain, Zap, Gauge, Layers, Sparkles } from "lucide-react";

/* ---- Inline SVG: Processor chip ---- */
const ProcessorSvg = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Outer board traces */}
    {[30, 50, 70, 90].map((p) => (
      <g key={`trace-${p}`}>
        <line x1={p} y1="15" x2={p} y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
        <line x1={p} y1="105" x2={p} y2="115" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
        <line x1="15" y1={p} x2="5" y2={p} stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
        <line x1="105" y1={p} x2="115" y2={p} stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
        <circle cx={p} cy="5" r="2" fill="currentColor" opacity="0.4" />
        <circle cx={p} cy="115" r="2" fill="currentColor" opacity="0.4" />
        <circle cx="5" cy={p} r="2" fill="currentColor" opacity="0.4" />
        <circle cx="115" cy={p} r="2" fill="currentColor" opacity="0.4" />
      </g>
    ))}
    {/* Main chip body */}
    <rect x="20" y="20" width="80" height="80" rx="8" stroke="currentColor" strokeWidth="2.5" />
    <rect x="32" y="32" width="56" height="56" rx="4" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="1.5" />
    {/* Inner AI brain pattern */}
    <circle cx="60" cy="60" r="14" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
    <circle cx="60" cy="60" r="6" fill="currentColor" fillOpacity="0.3" />
    <path d="M48 52c4-6 8-6 12 0s8 6 12 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    <path d="M48 68c4-6 8-6 12 0s8 6 12 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
  </svg>
);

/* ---- Inline SVG: Neural network ---- */
const NeuralSvg = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Connections */}
    {[
      [15,20,40,15], [15,20,40,50], [15,50,40,15], [15,50,40,50], [15,50,40,85],
      [15,80,40,50], [15,80,40,85], [40,15,65,30], [40,15,65,70],
      [40,50,65,30], [40,50,65,70], [40,85,65,30], [40,85,65,70],
      [65,30,85,50], [65,70,85,50],
    ].map(([x1,y1,x2,y2], i) => (
      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="0.8" opacity="0.25" />
    ))}
    {/* Nodes — input layer */}
    {[20, 50, 80].map((y) => <circle key={`i-${y}`} cx="15" cy={y} r="5" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.2" />)}
    {/* Hidden layer */}
    {[15, 50, 85].map((y) => <circle key={`h-${y}`} cx="40" cy={y} r="5" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.2" />)}
    {/* Hidden 2 */}
    {[30, 70].map((y) => <circle key={`h2-${y}`} cx="65" cy={y} r="5" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.2" />)}
    {/* Output */}
    <circle cx="85" cy="50" r="6" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const techPowers = [
  {
    icon: Cpu,
    title: "High-Performance Engine",
    desc: "Powered by an optimized server architecture for instant message delivery across millions of users.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Brain,
    title: "AI-Powered Intelligence",
    desc: "Smart notifications, intelligent search ranking, and AI-assisted message suggestions built right in.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: Zap,
    title: "Lightning Fast Protocol",
    desc: "WebSocket-based real-time protocol ensuring sub-100ms message delivery worldwide.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Gauge,
    title: "Auto-Scaling Infrastructure",
    desc: "Automatically scales to handle traffic spikes — from 100 to 10 million concurrent connections.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: Layers,
    title: "Edge-Optimized CDN",
    desc: "Static assets served from the nearest edge node for blazing-fast page loads globally.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: Sparkles,
    title: "Smart Caching Layer",
    desc: "Intelligent caching of conversations, media, and user data for offline-first experiences.",
    gradient: "from-indigo-500 to-blue-500",
  },
];

export default function TechShowcase() {
  return (
    <section className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent" />
      <div className="absolute inset-0 tech-grid opacity-40" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20 animate-on-scroll">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <Cpu className="h-3.5 w-3.5" />
            Powered by cutting-edge tech
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            The <span className="gradient-text-hero">powerhouse</span> behind Setu
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Enterprise-grade infrastructure with AI intelligence, auto-scaling, and the fastest real-time protocol.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-10 items-center">
          {/* Center — Processor visual */}
          <div className="lg:col-span-2 flex justify-center animate-on-scroll-scale">
            <div className="relative">
              {/* Glow behind */}
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl scale-75" />

              {/* Processor SVG */}
              <div className="relative text-primary animate-float-slow">
                <ProcessorSvg className="w-48 h-48 sm:w-56 sm:h-56" />
              </div>

              {/* Neural net overlay */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary/40">
                <NeuralSvg className="w-32 h-32" />
              </div>

              {/* Orbiting elements */}
              <div className="absolute -top-2 right-6 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-warning/10 border border-warning/20 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-warning" />
                </div>
              </div>
              <div className="absolute -bottom-2 left-6 animate-pulse" style={{ animationDelay: "1s" }}>
                <div className="w-8 h-8 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center">
                  <Gauge className="h-4 w-4 text-success" />
                </div>
              </div>
              <div className="absolute top-1/2 -right-4 animate-pulse" style={{ animationDelay: "0.5s" }}>
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <Brain className="h-4 w-4 text-violet-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Power feature cards */}
          <div className="lg:col-span-3 grid sm:grid-cols-2 gap-4">
            {techPowers.map((f, i) => (
              <div
                key={f.title}
                className="animate-on-scroll group relative rounded-xl border border-border/40 bg-card/50 backdrop-blur-xl p-5 overflow-hidden transition-all duration-500 hover:border-transparent hover:shadow-xl"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${f.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${f.gradient} flex items-center justify-center flex-shrink-0 text-white transition-transform group-hover:scale-110 group-hover:rotate-6`}>
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{f.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.desc}</p>
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
