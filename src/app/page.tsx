import { Suspense } from 'react';
export const revalidate = 3600;
import { cache } from "react";
import HeroSection from "@/components/HeroSection";
import MovieRow from "@/components/MovieRow";
import TopTrendingTabs from "@/components/TopTrendingTabs";
import QuickNav from "@/components/QuickNav";
import ContinueWatchingRow from "@/components/ContinueWatchingRow";
import RecommendedRow from "@/components/RecommendedRow";

import { getMovieDetail, getMoviesList, getTrendMovies, isTrailer } from "@/services/api";
import { getResilientMoviesList } from "@/app/actions/movies";
import { cn } from "@/lib/utils";
import { isAdultMovie, sanitizeMovieList } from "@/lib/movie-list";
import { hasLandscapeImage } from "@/lib/movie-media";
import connectDB from "@/lib/db";
import CustomHero from "@/models/CustomHero";
import TrendingCache from "@/models/TrendingCache";


const ROW_LIMIT = 12;
const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> => {
  let timer: NodeJS.Timeout | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const hasHeroMetadata = (movie: any) => {
  const hasYear = Number.parseInt(String(movie?.year || "").match(/\d{4}/)?.[0] || "", 10) > 1900;
  const hasCountry = Array.isArray(movie?.country) && movie.country.length > 0;
  const hasCategory = Array.isArray(movie?.category) && movie.category.length > 0;
  const hasContent = String(movie?.content || "").replace(/<[^>]+>/g, "").trim().length >= 24;
  return hasYear || hasCountry || hasCategory || hasContent;
};

const hasHeroBackdropCandidate = (movie: any) => {
  if (movie?.isCustomHero) return true;
  if (movie?.tmdbData?.backdrop_path) return true;
  return hasLandscapeImage(movie);
};

const heroSkeleton = (
  <div className="relative w-full h-[500px] md:h-[600px] lg:h-[700px] xl:h-[800px] bg-[#0a0a0a] overflow-hidden">
    <div className="absolute inset-0 shimmer" />
    <div className="absolute bottom-0 left-0 right-0 h-40 md:h-56 lg:h-72 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent z-10" />
  </div>
);
const contentSkeleton = (
  <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 md:px-8 lg:pl-24 lg:pr-12 py-8 space-y-8">
    <div className="h-6 w-48 bg-white/5 rounded shimmer" />
    <div className="flex gap-4 overflow-hidden">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="min-w-[150px] aspect-[2/3] rounded-lg bg-white/5 shimmer overflow-hidden" />
      ))}
    </div>
    <div className="h-6 w-40 bg-white/5 rounded shimmer mt-8" />
    <div className="flex gap-4 overflow-hidden">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="min-w-[150px] aspect-[2/3] rounded-lg bg-white/5 shimmer overflow-hidden" />
      ))}
    </div>
  </div>
);

async function buildTopList(
  sourceType: "all" | "tv" | "movie",
  backupSlug: "phim-moi" | "phim-bo" | "phim-le",
  timeWindow: "day" | "week" = "day"
) {
  let data: any[] = await getTrendMovies(sourceType, timeWindow).catch((): any[] => []);
  const seenMedia = new Set<string>();

  data = data.filter((item) => {
    if (!item || isTrailer(item) || isAdultMovie(item)) return false;
    const mediaUrl = item.poster_url || item.thumb_url;
    if (!mediaUrl) return true;
    if (seenMedia.has(mediaUrl)) return false;
    seenMedia.add(mediaUrl);
    return true;
  });

  if (data.length < 10) {
    // 1. [Strong Fallback] Try TrendingCache from MongoDB directly
    try {
      await connectDB();
      const typeMap: Record<string, string> = {
        'all': `tmdb-trending-${timeWindow}`,
        'tv': 'phim-bo',
        'movie': 'phim-le'
      };
      const cacheType = typeMap[sourceType] || sourceType;
      const cache = await TrendingCache.findOne({ type: cacheType }).lean();
      if (cache?.movies?.length > 0) {
        const sourceIds = new Set(data.map((m: { _id?: string }) => m._id));
        for (const m of cache.movies as any[]) {
          if (data.length >= 10) break;
          // Ensure _id matching regardless of source
          if (!sourceIds.has(m._id)) {
            const mediaUrl = m.poster_url || m.thumb_url;
            if (mediaUrl && seenMedia.has(mediaUrl)) continue;
            data.push(m);
            sourceIds.add(m._id);
            if (mediaUrl) seenMedia.add(mediaUrl);
          }
        }
      }
    } catch (e) {
      console.warn("buildTopList DB Fallback Error:", e);
    }
  }

  if (data.length < 10) {
    // 2. [Final Fallback] Fetch from standard "New" lists
    const backup = await getMoviesList(backupSlug, { limit: 20 });
    const sourceIds = new Set(data.map((m: { _id?: string }) => m._id));
    for (const item of backup?.items || []) {
      if (data.length >= 10) break;
      if (!sourceIds.has(item._id)) {
        const mediaUrl = item.poster_url || item.thumb_url;
        if (mediaUrl && seenMedia.has(mediaUrl)) continue;
        data.push(item);
        sourceIds.add(item._id);
        if (mediaUrl) seenMedia.add(mediaUrl);
      }
    }
  }

  return sanitizeMovieList(data, { limit: 10 });
}

function mergeTopPools(...pools: any[][]) {
  return sanitizeMovieList(pools.flat().filter((item) => item && !isAdultMovie(item)), { limit: 10 });
}

// Expose quick-switch top tabs on all screens (Top ngày / Top tuần / Top tháng / Top bộ / Top lẻ)
async function AsyncTopTrendingHub() {
  const [allMovies, weekMovies, tvMovies, movieMovies, monthBackup] = await Promise.all([
    buildTopList("all", "phim-moi"),
    buildTopList("all", "phim-moi", "week"),
    buildTopList("tv", "phim-bo"),
    buildTopList("movie", "phim-le"),
    getMoviesList("phim-moi", { limit: 30 }).then((res) => (res.items || []).slice(0, 12)).catch((): any[] => []),
  ]);
  const monthMovies = mergeTopPools(weekMovies, allMovies, monthBackup);

  if (!allMovies.length && !weekMovies.length && !monthMovies.length && !tvMovies.length && !movieMovies.length) return null;

  return (
    <div className="mt-1">
      <TopTrendingTabs
        allMovies={allMovies}
        weekMovies={weekMovies}
        monthMovies={monthMovies}
        tvMovies={tvMovies}
        movieMovies={movieMovies}
      />
    </div>
  );
}

async function AsyncHeroSection({ initialMovies }: { initialMovies: any[] }) {
  const enhancedHeroData = await Promise.all(
    initialMovies.map(async (movie, idx) => {
      // If it's a Custom Hero from DB, pass it right through as it already has layers
      if (movie.isCustomHero) return movie;

      const shouldHydrateDetail =
        idx < 3 &&
        (
          !movie?.year ||
          !Array.isArray(movie?.country) ||
          movie.country.length === 0 ||
          !Array.isArray(movie?.category) ||
          movie.category.length === 0 ||
          (!hasLandscapeImage(movie) && !movie?.tmdbData?.backdrop_path)
        );

      let baseMovie = movie;
      if (shouldHydrateDetail && movie?.slug) {
        const detail = await withTimeout(
          getMovieDetail(movie.slug).catch((): null => null),
          1200,
          null
        );
        if (detail?.movie) {
          const detailMovie: any = detail.movie as any;
          baseMovie = {
            ...detailMovie,
            tmdbData: movie.tmdbData || detailMovie.tmdbData || null,
          };
        }
      }

      // Chỉ enrich TMDB cho các slide đầu để giảm thời gian render trang chủ
      // Skip hoàn toàn trong lúc build để tránh treo build (TMDB hay bị timeout)
      return { ...baseMovie, tmdbData: baseMovie.tmdbData || null };
    })
  );

  const backdropReady = enhancedHeroData.filter((movie) => {
    return hasHeroBackdropCandidate(movie) && hasHeroMetadata(movie);
  });
  const heroMovies = sanitizeMovieList((backdropReady.length > 0 ? backdropReady : enhancedHeroData), { limit: 8 });

  return <HeroSection movies={heroMovies} />;
}

/** Hàng phim tự tải dữ liệu nhanh và fail-fast */
async function HomeRowSection({
  title,
  slug,
  endpoint = 'danh-sach',
  viewAllHref,
  minHeight = 350,
  priorityFirst = false
}: {
  title: string;
  slug: string;
  endpoint?: 'danh-sach' | 'the-loai' | 'quoc-gia';
  viewAllHref?: string;
  viewAllLabel?: string;
  minHeight?: number;
  priorityFirst?: boolean;
}) {
  let movies: any[] = [];
  try {
    const res = await getResilientMoviesList(slug, 1, ROW_LIMIT, {
      category: endpoint === 'the-loai' ? slug : undefined,
      country: endpoint === 'quoc-gia' ? slug : undefined
    });
    
    movies = res?.items || [];
  } catch (error) {
    // Return null handled below
  }

  if (!movies.length) return null;

  return (
    <MovieRow
      title={title}
      movies={movies}
      slug={viewAllHref || slug}
      priorityFirst={priorityFirst}
    />
  );
}

/** Hero stream: tải dữ liệu top trending độc lập hoặc Custom Hero */
async function HeroStream() {
  let finalHeroData: any[] = [];
  
  try {
    // 1. Tải Custom Hero từ Database
    await connectDB();
    const customHeroes = await CustomHero.find({ isActive: true }).sort({ order: 1 }).lean();
    
    if (customHeroes && customHeroes.length > 0) {
      finalHeroData = customHeroes.map((ch: any) => ({
        _id: ch._id.toString(),
        name: ch.name,
        slug: ch.slug,
        origin_name: "", // Not needed for Custom
        layer_bg: ch.layer_bg,
        layer_character: ch.layer_character,
        layer_logo: ch.layer_logo,
        isCustomHero: true
      }));
    } else {
      // 2. Không có Custom Hero -> Fallback tải dữ liệu top trending từ Database trực tiếp
      const cache = await TrendingCache.findOne({ type: 'tmdb-trending-day' }).lean();
      // Ensure we filter out any trailers that might be in the cache
      finalHeroData = sanitizeMovieList(
        (cache?.movies || []).filter((m: any) => !isTrailer(m) && !isAdultMovie(m)),
        { limit: 16 }
      );
      
      if (finalHeroData.filter((movie) => hasHeroBackdropCandidate(movie) && hasHeroMetadata(movie)).length < 6) {
        const backupCache = await TrendingCache.findOne({ type: 'phim-bo' }).lean();
        finalHeroData = sanitizeMovieList(
          [...finalHeroData, ...((backupCache?.movies || []).filter((m: any) => !isTrailer(m) && !isAdultMovie(m)))],
          { limit: 16 }
        );
      }
    }
  } catch (error) {
    console.error("HeroStream Error:", error);
  }

  if (finalHeroData.filter((movie) => hasHeroBackdropCandidate(movie) && hasHeroMetadata(movie)).length < 6) {
    try {
      const fallback = await getMoviesList("phim-moi-cap-nhat", { limit: 10 });
      finalHeroData = sanitizeMovieList(
        [...finalHeroData, ...((fallback.items || []).filter((m: any) => !isTrailer(m) && !isAdultMovie(m)))],
        { limit: 16 }
      );
    } catch (error) {
      console.error("HeroStream external fallback error:", error);
    }
  }

  if (finalHeroData.length === 0) return null;
  
  return <AsyncHeroSection initialMovies={finalHeroData} />;
}

const ROW_CONFIGS = [
  { slug: "phim-chieu-rap", title: "Phim Chiếu Rạp Mới", viewAllHref: "/danh-sach/phim-chieu-rap", priorityFirst: true as const },
  { slug: "phim-moi-cap-nhat", title: "Phim Mới Cập Nhật", viewAllHref: "/danh-sach/phim-moi", priorityFirst: true as const },
  { slug: "han-quoc", title: "Phim Hàn Quốc", endpoint: "quoc-gia" as const, viewAllHref: "/quoc-gia/han-quoc" },
  { slug: "trung-quoc", title: "Phim Trung Quốc", endpoint: "quoc-gia" as const, viewAllHref: "/quoc-gia/trung-quoc" },
  { slug: "phim-le", title: "Phim Lẻ Mới", viewAllHref: "/danh-sach/phim-le" },
  { slug: "phim-bo", title: "Phim Bộ Mới", viewAllHref: "/danh-sach/phim-bo" },
  { slug: "hanh-dong", title: "Phim Hành Động", endpoint: "the-loai" as const, viewAllHref: "/the-loai/hanh-dong" },
  { slug: "hoat-hinh", title: "Phim Hoạt Hình", endpoint: "the-loai" as const, viewAllHref: "/the-loai/hoat-hinh" },
] as const;

/** Stream all movie rows independently — fetches in parallel with Hero */
async function HomeRowsSection() {
  const rowResults = await Promise.all(
    ROW_CONFIGS.map(({ slug, endpoint }) =>
      getResilientMoviesList(slug, 1, ROW_LIMIT, {
        category: endpoint === 'the-loai' ? slug : undefined,
        country: endpoint === 'quoc-gia' ? slug : undefined,
      }).catch(() => ({ items: [] as any[] }))
    )
  );

  return (
    <div className="space-y-4 md:space-y-8">
      <ContinueWatchingRow />
      <RecommendedRow />
      {ROW_CONFIGS.map((config, idx) => {
        const movies = rowResults[idx]?.items || [];
        if (!movies.length) return null;
        return (
          <MovieRow
            key={config.slug}
            title={config.title}
            movies={movies}
            slug={config.viewAllHref}
            priorityFirst={'priorityFirst' in config ? config.priorityFirst : false}
          />
        );
      })}
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen pb-24 md:pb-16 bg-[#0a0a0a]">
      {/* Hero — streams independently */}
      <Suspense fallback={heroSkeleton}>
        <HeroStream />
      </Suspense>

      <div className="w-full max-w-[1920px] mx-auto px-1.5 sm:px-3 md:px-5 lg:pl-24 lg:pr-12 relative z-30 -mt-0 md:-mt-2 lg:-mt-4 xl:-mt-6">
        <div className="pointer-events-none absolute left-0 right-0 top-0 -z-10 h-[800px] bg-[radial-gradient(circle_at_top,rgba(143,167,197,0.04),transparent_55%)] blur-[160px]" />

        <div className="mb-6">
          <QuickNav />
        </div>

        {/* Top Trending — streams independently, in parallel with rows */}
        <Suspense fallback={<div className="h-[280px] bg-white/[0.03] rounded-lg animate-pulse mx-4" />}>
          <AsyncTopTrendingHub />
        </Suspense>

        {/* Movie rows — stream in parallel with TopTrending */}
        <Suspense fallback={contentSkeleton}>
          <HomeRowsSection />
        </Suspense>
      </div>
    </main>
  );
}

