"use client";

import { Users, UserPlus, UserMinus, Crown, Hash, Pin, ImageIcon, LogOut } from "lucide-react";

const groupFeatures = [
  { icon: UserPlus, title: "Create & Invite", desc: "Create groups instantly and invite members by username" },
  { icon: Crown, title: "Admin Controls", desc: "Role-based management with admin and member roles" },
  { icon: Pin, title: "Pin Messages", desc: "Pin important messages for easy reference" },
  { icon: Hash, title: "@Mentions", desc: "Mention specific members to get their attention" },
  { icon: ImageIcon, title: "Group Avatar", desc: "Customize your group's identity with custom avatars" },
  { icon: UserMinus, title: "Remove Members", desc: "Admins can manage membership effortlessly" },
  { icon: LogOut, title: "Leave Group", desc: "Members can leave groups at any time" },
  { icon: Users, title: "Member List", desc: "View all members with online status indicators" },
];

export default function GroupsSection() {
  return (
    <section id="groups" className="relative py-24 overflow-hidden">
      <div className="orb w-[400px] h-[400px] bg-teal-500/8 -bottom-40 -right-40" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <div className="animate-on-scroll-left space-y-8">
            <div>
              <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Group Chat</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Powerful <span className="gradient-text-hero">group management</span>
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Create groups for your team, family, or community. Full admin controls, role management, and rich media sharing built right in.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {groupFeatures.map((f) => (
                <div
                  key={f.title}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <f.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{f.title}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Group mockup */}
          <div className="animate-on-scroll-right">
            <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden">
              {/* Group header */}
              <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 px-5 py-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white text-sm font-bold">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Design Team</p>
                    <p className="text-xs text-muted-foreground">8 members • 3 online</p>
                  </div>
                </div>
              </div>
              {/* Member list */}
              <div className="p-4 space-y-2">
                {[
                  { name: "Harsh S.", role: "Admin", online: true, color: "from-pink-500 to-rose-500" },
                  { name: "Shivam D.", role: "Member", online: true, color: "from-blue-500 to-cyan-500" },
                  { name: "Shubham K.", role: "Member", online: true, color: "from-emerald-500 to-teal-500" },
                  { name: "Abhishek S.", role: "Member", online: false, color: "from-amber-500 to-orange-500" },
                  { name: "Hritvik G.", role: "Member", online: false, color: "from-violet-500 to-purple-500" },
                ].map((m) => (
                  <div key={m.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="relative">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${m.color} flex items-center justify-center text-white text-xs font-bold`}>
                        {m.name[0]}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card ${m.online ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${m.role === "Admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
