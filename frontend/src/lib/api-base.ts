/**
 * API base URL resolution.
 *
 * Architecture: ALL browser requests go through the Next.js API route proxy
 * at /api/v1/* (same origin → zero CORS issues).  The proxy forwards
 * server-to-server to the Render backend using the BACKEND_URL env var.
 *
 * This means NEXT_PUBLIC_API_URL is no longer needed for production — it is
 * kept only for tools that call the backend directly (e.g. curl, Postman).
 *
 * Flow:
 *   Browser → /api/v1/... (Vercel, same-origin) → BACKEND_URL/api/v1/... (Render)
 */

export const getApiBaseUrl = (): string => {
  // In the browser (or SSR) we always hit the local Next.js proxy route.
  // This is the ONLY correct value — it eliminates CORS permanently.
  return "/api/v1";
};

// Build a full endpoint URL. Guarantees the path starts with a leading slash.
export const buildApiUrl = (path: string): string => {
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
};