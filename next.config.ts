import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  compress: true,           // gzip/brotli responses
  poweredByHeader: false,
  images: {
    // Keep unoptimized — VPS doesn't have capacity to proxy/resize images on-the-fly
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "phimimg.com" },
      { protocol: "https", hostname: "phimapi.com" },
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "ui-avatars.com" },
      { protocol: "https", hostname: "img.ophim.live" },
      { protocol: "https", hostname: "img.ophim1.com" },
      { protocol: "https", hostname: "**.ophim.live" },
      { protocol: "https", hostname: "assets.nflxext.com" },
    ],
    // Minimize layout shift for images loaded from external URLs
    minimumCacheTTL: 86400, // 24 hours browser-level cache for optimized images
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
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
