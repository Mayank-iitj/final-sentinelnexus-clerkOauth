import { NextRequest } from "next/server";

const BACKEND_ORIGIN = (
  process.env.BACKEND_URL ||
  process.env.BACKEND_ORIGIN ||
  "http://localhost:8000"
).replace(/\/+$/, "");

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
}

export const dynamic = "force-dynamic";

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
export const HEAD = proxy;