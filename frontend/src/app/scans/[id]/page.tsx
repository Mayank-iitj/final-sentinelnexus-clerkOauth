"use client";
import SpecularButton from '../../../components/SpecularButton';

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "../../../components/AppShell";
import {
  getScan,
  generateReport,
  ScanResult,
  Finding,
  severityColor,
  riskColor,
} from "../../../lib/api";

function FindingDetail({ f, idx }: { f: Finding; idx: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`rounded-xl border text-xs transition-colors ${
        f.severity === "critical"
          ? "border-violet-400/30 bg-violet-900/10"
          : f.severity === "high"
          ? "border-red-400/30 bg-red-900/10"
          : f.severity === "medium"
          ? "border-amber-400/20 bg-amber-900/5"
          : "border-slate-700 bg-slate-900/60"
      }`}
    >
      <div
        className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-white/[.02] transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="text-slate-500 font-mono w-8">
          F{String(idx).padStart(2, "0")}
        </span>
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase ${severityColor(
            f.severity
          )}`}
        >
          {f.severity}
        </span>
        <span className="flex-1 text-slate-200 font-medium truncate">
          {f.finding_type.replace(/_/g, " ")}
        </span>
        <div className="flex items-center gap-2 text-slate-500 shrink-0">
          {f.cwe && <span className="font-mono">{f.cwe}</span>}
          <span className="font-mono text-amber-300">
            CVSS {f.cvss_score.toFixed(1)}
          </span>
          {f.line_number && <span>L{f.line_number}</span>}
          <span className="text-slate-600">{open ? "▲" : "▼"}</span>
        </div>
      </div>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-800">
          <p className="text-slate-300 pt-3 leading-relaxed">{f.message}</p>
          {f.evidence && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                Evidence
              </div>
              <pre className="bg-black/40 rounded-lg p-3 text-[11px] text-slate-200 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                {f.evidence}
              </pre>
            </div>
          )}
          <div className="rounded-lg bg-slate-800/60 px-3 py-2 text-slate-400 font-mono text-[11px]">
            <span className="text-slate-500">CVSS Vector: </span>
            {f.cvss_vector}
          </div>
          <div className="rounded-lg bg-emerald-900/20 border border-emerald-400/20 px-3 py-2 text-emerald-300">
            <span className="font-semibold">Remediation: </span>
            {f.remediation}
          </div>
          <div className="text-[10px] text-slate-600 font-mono">
            Fingerprint: {f.fingerprint}
          </div>
        </div>
      )}
    </div>
  );
}

type ScanDetail = ScanResult & {
  target: string;
  status: string;
  created_at: string;
  findings: Finding[];
};

export default function ScanDetailPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [scan, setScan] = useState<ScanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportStatus, setReportStatus] = useState<
    "idle" | "generating" | "done"
  >("idle");

  const scanId = params?.id;

  useEffect(() => {
    if (isLoaded && !isSignedIn) window.location.href = "/login";
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn || !scanId) return;
    getScan(scanId)
      .then((data) => setScan(data as ScanDetail))
      .catch((e: any) => setError(e.message ?? "Scan not found"))
      .finally(() => setLoading(false));
  }, [isSignedIn, scanId]);

  const handleGenerateReport = async () => {
    if (!scan) return;
    setReportStatus("generating");
    try {
      await generateReport(scan.scan_id);
      setReportStatus("done");
    } catch {
      setReportStatus("idle");
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse">
          Loading scan…
        </div>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <AppShell>
        <div className="space-y-4">
          <SpecularButton
            onClick={() => router.back()}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            ← Back
          </SpecularButton>
          <div className="rounded-xl border border-red-500/40 bg-red-900/20 text-red-300 text-sm px-4 py-3">
            {error ?? "Scan not found"}
          </div>
        </div>
      </AppShell>
    );
  }

  const sortedFindings = [...scan.findings].sort(
    (a, b) => b.cvss_score - a.cvss_score
  );

  const severityCounts = scan.findings.reduce(
    (acc, f) => {
      acc[f.severity] = (acc[f.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <AppShell>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div>
          <SpecularButton
            onClick={() => router.back()}
            className="text-xs text-slate-400 hover:text-slate-200 mb-3 block"
          >
            ← Back to Scans
          </SpecularButton>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold truncate">{scan.target}</h1>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 flex-wrap">
                <span className="uppercase bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                  {scan.scan_type}
                </span>
                <span>
                  {new Date(scan.created_at).toLocaleString()}
                </span>
                <span className="font-mono text-slate-500">
                  ID: {scan.scan_id.slice(0, 12)}…
                </span>
                <span>{scan.duration_ms}ms</span>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span
                className={`text-sm font-bold uppercase px-3 py-1.5 rounded-xl border ${
                  scan.risk_level === "critical"
                    ? "border-violet-400/40 text-violet-400 bg-violet-500/10"
                    : scan.risk_level === "high"
                    ? "border-red-400/40 text-red-400 bg-red-500/10"
                    : scan.risk_level === "medium"
                    ? "border-amber-400/40 text-amber-400 bg-amber-500/10"
                    : "border-emerald-400/40 text-emerald-400 bg-emerald-500/10"
                }`}
              >
                {scan.risk_level}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">
              Risk Score
            </div>
            <div className="text-2xl font-bold mt-1">{scan.score}/100</div>
          </div>
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">
              Findings
            </div>
            <div className="text-2xl font-bold mt-1">
              {scan.finding_count}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">
              Max CVSS
            </div>
            <div className="text-2xl font-bold mt-1 text-amber-300 font-mono">
              {scan.cvss_max?.toFixed(1) ?? "—"}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">
              Critical / High
            </div>
            <div className="text-2xl font-bold mt-1 text-red-400">
              {(severityCounts["critical"] ?? 0) +
                (severityCounts["high"] ?? 0)}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">
              Status
            </div>
            <div className="text-lg font-bold mt-1 text-emerald-400 capitalize">
              {scan.status}
            </div>
          </div>
        </div>

        {/* Risk bar */}
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500 transition-all duration-700"
            style={{ width: `${scan.score}%` }}
          />
        </div>

        {/* Severity breakdown */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-200">
              Severity Breakdown
            </h2>
            <SpecularButton
              onClick={handleGenerateReport}
              disabled={reportStatus !== "idle"}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                reportStatus === "done"
                  ? "border-emerald-400/40 text-emerald-300 bg-emerald-500/10"
                  : "border-slate-700 text-slate-300 hover:bg-slate-800"
              }`}
            >
              {reportStatus === "idle" && "Generate PDF Report"}
              {reportStatus === "generating" && "Generating…"}
              {reportStatus === "done" && "✓ Report queued"}
            </SpecularButton>
          </div>
          <div className="grid grid-cols-4 gap-3 text-center text-xs">
            {(["critical", "high", "medium", "low"] as const).map((sev) => (
              <div
                key={sev}
                className={`rounded-xl border px-3 py-2.5 ${severityColor(sev)}`}
              >
                <div className="text-lg font-bold">
                  {severityCounts[sev] ?? 0}
                </div>
                <div className="capitalize mt-0.5 opacity-80">{sev}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Findings List */}
        <div>
          <h2 className="text-sm font-semibold text-slate-200 mb-3">
            {sortedFindings.length} Finding
            {sortedFindings.length !== 1 ? "s" : ""}{" "}
            <span className="text-slate-500 font-normal">
              (sorted by CVSS score)
            </span>
          </h2>
          {sortedFindings.length === 0 ? (
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-900/10 px-4 py-4 text-xs text-emerald-300">
              ✓ No issues found. This scan is clean.
            </div>
          ) : (
            <div className="space-y-2">
              {sortedFindings.map((f, i) => (
                <FindingDetail
                  key={f.fingerprint || i}
                  f={f}
                  idx={i + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
