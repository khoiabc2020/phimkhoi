import type { MetadataRoute } from "next";
import { getMoviesList } from "@/services/api";

const BASE_URL = "https://khoiphim.io.vn";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${BASE_URL}/danh-sach/phim-moi`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/danh-sach/phim-bo`, changeFrequency: "hourly", priority: 0.85 },
    { url: `${BASE_URL}/danh-sach/phim-le`, changeFrequency: "hourly", priority: 0.85 },
    { url: `${BASE_URL}/the-loai/hanh-dong`, changeFrequency: "daily", priority: 0.75 },
    { url: `${BASE_URL}/the-loai/tinh-cam`, changeFrequency: "daily", priority: 0.75 },
    { url: `${BASE_URL}/quoc-gia/han-quoc`, changeFrequency: "daily", priority: 0.72 },
    { url: `${BASE_URL}/quoc-gia/trung-quoc`, changeFrequency: "daily", priority: 0.72 },
  ];

  try {
    const [latest, series, single] = await Promise.all([
      getMoviesList("phim-moi", { page: 1, limit: 120 }),
      getMoviesList("phim-bo", { page: 1, limit: 120 }),
      getMoviesList("phim-le", { page: 1, limit: 120 }),
    ]);

    const bySlug = new Map<string, any>();
    for (const source of [latest?.items || [], series?.items || [], single?.items || []]) {
      for (const movie of source) {
        if (!movie?.slug || bySlug.has(movie.slug)) continue;
        bySlug.set(movie.slug, movie);
      }
    }

    const movieRoutes: MetadataRoute.Sitemap = Array.from(bySlug.values()).slice(0, 300).map((movie: any) => ({
      url: `${BASE_URL}/phim/${movie.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    }));

    return [...staticRoutes, ...movieRoutes];
  } catch {
    return staticRoutes;
  }
}
