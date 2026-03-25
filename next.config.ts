import type { NextConfig } from "next";

const config = (phase: string): NextConfig => {
  return {
    output: "standalone",
    env: {
      NEXT_PHASE: phase,
    },
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
        dynamic: 30,    // 30s router cache for dynamic pages (better UX on navigation)
        static: 180,   // 3min for static pages
      },
    },
    staticPageGenerationTimeout: 300, // 5 minutes to allow slow TMDB fetches
    httpAgentOptions: {
      keepAlive: true,
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
              value: "public, s-maxage=300, stale-while-revalidate=3600",  // 5min CDN, 1hr stale
            },
            {
              key: "Vary",
              value: "Accept",
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
          ],
        },
      ];
    },
  };
};

export default config;
