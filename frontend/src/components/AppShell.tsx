"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren, useEffect, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { getUnreadCount } from "../lib/api";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "◈" },
  { href: "/boardroom", label: "Boardroom", icon: "❖" },
  { href: "/trust-score", label: "Trust Score", icon: "✦" },
  { href: "/heatmap", label: "Risk Heatmap", icon: "🗺" },
  { href: "/agents/marketplace", label: "Marketplace", icon: "◒" },
  { href: "/agents/red-team", label: "Red Team AI", icon: "🔴" },
  { href: "/agents/blue-team", label: "Blue Team AI", icon: "🔵" },
  { href: "/simulator", label: "Attack Simulator", icon: "⚔" },
  { href: "/governance", label: "AI Governance", icon: "⬡" },
  { href: "/compliance", label: "Compliance Auto", icon: "✓" },
  { href: "/compliance/copilot", label: "Compliance Chat", icon: "💬" },
  { href: "/security-telemetry", label: "Security Telemetry", icon: "🛡️" },
  { href: "/regulations", label: "Global Regs", icon: "⚖" },
  { href: "/explainability", label: "Explainability", icon: "👁" },
  { href: "/threats/zero-day", label: "Zero-Day Engine", icon: "⚡" },
  { href: "/threats/deepfake", label: "Deepfake Detection", icon: "🎭" },
  { href: "/threats/dark-web", label: "Dark Web Monitor", icon: "🕸" },
  { href: "/supply-chain", label: "Supply Chain", icon: "🔗" },
  { href: "/digital-twin", label: "Digital Twin", icon: "👯" },
  { href: "/attack-graph", label: "Attack Graph", icon: "🕸" },
  { href: "/time-machine", label: "Time Machine", icon: "⏳" },
  { href: "/remediation", label: "Auto Patch", icon: "🔧" },
  { href: "/insurance", label: "Cyber Insurance", icon: "🛡" },
  { href: "/copilot", label: "Exec Copilot", icon: "🤖" },
  { href: "/scanner", label: "Scanner", icon: "⬡" },
  { href: "/projects", label: "Projects", icon: "▤" },
  { href: "/reports", label: "Reports", icon: "☰" },
  { href: "/notifications", label: "Notifications", icon: "⚐" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export function AppShell({ children }: PropsWithChildren) {
  const { signOut } = useClerk();
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchCount = async () => {
      try {
        const { unread: count } = await getUnreadCount();
        if (mounted) setUnread(count);
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const sidebar = (
    <>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-violet-500/5 border border-violet-400/20 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:bg-violet-500/10 group-hover:border-violet-400/40 group-hover:shadow-[0_0_20px_rgba(124,58,237,.15)]">
            <Image src="/favicon.png" alt="SentinelNexus" width={36} height={36} className="object-cover" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white">SentinelNexus</div>
            <div className="text-[10px] text-violet-400/70 font-mono">AI Security Guard</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 text-sm overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && (pathname?.startsWith(item.href + "/") ?? false));
          const isNotifications = item.href === "/notifications";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                active
                  ? "bg-violet-500/12 text-white"
                  : "text-gray-500 hover:bg-white/[0.03] hover:text-gray-300"
              }`}
            >
              {active && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-xl bg-violet-500/12 border border-violet-400/25"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 text-base leading-none w-4 text-center opacity-70">{item.icon}</span>
              <span className="relative z-10 flex-1">{item.label}</span>
              {isNotifications && unread > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="relative z-10 text-[10px] px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold min-w-[18px] text-center"
                >
                  {unread > 99 ? "99+" : unread}
                </motion.span>
              )}
              {!isNotifications && active && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="relative z-10 w-1.5 h-1.5 rounded-full bg-violet-400"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/[0.06] text-xs text-gray-600">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono">v2.1.0</span>
          <span className="text-violet-400/60 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Online
          </span>
        </div>
        <button
          onClick={() => signOut({ redirectUrl: "/login" })}
          className="w-full text-left text-gray-500 hover:text-red-400 transition-colors duration-200 py-1"
        >
          Sign out →
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 border-r border-white/[0.06] bg-black fixed h-full z-20">
        {sidebar}
      </aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 md:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="fixed left-0 top-0 h-full w-64 bg-black border-r border-white/[0.06] z-40 flex flex-col md:hidden"
            >
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Mobile header */}
        <header className="md:hidden border-b border-white/[0.06] bg-black/95 backdrop-blur-xl px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <button onClick={() => setMobileOpen(true)} className="text-gray-400 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
          <Link href="/dashboard" className="text-sm font-bold">SentinelNexus</Link>
          <Link href="/notifications" className="relative text-gray-400 hover:text-white transition-colors">
            <span>⚐</span>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 text-[9px] px-1 rounded-full bg-red-500 text-white font-bold">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
        </header>

        <motion.main
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 px-4 md:px-8 py-6 max-w-7xl w-full mx-auto"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
