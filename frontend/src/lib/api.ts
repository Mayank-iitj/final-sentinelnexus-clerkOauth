/**
 * SentinelNexus API Client
 * Typed fetch-based client using Clerk JWT for auth.
 * All methods are real, no mocks.
 */

import { buildApiUrl, getApiBaseUrl } from "./api-base";

const API_BASE = getApiBaseUrl();

type Fetcher = typeof fetch;

// ── Clerk Token Management ──────────────────────────────────────────────────
// Components call setClerkToken() with the result of useAuth().getToken()
// to make the token available to all API calls.
let _clerkToken: string | null = null;

export function setClerkToken(token: string | null) {
  _clerkToken = token;
}

export function getClerkToken(): string | null {
  return _clerkToken;
}

async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> ?? {}),
  };

  // Attach Clerk JWT if available
  if (_clerkToken) {
    headers["Authorization"] = `Bearer ${_clerkToken}`;
  }

  const res = await fetch(buildApiUrl(path), {
    credentials: "include",
    headers,
    ...options,
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `HTTP ${res.status}`);
  }

  // 204 no-content
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

// ── Types ────────────────────────────────────────────────────────────────────
export type ScanType = "code" | "prompt" | "text";
export type Severity = "critical" | "high" | "medium" | "low";
export type RiskLevel = "critical" | "high" | "medium" | "low";

export interface Finding {
  finding_type: string;
  severity: Severity;
  cvss_score: number;
  cvss_vector: string;
  cwe: string | null;
  message: string;
  evidence: string;
  line_number: number | null;
  remediation: string;
  fingerprint: string;
}

export interface ScanResult {
  scan_id: string;
  scan_type: ScanType;
  risk_level: RiskLevel;
  score: number;
  cvss_max: number | null;
  finding_count: number;
  duration_ms: number;
  findings: Finding[];
}

export interface ScanListItem {
  scan_id: string;
  target: string;
  scan_type: ScanType;
  status: string;
  risk_level: RiskLevel;
  score: number;
  cvss_max_score: number | null;
  finding_count: number;
  created_at: string;
}

export interface ProjectOut {
  project_id: string;
  name: string;
  description: string | null;
  risk_level: RiskLevel;
  scan_count: number;
  open_finding_count: number;
  is_archived: boolean;
  created_at: string;
}

export interface ProjectDetail extends ProjectOut {
  recent_scans: ScanListItem[];
}

export interface NotificationOut {
  id: string;
  alert_type: string;
  severity: Severity;
  cvss_score: number | null;
  title: string;
  description: string | null;
  link: string | null;
  is_read: boolean;
  scan_id: string | null;
  created_at: string;
}

export interface ReportOut {
  report_id: string;
  scan_id: string;
  status: "generating" | "ready" | "error";
  format: string;
  finding_count: number;
  max_cvss: number | null;
  file_size_bytes: number | null;
  created_at: string;
  download_url: string;
}

export interface DashboardStats {
  scans_last_24h: number;
  total_scans: number;
  open_risks: number;
  unread_notifications: number;
  compliance_score: number;
  severity_distribution: Record<Severity, number>;
  active_projects: number;
  recent_scans: ScanListItem[];
  recent_alerts: NotificationOut[];
}

export interface Paginated<T> {
  total: number;
  items: T[];
}

// ── Auth ───────────────────────────────────────────────────────────────────────
export const startDemoSession = () =>
  api<{ access_token: string }>("/auth/demo", { method: "POST" });

// ── Dashboard ────────────────────────────────────────────────────────────────
export const getDashboardStats = () =>
  api<DashboardStats>("/dashboard/stats");

// ── Scans ────────────────────────────────────────────────────────────────────
export const runScan = (payload: {
  target: string;
  content: string;
  scan_type?: ScanType;
  project_id?: string;
}) => api<ScanResult>("/scans", { method: "POST", body: JSON.stringify(payload) });

export const listScans = (params?: {
  scan_type?: ScanType;
  project_id?: string;
  risk_level?: RiskLevel;
  limit?: number;
  offset?: number;
}) => {
  const q = new URLSearchParams();
  if (params?.scan_type) q.set("scan_type", params.scan_type);
  if (params?.project_id) q.set("project_id", params.project_id);
  if (params?.risk_level) q.set("risk_level", params.risk_level);
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.offset != null) q.set("offset", String(params.offset));
  const qs = q.toString() ? `?${q}` : "";
  return api<Paginated<ScanListItem>>(`/scans${qs}`);
};

export const getScan = (scanId: string) =>
  api<ScanResult & { target: string; status: string; created_at: string; findings: Finding[] }>(
    `/scans/${scanId}`
  );

// ── Reports ───────────────────────────────────────────────────────────────────
export const generateReport = (scanId: string) =>
  api<ReportOut>(`/reports/generate/${scanId}`, { method: "POST" });

export const listReports = (params?: { limit?: number; offset?: number }) => {
  const q = new URLSearchParams();
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.offset) q.set("offset", String(params.offset));
  const qs = q.toString() ? `?${q}` : "";
  return api<Paginated<ReportOut>>(`/reports${qs}`);
};

export const downloadReportUrl = (reportId: string) =>
  `${API_BASE}/reports/${reportId}/download`;

// ── Notifications ─────────────────────────────────────────────────────────────
export const getUnreadCount = () =>
  api<{ unread: number }>("/notifications/count");

export const listNotifications = (params?: {
  unread_only?: boolean;
  severity?: Severity;
  limit?: number;
  offset?: number;
}) => {
  const q = new URLSearchParams();
  if (params?.unread_only) q.set("unread_only", "true");
  if (params?.severity) q.set("severity", params.severity);
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.offset) q.set("offset", String(params.offset));
  const qs = q.toString() ? `?${q}` : "";
  return api<Paginated<NotificationOut>>(`/notifications${qs}`);
};

export const markNotificationRead = (id: string) =>
  api<NotificationOut>(`/notifications/${id}/read`, { method: "PATCH" });

export const markAllRead = () =>
  api<{ marked_read: number }>("/notifications/read-all", { method: "POST" });

export const deleteNotification = (id: string) =>
  api<void>(`/notifications/${id}`, { method: "DELETE" });

// ── Projects ─────────────────────────────────────────────────────────────────
export const listProjects = (params?: { include_archived?: boolean }) => {
  const q = new URLSearchParams();
  if (params?.include_archived) q.set("include_archived", "true");
  const qs = q.toString() ? `?${q}` : "";
  return api<Paginated<ProjectOut>>(`/projects${qs}`);
};

export const createProject = (payload: { name: string; description?: string }) =>
  api<ProjectOut>("/projects", { method: "POST", body: JSON.stringify(payload) });

export const getProject = (projectId: string) =>
  api<ProjectDetail>(`/projects/${projectId}`);

export const updateProject = (projectId: string, payload: { name?: string; description?: string }) =>
  api<ProjectOut>(`/projects/${projectId}`, { method: "PATCH", body: JSON.stringify(payload) });

export const archiveProject = (projectId: string) =>
  api<void>(`/projects/${projectId}`, { method: "DELETE" });

export const getProjectScans = (projectId: string, params?: { limit?: number; offset?: number }) => {
  const q = new URLSearchParams();
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.offset) q.set("offset", String(params.offset));
  const qs = q.toString() ? `?${q}` : "";
  return api<Paginated<ScanListItem>>(`/projects/${projectId}/scans${qs}`);
};

// ── Helpers ───────────────────────────────────────────────────────────────────
export const severityColor = (s: Severity | string): string => {
  switch (s) {
    case "critical": return "text-violet-400 bg-violet-500/10 border-violet-400/40";
    case "high":     return "text-red-400 bg-red-500/10 border-red-400/40";
    case "medium":   return "text-amber-400 bg-amber-500/10 border-amber-400/40";
    default:         return "text-emerald-400 bg-emerald-500/10 border-emerald-400/40";
  }
};

export const riskColor = (r: RiskLevel | string): string => {
  switch (r) {
    case "critical": return "text-violet-400";
    case "high":     return "text-red-400";
    case "medium":   return "text-amber-400";
    default:         return "text-emerald-400";
  }
};
