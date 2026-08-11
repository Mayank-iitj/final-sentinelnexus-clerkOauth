"use client";
import SpecularButton from '../../components/SpecularButton';
import { FileCode2, FolderDown } from "lucide-react";
import { GithubRepo, listGithubRepos } from "../../lib/api";

const GithubIcon = ({ size = 14 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5a5.5 5.5 0 0 0-1.5-3.8 5.3 5.3 0 0 0 0-3.8s-1.3-.4-4 1.4a13.3 13.3 0 0 0-7 0C6.2 1.5 4.9 1.9 4.9 1.9a5.3 5.3 0 0 0 0 3.8A5.5 5.5 0 0 0 3.4 9.5c0 5 3 6.2 6 6.5a4.8 4.8 0 0 0-1 3.2v4" />
  </svg>
);

import { useEffect, useState, useCallback } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { AppShell } from "../../components/AppShell";
import {
  listProjects,
  createProject,
  archiveProject,
  ProjectOut,
  riskColor,
  uploadLocalFiles,
} from "../../lib/api";

function CreateModal({ onClose, onCreate }: { onClose: () => void; onCreate: () => void }) {
  const [activeTab, setActiveTab] = useState<"blank" | "github" | "local">("blank");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [localPath, setLocalPath] = useState("");
  const [localFiles, setLocalFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  // GitHub Repos State
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [githubConnected, setGithubConnected] = useState<boolean>(true);

  useEffect(() => {
    if (activeTab === "github") {
      setReposLoading(true);
      listGithubRepos()
        .then((res) => {
          setRepos(res.items);
          setGithubConnected(true);
        })
        .catch((err) => {
          console.warn("GitHub fetch error:", err.message);
          setGithubConnected(false);
        })
        .finally(() => setReposLoading(false));
    }
  }, [activeTab]);

  const handleConnectGithub = async () => {
    if (!user) return;
    try {
      await user.createExternalAccount({
        strategy: "oauth_github",
        redirectUrl: window.location.href,
      });
    } catch (e: any) {
      setError(e.errors?.[0]?.longMessage || e.message || "Failed to connect GitHub");
    }
  };

  const submit = async () => {
    if (!name.trim()) { setError("Name is required"); return; }
    if (activeTab === "github" && !githubUrl.trim()) { setError("GitHub URL is required"); return; }
    if (activeTab === "local" && (!localFiles || localFiles.length === 0)) { setError("Please select a folder"); return; }

    setLoading(true);
    setError(null);
    try {
      const proj = await createProject({ 
        name: name.trim(), 
        description: desc.trim() || undefined,
        source_type: activeTab,
        github_url: activeTab === "github" ? githubUrl.trim() : undefined,
        local_path: undefined
      });

      if (activeTab === "local" && localFiles) {
        const formData = new FormData();
        let addedCount = 0;
        for (let i = 0; i < localFiles.length; i++) {
          const file = localFiles[i];
          const path = file.webkitRelativePath || file.name;
          if (path.includes('/node_modules/') || path.includes('/.git/') || path.includes('/.next/') || path.includes('/venv/')) {
            continue;
          }
          formData.append("files", file, path);
          addedCount++;
        }
        if (addedCount === 0) throw new Error("No valid source files found in the selected folder.");
        await uploadLocalFiles(proj.project_id, formData);
      }

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
        
        <div className="flex gap-2 p-1 bg-white/[0.04] rounded-lg">
          <button 
            onClick={() => setActiveTab("blank")}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition ${activeTab === "blank" ? "bg-white/[0.1] text-white" : "text-gray-400 hover:text-white"}`}
          >
            <FileCode2 size={14} /> Blank
          </button>
          <button 
            onClick={() => setActiveTab("github")}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition ${activeTab === "github" ? "bg-white/[0.1] text-white" : "text-gray-400 hover:text-white"}`}
          >
            <GithubIcon size={14} /> GitHub
          </button>
          <button 
            onClick={() => setActiveTab("local")}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition ${activeTab === "local" ? "bg-white/[0.1] text-white" : "text-gray-400 hover:text-white"}`}
          >
            <FolderDown size={14} /> Local
          </button>
        </div>

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
              placeholder={activeTab === "github" ? "e.g. sentinel-nexus-repo" : "e.g. API Gateway Security"}
              autoFocus
            />
          </div>

          {activeTab === "github" && (
            <div className="space-y-3">
              {reposLoading ? (
                <div className="text-sm text-gray-500 py-4 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                  Loading repositories...
                </div>
              ) : githubConnected ? (
                <div>
                  <label className="text-xs text-gray-500 block mb-2">Select a Repository</label>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-white/[0.1]">
                    {repos.map((repo) => (
                      <div 
                        key={repo.id}
                        onClick={() => {
                          setGithubUrl(repo.html_url);
                          if (!name) setName(repo.name);
                        }}
                        className={`p-3 rounded-xl border transition cursor-pointer ${
                          githubUrl === repo.html_url 
                            ? "border-emerald-500/50 bg-emerald-500/10" 
                            : "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="font-semibold text-sm">{repo.full_name}</div>
                          {repo.private && <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-400">Private</span>}
                        </div>
                        {repo.description && (
                          <div className="text-xs text-gray-500 mt-1 line-clamp-1">{repo.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <label className="text-xs text-gray-500 block mb-1">Or paste a URL directly</label>
                    <input
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                      placeholder="https://github.com/username/repo"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-xs text-amber-400/80 mb-3 bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg flex flex-col gap-2 items-start">
                    <span>GitHub is not connected. Connect your account to select repositories directly.</span>
                    <button onClick={handleConnectGithub} className="bg-amber-500 text-amber-950 px-3 py-1.5 rounded-md font-semibold text-xs hover:bg-amber-400 transition">
                      Connect GitHub
                    </button>
                  </div>
                  <label className="text-xs text-gray-500 block mb-1">Or paste a GitHub Repository URL manually</label>
                  <input
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                    placeholder="https://github.com/username/repo"
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === "local" && (
            <div>
              <label className="text-xs text-gray-500 block mb-1">Select Source Folder</label>
              <div className="relative w-full bg-white/[0.03] border-2 border-dashed border-white/[0.1] hover:border-emerald-500/50 hover:bg-white/[0.05] transition-colors rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer group">
                <FolderDown className="w-8 h-8 text-gray-400 group-hover:text-emerald-400 mb-2" />
                <span className="text-sm font-medium text-white">{localFiles ? `${localFiles.length} files selected` : "Click to select a folder"}</span>
                <span className="text-xs text-gray-500 mt-1">.git, node_modules, and venv are ignored</span>
                <input
                  type="file"
                  // @ts-ignore
                  webkitdirectory="true"
                  directory="true"
                  multiple
                  onChange={(e) => setLocalFiles(e.target.files)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
          )}

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
          <SpecularButton onClick={onClose} className="px-4 py-2 rounded-xl bg-white/[0.06] text-sm text-gray-400 hover:bg-slate-700">
            Cancel
          </SpecularButton>
          <SpecularButton
            onClick={submit}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-sm hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? "Creating…" : activeTab === "blank" ? "Create" : "Import"}
          </SpecularButton>
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
          <SpecularButton
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-sm hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
          >
            + New Project
          </SpecularButton>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-900/20 text-red-300 text-sm px-4 py-3">
            {error}
          </div>
        )}

        {/* Featured Projects Section */}
        <div className="space-y-3 mb-8">
          <div>
            <h2 className="text-lg font-bold">Featured Projects</h2>
            <p className="text-xs text-gray-500">Showcase projects & frameworks</p>
          </div>
          <div
            onClick={() => window.location.href = "/cyberpentest"}
            className="rounded-2xl nub-card p-6 flex flex-col gap-4 hover:border-violet-400/30 transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-2xl mb-2">🔐</div>
                <div className="text-sm font-bold text-white">Autonomous Cyber-Pentest Framework</div>
                <div className="text-xs text-gray-400 mt-2">Production-grade Python security testing with autonomous scanning, tech fingerprinting, exploit detection, and auto-generated pentest reports.</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-lg bg-violet-500/10 px-3 py-2 border border-violet-500/20">
                <div className="text-violet-300 font-semibold">12+ Features</div>
              </div>
              <div className="rounded-lg bg-violet-500/10 px-3 py-2 border border-violet-500/20">
                <div className="text-violet-300 font-semibold">CVSS Scoring</div>
              </div>
              <div className="rounded-lg bg-violet-500/10 px-3 py-2 border border-violet-500/20">
                <div className="text-violet-300 font-semibold">REST API</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Created by MAYANK SHARMA</span>
              </div>
              <span className="text-violet-400 group-hover:translate-x-1 transition-transform">Explore →</span>
            </div>
          </div>
        </div>

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
                <SpecularButton
                  onClick={(e) => { e.stopPropagation(); handleArchive(p.project_id); }}
                  className="text-gray-700 hover:text-red-400"
                >
                  Archive
                </SpecularButton>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
