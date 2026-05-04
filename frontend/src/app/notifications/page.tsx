"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { AppShell } from "../../components/AppShell";
import {
  listNotifications,
  markNotificationRead,
  markAllRead,
  deleteNotification,
  NotificationOut,
  Paginated,
  severityColor,
} from "../../lib/api";

const PAGE_SIZE = 20;

function NotifRow({
  n,
  onRead,
  onDelete,
}: {
  n: NotificationOut;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className={`flex items-start gap-4 px-4 py-3 rounded-xl border transition-all ${
        n.is_read
          ? "border-white/[0.06] bg-white/[0.03]/40 opacity-60"
          : "border-white/[0.08] bg-white/[0.03]/80"
      }`}
    >
      <div className="mt-0.5 shrink-0">
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${severityColor(n.severity)}`}
        >
          {n.severity}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white font-medium truncate">{n.title}</div>
        {n.description && (
          <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.description}</div>
        )}
        <div className="flex items-center gap-3 mt-1 text-[11px] text-white0">
          {n.cvss_score != null && (
            <span className="font-mono">CVSS {n.cvss_score.toFixed(1)}</span>
          )}
          <span>{n.alert_type.replace("_", " ")}</span>
          <span>{new Date(n.created_at).toLocaleString()}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {!n.is_read && (
          <button
            onClick={() => onRead(n.id)}
            className="text-[11px] text-violet-400 hover:text-violet-300 transition-colors"
          >
            Mark read
          </button>
        )}
        <button
          onClick={() => onDelete(n.id)}
          className="text-[11px] text-white0 hover:text-red-400"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [data, setData] = useState<Paginated<NotificationOut> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (isLoaded && !isSignedIn) window.location.href = "/login";
  }, [isLoaded, isSignedIn]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listNotifications({ unread_only: unreadOnly, limit: PAGE_SIZE, offset });
      setData(result);
    } catch (e: any) {
      setError(e.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [unreadOnly, offset]);

  useEffect(() => {
    if (isSignedIn) load();
  }, [isSignedIn, load]);

  const handleRead = async (id: string) => {
    await markNotificationRead(id);
    load();
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    load();
  };

  const handleMarkAll = async () => {
    await markAllRead();
    load();
  };

  if (!isLoaded) return null;

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <AppShell>
      <div className="space-y-6 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Auto-generated alerts from high &amp; critical scan findings.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => { setUnreadOnly(e.target.checked); setOffset(0); }}
                className="accent-emerald-500 rounded"
              />
              Unread only
            </label>
            <button
              onClick={handleMarkAll}
              className="px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-xs text-gray-400 hover:bg-slate-700"
            >
              Mark all read
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-900/20 text-red-300 text-sm px-4 py-3">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-sm text-white0 animate-pulse">Loading…</div>
        )}

        {!loading && items.length === 0 && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03]/60 p-8 text-center text-gray-500 text-sm">
            {unreadOnly ? "No unread notifications." : "No notifications yet. Run a scan to generate alerts."}
          </div>
        )}

        <div className="space-y-2">
          {items.map((n) => (
            <NotifRow key={n.id} n={n} onRead={handleRead} onDelete={handleDelete} />
          ))}
        </div>

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <button
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              className="px-3 py-1.5 rounded-lg bg-white/[0.06] disabled:opacity-40"
            >
              ← Previous
            </button>
            <span>
              {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
            </span>
            <button
              disabled={offset + PAGE_SIZE >= total}
              onClick={() => setOffset(offset + PAGE_SIZE)}
              className="px-3 py-1.5 rounded-lg bg-white/[0.06] disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
