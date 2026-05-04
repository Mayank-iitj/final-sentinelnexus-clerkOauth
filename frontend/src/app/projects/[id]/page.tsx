"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "../../../components/AppShell";
import {
  getProject,
  ProjectDetail,
  riskColor,
  severityColor,
  generateReport,
} from "../../../lib/api";

export default function ProjectDetailPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) window.location.href = "/login";
  }, [isLoaded, isSignedIn]);

  const projectId = params?.id;

  useEffect(() => {
    if (!isSignedIn || !projectId) return;
    getProject(projectId)
      .then(setProject)
      .catch((e: any) => setError(e.message ?? "Not found"))
      .finally(() => setLoading(false));
  }, [isSignedIn, projectId]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse">Loading project…</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <AppShell>
        <div className="text-red-400 text-sm">{error ?? "Project not found"}</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-7 pb-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <button
              onClick={() => router.push("/projects")}
              className="text-xs text-slate-400 hover:text-slate-200 mb-2 block"
            >
              ← All Projects
            </button>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-slate-400 mt-1">{project.description}</p>
            )}
          </div>
          <span className={`text-sm font-bold uppercase px-3 py-1 rounded-xl border ${
            project.risk_level === "critical" ? "border-violet-400/40 text-violet-400 bg-violet-500/10" :
            project.risk_level === "high" ? "border-red-400/40 text-red-400 bg-red-500/10" :
            project.risk_level === "medium" ? "border-amber-400/40 text-amber-400 bg-amber-500/10" :
            "border-emerald-400/40 text-emerald-400 bg-emerald-500/10"
          }`}>
            {project.risk_level}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Scans",    value: project.scan_count, color: "" },
            { label: "Open Findings",  value: project.open_finding_count, color: project.open_finding_count > 0 ? "text-red-400" : "text-emerald-400" },
            { label: "Risk Level",     value: project.risk_level.toUpperCase(), color: riskColor(project.risk_level) },
            { label: "Created",        value: new Date(project.created_at).toLocaleDateString(), color: "" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
              <div className="text-xs text-slate-400">{s.label}</div>
              <div className={`text-xl font-bold mt-1 ${s.color || "text-slate-100"}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Recent Scans */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">Recent Scans</h2>
            <a
              href={`/scanner?project_id=${project.project_id}`}
              className="text-xs text-emerald-400 hover:underline"
            >
              + New Scan
            </a>
          </div>
          {project.recent_scans.length === 0 ? (
            <div className="px-5 py-6 text-xs text-slate-500">
              No scans linked to this project yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {project.recent_scans.map((s: any) => (
                <div key={s.scan_id} className="px-5 py-3 flex items-center gap-4 text-xs hover:bg-slate-900/60">
                  <span className={`font-bold uppercase ${riskColor(s.risk_level)}`}>
                    {s.risk_level}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-200 truncate">{s.target}</div>
                    <div className="text-slate-500 mt-0.5 flex gap-3">
                      <span className="uppercase">{s.scan_type}</span>
                      <span>{s.finding_count} findings</span>
                      {s.cvss_max_score != null && <span>CVSS {s.cvss_max_score.toFixed(1)}</span>}
                    </div>
                  </div>
                  <span className="text-slate-500">{new Date(s.created_at).toLocaleDateString()}</span>
                  <button
                    onClick={() => generateReport(s.scan_id).catch(() => {})}
                    className="text-xs text-emerald-400 hover:underline"
                  >
                    Report
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
