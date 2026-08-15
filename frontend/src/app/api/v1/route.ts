import { NextRequest } from "next/server";

const PRODUCTION_BACKEND = "https://final-sentinelnexus-clerkoauth.onrender.com";

/**
 * Resolve the backend origin, guarding against localhost/private addresses
 * leaking into production (which causes DNS_HOSTNAME_RESOLVED_PRIVATE on Vercel).
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
    raw.match(/https?:\/\/10\.\d+\.\d+\.\d+/) !== null ||
    raw.match(/https?:\/\/192\.168\.\d+\.\d+/) !== null ||
    raw.match(/https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+/) !== null;

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

async function proxy(request: NextRequest) {
  const backendUrl = new URL(`/api/v1${request.nextUrl.search}`, BACKEND_ORIGIN);
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
    cache: "no-store",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
    (init as RequestInit & { duplex?: "half" }).duplex = "half";
  }

  try {
    const backendResponse = await fetch(backendUrl, init);
    const responseHeaders = new Headers();

    backendResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "set-cookie") responseHeaders.set(key, value);
    });

    const setCookies = (backendResponse.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.();
    if (setCookies?.length) {
      for (const cookie of setCookies) responseHeaders.append("set-cookie", cookie);
    } else {
      const setCookie = backendResponse.headers.get("set-cookie");
      if (setCookie) responseHeaders.append("set-cookie", setCookie);
    }

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error(`[proxy] fetch error for ${backendUrl.toString()}:`, error.message || error);
    return new Response(
      JSON.stringify({ detail: "Backend service is currently unavailable. Please try again later." }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export const dynamic = "force-dynamic";
// Node.js runtime: 60-second timeout (vs 25s edge) — needed for Render cold-starts.
export const runtime = "nodejs";

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
export const HEAD = proxy;