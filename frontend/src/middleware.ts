import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/signup(.*)",
  // Marketing / informational pages
  "/about(.*)",
  "/features(.*)",
  "/pricing(.*)",
  "/blog(.*)",
  "/docs(.*)",
  "/contact(.*)",
  "/legal(.*)",
  "/status(.*)",
  "/changelog(.*)",
  "/cyberpentest(.*)",
  "/showcase(.*)",
  "/demo(.*)",
  "/support(.*)",
  "/api-reference(.*)",
  // Backend API routes — let backend handle its own auth
  "/api/(.*)",
  // Clerk webhook
  "/api/v1/auth/clerk/webhook(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});


export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|lottie)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
