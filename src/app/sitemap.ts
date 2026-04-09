import type { MetadataRoute } from "next";
import { getMoviesList } from "@/services/api";
import connectDB from "@/lib/db";
import MovieModel from "@/models/Movie";

// Cache sitemap for 24 hours — avoids hitting DB on every request
export const revalidate = 86400;

const BASE_URL = "https://khoiphim.org";

const ALL_CATEGORIES = [
  "hanh-dong","tinh-cam","hai-huoc","co-trang","tam-ly","kinh-di","the-thao",
  "vien-tuong","phieu-luu","hoat-hinh","hoc-duong","chien-tranh","gia-dinh",
  "vo-thuat","bi-an","khoa-hoc","am-nhac","lich-su","phim-18",
];

const ALL_COUNTRIES = [
  "han-quoc","trung-quoc","nhat-ban","my","thai-lan","viet-nam","phap","anh",
  "hong-kong","an-do","dai-loan","canada","uc","duc","y","tay-ban-nha",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${BASE_URL}/danh-sach/phim-moi`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/danh-sach/phim-bo`, changeFrequency: "hourly", priority: 0.85 },
    { url: `${BASE_URL}/danh-sach/phim-le`, changeFrequency: "hourly", priority: 0.85 },
    { url: `${BASE_URL}/danh-sach/hoat-hinh`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/danh-sach/phim-sap-chieu`, changeFrequency: "daily", priority: 0.75 },
    ...ALL_CATEGORIES.map(slug => ({
      url: `${BASE_URL}/the-loai/${slug}`,
      changeFrequency: "daily" as const,
      priority: 0.75,
    })),
    ...ALL_COUNTRIES.map(slug => ({
      url: `${BASE_URL}/quoc-gia/${slug}`,
      changeFrequency: "daily" as const,
      priority: 0.72,
    })),
  ];

  try {
    // [Elite Performance] During build phase, skip large DB queries to prevent hang/OOM
    // Sitemap will be generated on-demand in production or via a different trigger
    const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
    
    await connectDB();
    const movieLimit = isBuildPhase ? 100 : 45000;
    
    const dbMovies = await MovieModel.find({}, { slug: 1, updatedAt: 1 })
      .sort({ updatedAt: -1 })
      .limit(movieLimit)
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
