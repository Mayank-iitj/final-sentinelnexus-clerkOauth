import { NextRequest } from "next/server";

const BACKEND_ORIGIN = (
  process.env.BACKEND_URL ||
  process.env.BACKEND_ORIGIN ||
  "http://localhost:8000"
).replace(/\/+$/, "");

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
}

export const dynamic = "force-dynamic";

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
export const HEAD = proxy;