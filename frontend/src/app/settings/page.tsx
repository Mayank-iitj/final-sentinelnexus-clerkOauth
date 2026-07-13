"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { AppShell } from "../../components/AppShell";
import { getDashboardStats } from "../../lib/api";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  oauth_provider: string | null;
  is_active: boolean;
  created_at: string;
}

export default function SettingsPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanCount, setScanCount] = useState<number>(0);
  const [projectCount, setProjectCount] = useState<number>(0);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      window.location.href = "/login";
    }
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) return;

    const fetchProfile = async () => {
      try {
        const stats = await getDashboardStats();
        setScanCount(stats.total_scans ?? 0);
        setProjectCount(stats.active_projects ?? 0);
      } catch {
        // silently fail
      }
      setLoading(false);
    };
    fetchProfile();
  }, [isSignedIn]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gray-500 text-sm animate-pulse">Loading settings…</div>
      </div>
    );
  }

  if (!user) return null;

  const userName = user.fullName ?? "—";
  const userEmail = user.primaryEmailAddress?.emailAddress ?? "—";
  const authProvider = "Clerk";
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  return (
    <AppShell>
      <div className="space-y-6 max-w-3xl pb-8">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Account details and platform usage overview.
          </p>
        </div>

        <div className="space-y-4">
          {/* Account */}
          <section className="rounded-2xl bg-black/90 border border-white/[0.06] p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold">Account</h2>
              <p className="text-xs text-gray-500">
                Your identity is managed through Clerk. Profile data syncs automatically.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <div className="text-gray-500 text-xs mb-1">Full Name</div>
                <div className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-3 py-2 text-white text-xs">
                  {userName}
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-1">Email</div>
                <div className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-3 py-2 text-white text-xs">
                  {userEmail}
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-1">Auth Provider</div>
                <div className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-3 py-2 text-white text-xs capitalize">
                  {authProvider}
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-1">Member Since</div>
                <div className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-3 py-2 text-white text-xs">
                  {memberSince}
                </div>
              </div>
            </div>
          </section>

          {/* Usage Stats */}
          <section className="rounded-2xl bg-black/90 border border-white/[0.06] p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold">Usage</h2>
              <p className="text-xs text-gray-500">
                Live usage data from your account.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-xl nub-card p-3 text-center">
                <div className="text-xl font-bold text-white">{scanCount}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">Total Scans</div>
              </div>
              <div className="rounded-xl nub-card p-3 text-center">
                <div className="text-xl font-bold text-white">{projectCount}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">Active Projects</div>
              </div>
              <div className="rounded-xl nub-card p-3 text-center">
                <div className="text-xl font-bold text-emerald-400">Active</div>
                <div className="text-[11px] text-gray-500 mt-0.5">Account Status</div>
              </div>
            </div>
          </section>

          {/* Security */}
          <section className="rounded-2xl bg-black/90 border border-white/[0.06] p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold">Security</h2>
              <p className="text-xs text-gray-500">
                Authentication and session security settings.
              </p>
            </div>
            <div className="space-y-2 text-xs text-gray-400">
              <div className="flex justify-between items-center py-2 border-b border-white/[0.06]">
                <span>Authentication Method</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-[10px] font-semibold">Clerk Auth</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/[0.06]">
                <span>Session Tokens</span>
                <span className="text-gray-500">Managed by Clerk (JWT)</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/[0.06]">
                <span>Password Storage</span>
                <span className="text-gray-500">N/A — OAuth only, no passwords stored</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span>Rate Limiting</span>
                <span className="text-gray-500">Enabled (Redis-backed, per-user)</span>
              </div>
            </div>
          </section>

          {/* Data & API */}
          <section className="rounded-2xl bg-black/90 border border-white/[0.06] p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold">API & Integrations</h2>
              <p className="text-xs text-gray-500">
                API access details for programmatic usage.
              </p>
            </div>
            <div className="space-y-2 text-xs text-gray-400">
              <div className="flex justify-between items-center py-2 border-b border-white/[0.06]">
                <span>API Base URL</span>
                <code className="text-violet-300 text-[11px]">/api/v1</code>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/[0.06]">
                <span>Auth Method</span>
                <span className="text-gray-500">Cookie-based (access_token)</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span>Documentation</span>
                <a href="/docs" className="text-violet-400 hover:underline">View API Docs →</a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
