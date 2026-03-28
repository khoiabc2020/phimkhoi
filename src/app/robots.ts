import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Cho phép Google, Bing, các search engine thật
      {
        userAgent: ["Googlebot", "Bingbot", "Slurp", "DuckDuckBot", "Baiduspider", "YandexBot"],
        allow: "/",
        disallow: ["/admin", "/api", "/login", "/register", "/forgot-password", "/reset-password"],
      },
      // Block AI training bots — bảo vệ nội dung (như onflix.my)
      {
        userAgent: [
          "GPTBot", "ChatGPT-User", "CCBot", "anthropic-ai", "Claude-Web",
          "ClaudeBot", "Omgilibot", "FacebookBot", "Google-Extended",
          "PerplexityBot", "YouBot", "cohere-ai", "Diffbot",
        ],
        disallow: "/",
      },
      // Default: cho crawl trang phim, block admin/api
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/login", "/register", "/forgot-password", "/reset-password"],
      },
    ],
    sitemap: "https://khoiphim.org/sitemap.xml",
    host: "https://khoiphim.org",
  };
}
