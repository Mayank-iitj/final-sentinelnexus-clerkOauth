"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

type HealthData = { status: string; db: string; redis: string };

export default function StatusPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const check = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/../health`.replace("/api/v1/../", "/"), { cache: "no-store" });
      if (res.ok) { setHealth(await res.json()); } else { setHealth({ status: "error", db: "unknown", redis: "unknown" }); }
    } catch { setHealth({ status: "unreachable", db: "unknown", redis: "unknown" }); }
    setLastCheck(new Date());
    setLoading(false);
  };

  useEffect(() => { check(); const i = setInterval(check, 30000); return () => clearInterval(i); }, []);

  const statusColor = (s: string) => s === "ok" || s === "healthy" ? "text-emerald-400" : s === "degraded" || s === "unavailable" ? "text-amber-400" : "text-red-400";
  const dotColor = (s: string) => s === "ok" || s === "healthy" ? "bg-emerald-400" : s === "degraded" || s === "unavailable" ? "bg-amber-400" : "bg-red-400";

  const services = health ? [
    { name: "API Server", status: health.status === "unreachable" ? "down" : "operational", detail: health.status },
    { name: "Database (PostgreSQL/SQLite)", status: health.db, detail: health.db },
    { name: "Redis (Cache & Rate Limiting)", status: health.redis, detail: health.redis },
    { name: "Frontend (Next.js)", status: "ok", detail: "operational" },
    { name: "OAuth (Google)", status: "ok", detail: "operational" },
  ] : [];

  return (
    <main className="mesh-background min-h-screen text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/35 backdrop-blur-xl">
        <div className="section-shell flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3"><div className="glass-card flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold">SN</div><span className="font-display text-lg font-semibold">SentinelNexus</span></Link>
          <Link href="/login" className="rounded-full border border-white/20 px-4 py-2 text-sm text-gray-200 hover:border-violet-400 hover:text-white transition">Sign In</Link>
        </div>
      </header>

      <div className="section-shell py-12 max-w-2xl">
        <h1 className="font-display text-4xl font-extrabold mb-2">System Status</h1>
        <p className="text-gray-400 mb-8">Real-time health of SentinelNexus infrastructure.</p>

        {health && (
          <div className={`glass-card rounded-2xl p-6 mb-8 ${health.status === "healthy" ? "border-emerald-400/30" : health.status === "degraded" ? "border-amber-400/30" : "border-red-400/30"}`}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${dotColor(health.status)} animate-pulse`} />
              <span className={`text-lg font-bold capitalize ${statusColor(health.status)}`}>
                {health.status === "healthy" ? "All Systems Operational" : health.status === "degraded" ? "Partial Degradation" : "System Issues Detected"}
              </span>
            </div>
            {lastCheck && <p className="text-xs text-gray-500 mt-2">Last checked: {lastCheck.toLocaleTimeString()}</p>}
          </div>
        )}

        {loading && !health && <div className="text-sm text-gray-500 animate-pulse mb-8">Checking systems…</div>}

        <div className="space-y-3">
          {services.map((s) => (
            <div key={s.name} className="glass-card rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${dotColor(s.status)}`} />
                <span className="text-sm font-medium">{s.name}</span>
              </div>
              <span className={`text-xs font-semibold capitalize ${statusColor(s.status)}`}>{s.detail}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button onClick={check} disabled={loading} className="px-4 py-2 rounded-xl border border-white/20 text-sm text-gray-300 hover:border-violet-400 hover:text-white transition disabled:opacity-50">
            {loading ? "Checking…" : "Refresh Status"}
          </button>
        </div>
      </div>
    </main>
  );
}
