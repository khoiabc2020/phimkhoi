import type { MetadataRoute } from "next";
import { getMoviesList } from "@/services/api";
import connectDB from "@/lib/db";
import MovieModel from "@/models/Movie";

const BASE_URL = "https://khoiphim.org";

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
    // [Elite SEO] Query local Database for ALL registered movies (35,000+ titles)
    await connectDB();
    const dbMovies = await MovieModel.find({}, { slug: 1, updatedAt: 1 })
      .sort({ updatedAt: -1 })
      .limit(45000) // Safe limit for a single sitemap.xml file (max 50k)
      .lean();

    const movieRoutes: MetadataRoute.Sitemap = dbMovies.map((movie: any) => ({
      url: `${BASE_URL}/phim/${movie.slug}`,
      lastModified: movie.updatedAt ? new Date(movie.updatedAt) : new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    }));

    return [...staticRoutes, ...movieRoutes];
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return staticRoutes;
  }
}
