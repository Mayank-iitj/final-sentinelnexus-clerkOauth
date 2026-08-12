import { NextRequest } from "next/server";

const PRODUCTION_BACKEND = "https://sentinelnexus-backend.onrender.com";

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

  // If the URL points to localhost or a private address, and we're running
  // in a deployed environment, fall back to the public backend URL.
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

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

function buildBackendUrl(request: NextRequest, pathSegments: string[]) {
  const path = pathSegments.length > 0 ? `/api/v1/${pathSegments.join("/")}` : "/api/v1";
  return new URL(`${path}${request.nextUrl.search}`, BACKEND_ORIGIN);
}

async function proxy(request: NextRequest, context: { params: { path?: string[] } }) {
  const backendUrl = buildBackendUrl(request, context.params.path ?? []);
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
    // The body stream is already consumed by fetch; keep duplex for Node runtimes.
    (init as RequestInit & { duplex?: "half" }).duplex = "half";
  }

  try {
    const backendResponse = await fetch(backendUrl, init);
    const responseHeaders = new Headers();

    backendResponse.headers.forEach((value, key) => {
      if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase()) && key.toLowerCase() !== "set-cookie") {
        responseHeaders.set(key, value);
      }
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
// Edge runtime enables true HTTP streaming — without this, Vercel's serverless
// functions buffer the entire response body before forwarding, making SSE/streaming
// appear as an empty response on the client.
export const runtime = "edge";


export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
export const HEAD = proxy;