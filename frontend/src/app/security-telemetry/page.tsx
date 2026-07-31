"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { AppShell } from "../../components/AppShell";
import { motion } from "framer-motion";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

type SecurityTelemetry = {
  total_blocks_24h: number;
  active_banned_ips: number;
  top_attack_vector: string;
  threat_distribution: { vector: string; count: number }[];
  recent_events: {
    event: string;
    shadow: boolean;
    score: number;
    decision: string;
    primary_kind: string;
    all_kinds: string[];
    obfuscated: boolean;
    path: string;
    method: string;
    ip: string;
    request_id: string;
    evidence: string;
    attack_count: number;
    timestamp: number;
  }[];
  banned_ips_list: { ip: string }[];
};

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className="nub-card rounded-2xl p-5 flex flex-col gap-1 hover:border-violet-400/15 cursor-default"
    >
      <div className="text-xs text-gray-500 font-medium">{label}</div>
      <div className={`text-3xl font-bold tracking-tight ${accent ?? "text-white"}`}>{value}</div>
      {sub && <div className="text-[11px] text-gray-600 mt-0.5">{sub}</div>}
    </motion.div>
  );
}

export default function SecurityTelemetryPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [data, setData] = useState<SecurityTelemetry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) window.location.href = "/login";
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) return;
    fetch("/api/v1/security/telemetry")
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message || "Failed to load telemetry"))
      .finally(() => setLoading(false));
  }, [isSignedIn]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gray-500 text-sm animate-pulse">Loading telemetry…</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <AppShell>
      <div className="space-y-8 pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span className="text-violet-500">🛡️</span> Security Telemetry
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Live Phase 1 middleware defense metrics.
            </p>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="rounded-xl border border-red-500/30 bg-red-900/15 text-red-300 text-sm px-4 py-3"
          >
            {error}
          </motion.div>
        )}

        {data && (
          <>
            <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard 
                label="Total Blocks (24h)" 
                value={data.total_blocks_24h} 
                accent={data.total_blocks_24h > 0 ? "text-red-400" : "text-emerald-400"} 
                sub="Automated enforcement blocks" 
              />
              <StatCard 
                label="Active Banned IPs" 
                value={data.active_banned_ips} 
                accent={data.active_banned_ips > 0 ? "text-amber-400" : "text-emerald-400"} 
                sub="Redis layer 0 locks" 
              />
              <StatCard 
                label="Top Attack Vector" 
                value={data.top_attack_vector.replace("semantic_", "")} 
                sub="Most frequent primary_kind" 
              />
            </motion.div>

            <div className="grid md:grid-cols-[2fr_1fr] gap-6">
              {/* Activity Feed */}
              <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="nub-card rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-white mb-4">Recent Blocks & Warnings</h2>
                {data.recent_events.length === 0 ? (
                  <p className="text-xs text-gray-600">No security events recorded yet.</p>
                ) : (
                  <div className="space-y-2 h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {data.recent_events.map((ev, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.03)" }}
                        transition={{ duration: 0.15 }}
                        className={`flex flex-col gap-2 p-3 rounded-lg border border-white/[0.04] cursor-default ${
                          ev.decision === "block" ? "bg-red-500/[0.02]" : "bg-amber-500/[0.02]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                              ev.decision === "block" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                            }`}>
                              {ev.decision}
                            </span>
                            <span className="text-xs font-mono text-gray-400">{ev.primary_kind}</span>
                            <span className="text-xs text-gray-600">• Score: {ev.score}</span>
                            {ev.shadow && <span className="text-[10px] bg-white/10 text-gray-300 px-1 rounded">SHADOW</span>}
                            {ev.obfuscated && <span className="text-[10px] bg-violet-500/20 text-violet-300 px-1 rounded">OBFUSCATED</span>}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            {new Date(ev.timestamp * 1000).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-2">
                          <span className="text-gray-300">{ev.method}</span> {ev.path} <span className="text-gray-600 ml-2">from {ev.ip}</span>
                        </div>
                        {ev.evidence && (
                          <div className="mt-1 p-2 bg-black/40 rounded text-[11px] font-mono text-gray-400 whitespace-pre-wrap break-all border border-white/[0.05]">
                            {ev.evidence}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Sidebar */}
              <div className="space-y-6">
                <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="nub-card rounded-2xl p-5">
                  <h2 className="text-sm font-semibold text-white mb-4">Threat Distribution</h2>
                  {data.threat_distribution.length === 0 ? (
                    <p className="text-xs text-gray-600">No threats detected.</p>
                  ) : (
                    <div className="space-y-3">
                      {data.threat_distribution.map((td) => (
                        <div key={td.vector} className="flex items-center justify-between text-xs">
                          <span className="text-gray-400 font-mono">{td.vector}</span>
                          <span className="text-white font-bold">{td.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>

                <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="nub-card rounded-2xl p-5">
                  <h2 className="text-sm font-semibold text-white mb-4">Active Bans (Layer 0)</h2>
                  {data.banned_ips_list.length === 0 ? (
                    <p className="text-xs text-gray-600">No IPs currently banned.</p>
                  ) : (
                    <div className="space-y-2">
                      {data.banned_ips_list.map((b) => (
                        <div key={b.ip} className="flex items-center gap-2 text-xs py-1.5 px-2 bg-red-900/10 text-red-400 rounded font-mono border border-red-500/10">
                          <span>🚫</span> {b.ip}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </>
        )}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}} />
    </AppShell>
  );
}
