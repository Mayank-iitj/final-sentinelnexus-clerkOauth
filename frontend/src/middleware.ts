import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const isTestClerkKey = /^pk_test_[A-Za-z0-9]+$/.test(clerkPublishableKey);
const isLiveClerkKey = /^pk_live_[A-Za-z0-9]+$/.test(clerkPublishableKey);

function isAllowedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1") {
    return isTestClerkKey;
  }
  if (host === "mayankiitj.in" || host.endsWith(".mayankiitj.in")) {
    return isTestClerkKey || isLiveClerkKey;
  }
  return isTestClerkKey;
}

const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/signup(.*)",
  "/api/v1/auth/clerk/webhook(.*)",
  "/showcase(.*)",
  "/support(.*)",
  "/api/(.*)", // Allow API routes to be handled by backend auth/verification
]);

const authMiddleware = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export default function middleware(request: Parameters<typeof authMiddleware>[0], event: Parameters<typeof authMiddleware>[1]) {
  if (!isAllowedHost(request.nextUrl.hostname)) {
    return NextResponse.next();
  }
  return authMiddleware(request, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|lottie)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
