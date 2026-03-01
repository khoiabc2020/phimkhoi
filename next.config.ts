import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  compress: true,               // Enable gzip/brotli compression
  poweredByHeader: false,       // Remove X-Powered-By header (minor security + perf)
  images: {
    // Enable full Next.js image optimization (WebP conversion, resizing, caching)
    unoptimized: false,
    minimumCacheTTL: 604800,    // Cache optimized images 7 days
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: "https", hostname: "phimimg.com" },
      { protocol: "https", hostname: "phimapi.com" },
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "ui-avatars.com" },
      { protocol: "https", hostname: "img.ophim.live" },
      { protocol: "https", hostname: "img.ophim1.com" },
      { protocol: "https", hostname: "**.ophim.live" },
      { protocol: "http", hostname: "**.ophim.live" },
    ],
  },
  experimental: {
    // Enable optimistic client cache for faster navigation
    staleTimes: {
      dynamic: 30,              // Cache dynamic routes for 30s in client
      static: 180,              // Cache static routes for 3 min in client
    },
  },
};

export default nextConfig;
