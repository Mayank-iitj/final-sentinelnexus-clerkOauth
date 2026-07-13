/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Skip type checks during production builds to avoid
  // platform-specific CLI/flag issues during deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  // Output standalone for optimal Vercel cold starts
  output: "standalone",
  // Image optimization domains (add any CDN domains here)
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
  },
  async rewrites() {
    const backendOrigin =
      process.env.BACKEND_URL || process.env.BACKEND_ORIGIN || "http://localhost:8000";

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
          { key: "Content-Security-Policy", value: "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://*.clerk.accounts.dev; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https:; connect-src 'self' https://*.clerk.accounts.dev https://sentinelnexus-backend.onrender.com;" }
        ],
      },
    ];
  },
};

export default nextConfig;
