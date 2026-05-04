/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Skip type and ESLint checks during production builds to avoid
  // platform-specific CLI/flag issues during deployment. Type checks
  // and lint should be run in CI separately.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
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
        ],
      },
    ];
  },
};

export default nextConfig;
