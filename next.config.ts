import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  compress: true,           // gzip/brotli responses
  poweredByHeader: false,
  images: {
    // Sử dụng custom loader wsrv.nl thay cho Next.js optimization (không tiêu tốn CPU của VPS)
    unoptimized: false,
    loader: "custom",
    loaderFile: "./src/imageLoader.ts",
    // Vẫn duy trì các pattern để an toàn (tuy ko bắt buộc khi có custom loader)
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
    minimumCacheTTL: 86400, // 24 hours browser-level cache
  },
  experimental: {
    staleTimes: {
      dynamic: 60,     // client-side cache for dynamic pages (tăng từ 30 lên 60s)
      static: 300,     // tăng từ 180 lên 300s
    },
  },
  // Add Cache-Control headers for static assets
  async headers() {
    return [
      {
        source: "/(.*\\.webp|.*\\.jpg|.*\\.png|.*\\.gif|.*\\.svg|.*\\.ico)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // API routes: CDN caches for 60s, stale-while-revalidate for 5 minutes
        source: "/api/((?!auth).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=300",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
