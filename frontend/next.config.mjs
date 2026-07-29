import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix file tracing root removed — Vercel handles this natively 
  // when the Project Root is correctly set to 'frontend'.
  reactStrictMode: true,
  poweredByHeader: false,
  // Skip type checks during production builds to avoid
  // platform-specific CLI/flag issues during deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  // Image optimization domains (add any CDN domains here)
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
  },
  async rewrites() {
    let backendOrigin = process.env.BACKEND_URL || process.env.BACKEND_ORIGIN || "https://sentinelnexus-backend.onrender.com";
    
    const isPrivate =
      backendOrigin.includes("localhost") ||
      backendOrigin.includes("127.0.0.1") ||
      backendOrigin.includes("0.0.0.0") ||
      backendOrigin.match(/https?:\/\/10\.\d+\.\d+\.\d+/) !== null ||
      backendOrigin.match(/https?:\/\/192\.168\.\d+\.\d+/) !== null ||
      backendOrigin.match(/https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+/) !== null;

    if (isPrivate && process.env.NODE_ENV === "production") {
      console.warn(
        `[next.config] BACKEND_URL "${backendOrigin}" resolves to a private address — ` +
          `falling back to https://sentinelnexus-backend.onrender.com`
      );
      backendOrigin = "https://sentinelnexus-backend.onrender.com";
    }

    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendOrigin}/api/v1/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Content-Security-Policy", value: "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://*.clerk.accounts.dev https://clerk.mayankiitj.in https://*.clerk.mayankiitj.in; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https:; connect-src 'self' https://*.clerk.accounts.dev https://sentinelnexus-backend.onrender.com https://clerk.mayankiitj.in https://*.clerk.mayankiitj.in; worker-src 'self' blob:;" }
        ],
      },
    ];
  },
};

export default nextConfig;
