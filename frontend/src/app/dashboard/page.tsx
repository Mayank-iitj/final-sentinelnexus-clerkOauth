"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { AppShell } from "../../components/AppShell";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  getDashboardStats,
  DashboardStats,
  riskColor,
  severityColor,
} from "../../lib/api";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

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

function SeverityBar({ dist }: { dist: Record<string, number> }) {
  const total = Object.values(dist).reduce((a, b) => a + b, 0);
  if (total === 0) return <div className="text-xs text-gray-600">No findings yet.</div>;
  const colors = { critical: "bg-violet-500", high: "bg-red-500", medium: "bg-amber-400", low: "bg-emerald-400" };
  return (
    <div className="space-y-3">
      {(["critical", "high", "medium", "low"] as const).map((sev) => {
        const count = dist[sev] ?? 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={sev} className="flex items-center gap-3 text-xs">
            <span className="w-16 text-gray-500 capitalize">{sev}</span>
            <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className={`h-full rounded-full ${colors[sev]}`}
              />
            </div>
            <span className="w-8 text-right text-gray-400 font-mono">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) window.location.href = "/login";
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) return;
    getDashboardStats()
      .then(setStats)
      .catch((e) => setError(e.message ?? "Failed to load stats"))
      .finally(() => setLoading(false));
  }, [isSignedIn]);

  const isFallback = stats?._is_fallback === true;

  // Auto-retry when in fallback/demo mode — poll every 30 s until live data is available
  useEffect(() => {
    if (!isFallback) return;
    const id = setInterval(() => {
      getDashboardStats().then((data) => {
        if (!data._is_fallback) {
          setStats(data);
          setError(null);
        }
      }).catch(() => {/* stay in fallback */});
    }, 30_000);
    return () => clearInterval(id);
  }, [isFallback]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gray-500 text-sm animate-pulse">Loading dashboard…</div>
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
            <h1 className="text-2xl font-bold">
              Welcome, {user.firstName ?? "there"}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isFallback
                ? "Demo data — backend connecting…"
                : "Your AI security posture at a glance — live from the database."}
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link href="/scanner" className="btn-primary !py-2.5 !px-5 text-sm">
              + New Scan
            </Link>
          </motion.div>
        </motion.div>

        {/* Demo mode notice — shown when backend is unreachable */}
        {isFallback && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2.5 rounded-xl border border-amber-500/25 bg-amber-900/10 px-4 py-2.5 text-xs text-amber-300/80"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <span>
              Backend is warming up — showing <strong>demo data</strong>.
              Live data will load automatically once it&apos;s ready.
            </span>
          </motion.div>
        )}

        {/* Unexpected errors only (auth failures, etc.) */}
        {error && !isFallback && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="rounded-xl border border-red-500/30 bg-red-900/15 text-red-300 text-sm px-4 py-3"
          >
            {error}
          </motion.div>
        )}

        {/* KPI grid */}
        {stats && (
          <>
            <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Open Risks" value={stats.open_risks} sub="High & critical unread alerts" accent={stats.open_risks > 0 ? "text-red-400" : "text-emerald-400"} />
              <StatCard label="Scans (24h)" value={stats.scans_last_24h} sub={`${stats.total_scans} total scans`} />
              <StatCard label="Compliance Score" value={`${stats.compliance_score}%`} sub="% clean scans (7d, no critical)" accent={stats.compliance_score >= 80 ? "text-emerald-400" : stats.compliance_score >= 50 ? "text-amber-400" : "text-red-400"} />
              <StatCard label="Active Projects" value={stats.active_projects} sub={`${stats.unread_notifications} unread notification${stats.unread_notifications !== 1 ? "s" : ""}`} />
            </motion.div>

            {/* Body: severity dist + recent scans */}
            <div className="grid md:grid-cols-[1fr_1.6fr] gap-6">
              <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="nub-card rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-white mb-4">Severity Distribution</h2>
                <SeverityBar dist={stats.severity_distribution} />
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="nub-card rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-white">Recent Scans</h2>
                  <Link href="/scanner" className="text-xs text-violet-400 hover:text-violet-300 transition-colors duration-200">New scan →</Link>
                </div>
                {stats.recent_scans.length === 0 ? (
                  <p className="text-xs text-gray-600">No scans yet. Run your first scan!</p>
                ) : (
                  <div className="space-y-1">
                    {stats.recent_scans.map((s) => (
                      <motion.div
                        key={s.scan_id}
                        whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.02)" }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center gap-3 text-xs py-2.5 px-2 rounded-lg border-b border-white/[0.04] last:border-0 cursor-default"
                      >
                        <span className={`font-semibold uppercase ${riskColor(s.risk_level)}`}>{s.risk_level}</span>
                        <span className="flex-1 text-gray-300 truncate">{s.target}</span>
                        <span className="text-gray-600">{s.scan_type}</span>
                        <span className="text-gray-600 font-mono">{s.finding_count} findings</span>
                        {s.cvss_max_score != null && (
                          <span className="text-gray-500 font-mono">CVSS {s.cvss_max_score.toFixed(1)}</span>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Recent alerts */}
            {stats.recent_alerts.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }} className="nub-card rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-white">Recent Alerts</h2>
                  <Link href="/notifications" className="text-xs text-violet-400 hover:text-violet-300 transition-colors duration-200">View all →</Link>
                </div>
                <div className="space-y-2">
                  {stats.recent_alerts.map((a) => (
                    <motion.div
                      key={a.id}
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.15 }}
                      className={`flex items-start gap-3 text-xs py-2.5 px-3 rounded-xl border ${
                        !a.is_read ? "border-white/[0.08] bg-white/[0.02]" : "border-white/[0.04] opacity-60"
                      }`}
                    >
                      <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase ${severityColor(a.severity)}`}>
                        {a.severity}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-gray-200 truncate">{a.title}</div>
                        {a.cvss_score != null && (
                          <div className="text-gray-600 font-mono mt-0.5">CVSS {a.cvss_score.toFixed(1)}</div>
                        )}
                      </div>
                      {a.link && (
                        <Link href={a.link} className="text-violet-400 hover:text-violet-300 transition-colors shrink-0">View →</Link>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
