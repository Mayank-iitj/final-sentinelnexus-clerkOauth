import { AppShell } from "../../components/AppShell";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Changelog", description: "SentinelNexus platform release history and updates." };

const releases = [
  { version: "2.2.0", date: "2026-07-30", title: "Enterprise Identity via Clerk", type: "major", changes: [
    { tag: "added", text: "Integrated Clerk for robust identity management and authentication" },
    { tag: "security", text: "Implemented secure Clerk webhook listener for automated user synchronization" },
    { tag: "improved", text: "Enhanced JWT verification and RS256 signature validation" },
    { tag: "fixed", text: "Resolved deployment issues with CORS and allowed origins" },
  ]},
  { version: "2.1.0", date: "2026-05-01", title: "Google-Only OAuth & Backend Hardening", type: "major", changes: [
    { tag: "breaking", text: "Removed GitHub and Microsoft OAuth providers — Google only" },
    { tag: "added", text: "Resilient rate limiter with Redis fallback (no-crash on Redis down)" },
    { tag: "improved", text: "Simplified OAuth service — removed multi-provider linking" },
    { tag: "fixed", text: "Duplicate httpx in requirements.txt" },
    { tag: "security", text: "Removed wildcard from ALLOWED_HOSTS" },
  ]},
  { version: "2.0.0", date: "2026-03-15", title: "Production Launch", type: "major", changes: [
    { tag: "added", text: "Full CVSS v3.1 scoring engine with 45+ finding type vectors" },
    { tag: "added", text: "PDF report generation with ReportLab" },
    { tag: "added", text: "Project-based scan organization" },
    { tag: "added", text: "Real-time notification system for high/critical findings" },
    { tag: "added", text: "Finding deduplication with SHA-256 fingerprinting" },
  ]},
  { version: "1.5.0", date: "2026-02-01", title: "Scanner Engine Expansion", type: "minor", changes: [
    { tag: "added", text: "Prompt injection scanner with jailbreak detection" },
    { tag: "added", text: "Text scanner for PII (credit cards, SSNs, IBANs)" },
    { tag: "improved", text: "Code scanner expanded to 120+ SAST rules" },
    { tag: "improved", text: "CWE mapping for all finding types" },
  ]},
  { version: "1.0.0", date: "2026-01-15", title: "Initial Release", type: "major", changes: [
    { tag: "added", text: "Code security scanner with secrets and injection detection" },
    { tag: "added", text: "Dashboard with live DB aggregation queries" },
    { tag: "added", text: "OAuth authentication with JWT cookies" },
    { tag: "added", text: "Redis-backed refresh token rotation" },
  ]},
];

const tagColors: Record<string, string> = {
  added: "text-emerald-400 bg-emerald-500/10 border-emerald-400/30",
  improved: "text-blue-400 bg-blue-500/10 border-blue-400/30",
  fixed: "text-amber-400 bg-amber-500/10 border-amber-400/30",
  breaking: "text-red-400 bg-red-500/10 border-red-400/30",
  security: "text-violet-400 bg-violet-500/10 border-violet-400/30",
};

export default function ChangelogPage() {
  return (
    <AppShell>
      <div className="max-w-3xl pb-20">
        <h1 className="font-display text-4xl font-extrabold mb-2 text-white">Changelog</h1>
        <p className="text-gray-400 mb-10">Track every update, improvement, and fix across SentinelNexus releases.</p>

        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-violet-500/60 via-blue-500/30 to-transparent" />
          <div className="space-y-10">
            {releases.map((r) => (
              <div key={r.version} className="relative pl-10">
                <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-violet-500 border-2 border-slate-950" />
                <div className="glass-card rounded-2xl p-5 border border-white/[0.06] bg-black/40">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <span className="text-sm font-bold text-white">v{r.version}</span>
                    <span className="text-xs text-gray-500">{r.date}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase font-semibold ${r.type === "major" ? "text-violet-400 border-violet-400/30 bg-violet-500/10" : "text-blue-400 border-blue-400/30 bg-blue-500/10"}`}>{r.type}</span>
                  </div>
                  <h3 className="text-base font-semibold text-white mb-3">{r.title}</h3>
                  <ul className="space-y-2">
                    {r.changes.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase shrink-0 mt-0.5 ${tagColors[c.tag] ?? ""}`}>{c.tag}</span>
                        <span className="text-gray-300">{c.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
