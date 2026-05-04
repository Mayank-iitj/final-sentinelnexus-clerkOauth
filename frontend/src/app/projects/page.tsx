"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { AppShell } from "../../components/AppShell";
import {
  listProjects,
  createProject,
  archiveProject,
  ProjectOut,
  riskColor,
} from "../../lib/api";

function CreateModal({ onClose, onCreate }: { onClose: () => void; onCreate: () => void }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) { setError("Name is required"); return; }
    setLoading(true);
    setError(null);
    try {
      await createProject({ name: name.trim(), description: desc.trim() || undefined });
      onCreate();
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Failed to create");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
        <h2 className="text-lg font-bold">New Project</h2>
        {error && (
          <div className="text-xs text-red-400 border border-red-500/30 bg-red-900/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Project name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
              placeholder="e.g. API Gateway Security"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Description (optional)</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-emerald-500 resize-none h-20"
              placeholder="Short description of this project…"
            />
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/[0.06] text-sm text-gray-400 hover:bg-slate-700">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-sm hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) window.location.href = "/login";
  }, [isLoaded, isSignedIn]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listProjects();
      setProjects(result.items);
    } catch (e: any) {
      setError(e.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSignedIn) load();
  }, [isSignedIn, load]);

  const handleArchive = async (id: string) => {
    if (!confirm("Archive this project?")) return;
    await archiveProject(id);
    load();
  };

  if (!isLoaded) return null;

  return (
    <AppShell>
      {showCreate && (
        <CreateModal onClose={() => setShowCreate(false)} onCreate={load} />
      )}
      <div className="space-y-6 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Organise scans by project for team-level risk tracking.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-sm hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
          >
            + New Project
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-900/20 text-red-300 text-sm px-4 py-3">
            {error}
          </div>
        )}

        {loading && <div className="text-sm text-white0 animate-pulse">Loading…</div>}

        {!loading && projects.length === 0 && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03]/60 p-8 text-center text-gray-500 text-sm">
            No projects yet. Create one to start grouping your scans.
          </div>
        )}

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div
              key={p.project_id}
              className="rounded-2xl nub-card p-5 flex flex-col gap-3 hover:border-white/[0.08] transition-colors cursor-pointer"
              onClick={() => router.push(`/projects/${p.project_id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{p.name}</div>
                  {p.description && (
                    <div className="text-xs text-white0 mt-0.5 line-clamp-2">{p.description}</div>
                  )}
                </div>
                <span className={`text-xs font-bold uppercase ml-2 shrink-0 ${riskColor(p.risk_level)}`}>
                  {p.risk_level}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-white/[0.04] px-3 py-2">
                  <div className="text-gray-500">Scans</div>
                  <div className="text-white font-semibold">{p.scan_count}</div>
                </div>
                <div className="rounded-lg bg-white/[0.04] px-3 py-2">
                  <div className="text-gray-500">Open Findings</div>
                  <div className={`font-semibold ${p.open_finding_count > 0 ? "text-red-400" : "text-emerald-400"}`}>
                    {p.open_finding_count}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-white0">
                <span>Created {new Date(p.created_at).toLocaleDateString()}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleArchive(p.project_id); }}
                  className="text-gray-700 hover:text-red-400"
                >
                  Archive
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
