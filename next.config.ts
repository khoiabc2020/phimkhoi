import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  compress: true,           // gzip/brotli responses
  poweredByHeader: false,
  // Ensure mongoose/mongodb only run on server, never bundled for browser
  serverExternalPackages: ["mongoose", "mongodb"],
  images: {
    // Sử dụng custom loader wsrv.nl thay cho Next.js optimization (không tiêu tốn CPU của VPS)
    unoptimized: false,
    loader: "custom",
    loaderFile: "./src/imageLoader.ts",
    // Vẫn duy trì các pattern để an toàn (tuy ko bắt buộc khi có custom loader)
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
    minimumCacheTTL: 31536000, // 1 year cache
  },
  experimental: {
    staleTimes: {
      dynamic: 0,      // Disable client-side cache for dynamic pages during active dev
      static: 180,    // Lower static cache
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
          {
            key: "Vary",
            value: "Cookie",
          },
        ],
      },
      {
        source: "/api/((?!auth).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=31536000, stale-while-revalidate=604800",
          },
          {
            key: "Vary",
            value: "Accept", // Vary by Accept header for webp/avif support
          },
        ],
      },
      // [Elite Edge Cache] Public Content Caching (HTML)
      // Allows Cloudflare to cache the entire page response for anonymous users.
      {
        source: "/(danh-sach|phim|xem-phim|quoc-gia|the-loai|nam-phat-hanh|phim-han|phim-trung|phim-viet-nam)(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
          {
            key: "Vary",
            value: "Cookie",
          },
        ],
      },
      // Special case: Homepage
      {
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
          {
            key: "Vary",
            value: "Cookie",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
