"use client";

import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Shivam Desai",
    role: "Product Lead",
    quote: "Setu replaced Slack for our team. The UI is stunning and the real-time sync is flawless.",
    avatar: "SD",
    color: "from-pink-500 to-rose-500",
  },
  {
    name: "Shubham Kanpure",
    role: "Software Engineer",
    quote: "Finally a chat app that feels premium. The dark mode and animations are really great.",
    avatar: "SK",
    color: "from-blue-500 to-cyan-500",
  },
  {
    name: "Prem Vishwakarma", 
    role: "Startup Founder",
    quote: "We moved our entire company communication to Setu. The group management features are unmatched.",
    avatar: "PV",
    color: "from-emerald-500 to-teal-500",
  },
  {
    name: "Abhishek Sharma",
    role: "Designer",
    quote: "I love how clean everything looks. No clutter, just beautiful conversations.",
    avatar: "AS",
    color: "from-violet-500 to-purple-500",
  },
  {
    name: "Harsh Sharma",
    role: "Software Engineer",
    quote: "The file sharing with previews is incredibly useful. Plus the search is lightning fast!",
    avatar: "HS",
    color: "from-amber-500 to-orange-500",
  },
  {
    name: "Hritvik Gour", 
    role: "Full Stack Developer",
    quote: "Emoji reactions, mentions, and pinned messages — everything we needed for our team.",
    avatar: "HG",
    color: "from-indigo-500 to-blue-500",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/[0.02] to-background" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-on-scroll">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Testimonials</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Loved by <span className="gradient-text-hero">thousands</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            See what teams and individuals are saying about Setu.
          </p>
        </div>

        {/* Scrolling marquee */}
        <div className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />

          <div className="flex animate-marquee">
            {[...testimonials, ...testimonials].map((t, i) => (
              <div
                key={`${t.name}-${i}`}
                className="flex-shrink-0 w-[320px] mx-3 landing-card rounded-2xl p-6"
              >
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-xs font-bold`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
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
