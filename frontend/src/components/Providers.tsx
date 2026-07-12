"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { setClerkToken } from "../lib/api";

/**
 * ClerkTokenSync
 *
 * Bridges Clerk's auth state with our API client.
 * Uses useAuth().getToken() (the official Clerk API) to fetch the JWT,
 * then injects it into the API client via setClerkToken().
 *
 * This runs on every auth state change, keeping the token fresh.
 */
function ClerkTokenSync() {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    let mounted = true;

    async function syncToken() {
      if (isSignedIn) {
        try {
          const token = await getToken();
          if (mounted) setClerkToken(token);
        } catch {
          if (mounted) setClerkToken(null);
        }
      } else {
        if (mounted) setClerkToken(null);
      }
    }

    syncToken();

    // Refresh token every 50 seconds (Clerk tokens expire in ~60s)
    const interval = setInterval(syncToken, 50_000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [getToken, isSignedIn]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ClerkTokenSync />
      {children}
    </>
  );
}
