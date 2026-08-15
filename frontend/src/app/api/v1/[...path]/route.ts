import { NextRequest } from "next/server";

const PRODUCTION_BACKEND = "https://final-sentinelnexus-clerkoauth.onrender.com";

/**
 * Resolve the backend origin.
 * Guards against localhost/private addresses leaking into production
 * (which causes DNS_HOSTNAME_RESOLVED_PRIVATE errors on Vercel).
 */
function resolveBackendOrigin(): string {
  const raw = (
    process.env.BACKEND_URL ||
    process.env.BACKEND_ORIGIN ||
    PRODUCTION_BACKEND
  ).replace(/\/+$/, "");

  const isPrivate =
    raw.includes("localhost") ||
    raw.includes("127.0.0.1") ||
    raw.includes("0.0.0.0") ||
    /https?:\/\/10\.\d+\.\d+\.\d+/.test(raw) ||
    /https?:\/\/192\.168\.\d+\.\d+/.test(raw) ||
    /https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+/.test(raw);

  if (isPrivate && process.env.VERCEL === "1") {
    console.warn(
      `[proxy] BACKEND_URL "${raw}" resolves to a private address — ` +
        `using ${PRODUCTION_BACKEND} instead.`
    );
    return PRODUCTION_BACKEND;
  }

  return raw;
}

const BACKEND_ORIGIN = resolveBackendOrigin();

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

function errorResponse(detail: string, status = 502): Response {
  return new Response(JSON.stringify({ detail }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function proxy(
  request: NextRequest,
  // Next.js 15: params is a Promise; Next.js 14: params is synchronous.
  // We handle both by awaiting regardless.
  context: { params: Promise<{ path?: string[] }> | { path?: string[] } }
) {
  let pathSegments: string[] = [];
  try {
    // Await in case Next.js 15 passes a Promise, no-op for Next.js 14.
    const resolved = await Promise.resolve(context.params);
    pathSegments = resolved?.path ?? [];
  } catch {
    // params resolution failed — proxy to root
    pathSegments = [];
  }

  const pathStr =
    pathSegments.length > 0 ? `/api/v1/${pathSegments.join("/")}` : "/api/v1";
  let backendUrl: URL;
  try {
    backendUrl = new URL(`${pathStr}${request.nextUrl.search}`, BACKEND_ORIGIN);
  } catch {
    return errorResponse("Invalid backend URL", 500);
  }

  // Forward safe headers only — drop host and content-length.
  const forwardHeaders = new Headers();
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "host" || lower === "content-length" || HOP_BY_HOP.has(lower)) return;
    forwardHeaders.set(key, value);
  });

  // Build fetch options.
  // duplex:"half" is Node.js only — the nodejs runtime supports it.
  const init: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers: forwardHeaders,
    redirect: "manual",
    cache: "no-store",
  };

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  if (hasBody) {
    // Read the full body as ArrayBuffer — safe for both Node.js runtime
    // (no duplex needed) and avoids streaming issues.
    try {
      init.body = await request.arrayBuffer();
    } catch {
      init.body = undefined;
    }
  }

  try {
    const upstream = await fetch(backendUrl, init);

    // Copy safe response headers.
    const responseHeaders = new Headers();
    upstream.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (HOP_BY_HOP.has(lower) || lower === "set-cookie") return;
      responseHeaders.set(key, value);
    });

    // Preserve Set-Cookie (important for auth).
    const rawSetCookie = upstream.headers.get("set-cookie");
    if (rawSetCookie) responseHeaders.append("set-cookie", rawSetCookie);

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error(
      `[proxy] upstream fetch failed for ${backendUrl.toString()}:`,
      err?.message ?? err
    );
    return errorResponse(
      "The backend service is temporarily unavailable. Please try again in a few seconds."
    );
  }
}

// ── Runtime ────────────────────────────────────────────────────────────────────
// Node.js runtime (NOT edge) because:
//   1. 60-second function timeout vs 25s for edge — needed for Render cold-starts.
//   2. Full Node.js API support (ArrayBuffer body reading, etc.).
//   3. No streaming limitations from edge sandbox.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // seconds — Vercel Pro/Hobby max

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
export const HEAD = proxy;