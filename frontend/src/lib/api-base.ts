// Returns the base URL for the backend API.
// 1️⃣ NEXT_PUBLIC_API_URL (e.g. "https://final-sentinelnexus-clerkoauth.onrender.com/api/v1")
//    is the primary source of truth — always set this in production.
// 2️⃣ In the browser without the env var we fall back to window.location.origin + "/api/v1".
//    This works for same-origin local dev or custom proxy setups.
// 3️⃣ In SSR without the env var we fall back to a relative "/api/v1" path.
export const getApiBaseUrl = (): string => {
  const envUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").trim();
  if (envUrl) {
    // Normalise – strip trailing slash so concatenation is always clean.
    return envUrl.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined") {
    return `${window.location.origin.replace(/\/+$/, "")}/api/v1`;
  }
  return "/api/v1";
};

// Build a full endpoint URL; always prepends a leading slash to the path.
export const buildApiUrl = (path: string): string => {
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
};