import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/login", "/register", "/forgot-password", "/reset-password"],
      },
    ],
    sitemap: "https://khoiphim.io.vn/sitemap.xml",
    host: "https://khoiphim.io.vn",
  };
}
