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
    ],
  },
  experimental: {
    staleTimes: {
      dynamic: 30,    // client-side cache for dynamic pages
      static: 180,
    },
  },
};

export default nextConfig;

