"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { AppShell } from "../../components/AppShell";
import {
  listReports,
  generateReport,
  listScans,
  downloadReportUrl,
  ReportOut,
  ScanListItem,
  Paginated,
} from "../../lib/api";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ready:      "text-emerald-400 bg-emerald-500/10 border-emerald-400/30",
    generating: "text-amber-400 bg-amber-500/10 border-amber-400/30",
    error:      "text-red-400 bg-red-500/10 border-red-400/30",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${map[status] ?? ""}`}>
      {status}
    </span>
  );
}

export default function ReportsPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [reports, setReports] = useState<ReportOut[]>([]);
  const [scans, setScans] = useState<ScanListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) window.location.href = "/login";
  }, [isLoaded, isSignedIn]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rpt, scn] = await Promise.all([
        listReports({ limit: 50 }),
        listScans({ limit: 20 }),
      ]);
      setReports(rpt.items);
      setScans(scn.items.filter((s) => s.status === "completed"));
    } catch (e: any) {
      if (e.message === "Failed to fetch") {
        setError("Unable to connect to the backend API. Please try again later.");
      } else {
        setError(e.message ?? "Failed to load");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSignedIn) load();
  }, [isSignedIn, load]);

  const handleGenerate = async (scanId: string) => {
    setGenerating(scanId);
    setError(null);
    try {
      await generateReport(scanId);
      await load();
    } catch (e: any) {
      setError(e.message ?? "Failed to generate report");
    } finally {
      setGenerating(null);
    }
  };

  if (!isLoaded) return null;

  // Map scan_id -> report for quick lookup
  const reportMap = new Map(reports.map((r) => [r.scan_id, r]));

  return (
    <AppShell>
      <div className="space-y-8 pb-8">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Professional HackerOne-style PDF security reports generated from real scan data.
            Includes CVSS v3.1 scores, evidence, CWEs, and compliance mappings.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-900/20 text-red-300 text-sm px-4 py-3">
            {error}
          </div>
        )}

        {/* Reports list */}
        {reports.length > 0 && (
          <div className="rounded-2xl nub-card overflow-hidden">
            <div className="px-5 py-3 border-b border-white/[0.06]">
              <h2 className="text-sm font-semibold text-gray-200">Generated Reports</h2>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {reports.map((r) => (
                <div key={r.report_id} className="px-5 py-3 flex items-center gap-4 text-xs hover:bg-white/[0.03]/60">
                  <StatusBadge status={r.status} />
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-200 truncate font-mono">
                      Scan {r.scan_id.slice(0, 8)}…
                    </div>
                    <div className="text-white0 mt-0.5 flex gap-3">
                      <span>{r.finding_count} findings</span>
                      {r.max_cvss != null && <span>Max CVSS {r.max_cvss.toFixed(1)}</span>}
                      {r.file_size_bytes != null && (
                        <span>{(r.file_size_bytes / 1024).toFixed(1)} KB</span>
                      )}
                    </div>
                  </div>
                  <span className="text-white0">{new Date(r.created_at).toLocaleDateString()}</span>
                  {r.status === "ready" && (
                    <a
                      href={downloadReportUrl(r.report_id)}
                      download
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/25"
                    >
                      ⬇ Download PDF
                    </a>
                  )}
                  {r.status === "generating" && (
                    <span className="text-amber-400 animate-pulse text-[11px]">Generating…</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generate report for a scan */}
        {scans.length > 0 && (
          <div className="rounded-2xl nub-card overflow-hidden">
            <div className="px-5 py-3 border-b border-white/[0.06]">
              <h2 className="text-sm font-semibold text-gray-200">
                Generate Report from Scan
              </h2>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {scans.map((s) => {
                const existingReport = reportMap.get(s.scan_id);
                return (
                  <div key={s.scan_id} className="px-5 py-3 flex items-center gap-4 text-xs hover:bg-white/[0.03]/60">
                    <div className="flex-1 min-w-0">
                      <div className="text-gray-200 truncate">{s.target}</div>
                      <div className="text-white0 mt-0.5 flex gap-3">
                        <span className="uppercase">{s.scan_type}</span>
                        <span className={s.risk_level === "critical" ? "text-violet-400" : s.risk_level === "high" ? "text-red-400" : "text-gray-500"}>
                          {s.risk_level.toUpperCase()}
                        </span>
                        <span>{s.finding_count} findings</span>
                        {s.cvss_max_score != null && <span>CVSS {s.cvss_max_score.toFixed(1)}</span>}
                      </div>
                    </div>
                    <span className="text-white0">{new Date(s.created_at).toLocaleDateString()}</span>
                    {existingReport?.status === "ready" ? (
                      <a
                        href={downloadReportUrl(existingReport.report_id)}
                        download
                        className="px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-gray-400 hover:bg-slate-700"
                      >
                        ⬇ Download
                      </a>
                    ) : (
                      <button
                        onClick={() => handleGenerate(s.scan_id)}
                        disabled={generating === s.scan_id || existingReport?.status === "generating"}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 disabled:opacity-50"
                      >
                        {generating === s.scan_id ? "Generating…" : "Generate PDF"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!loading && reports.length === 0 && scans.length === 0 && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03]/60 p-8 text-center text-gray-500 text-sm">
            No completed scans yet. Run a scan first, then generate a report here.
          </div>
        )}
      </div>
    </AppShell>
  );
}
