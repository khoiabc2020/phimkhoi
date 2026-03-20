import { Suspense } from 'react';
import { cache } from "react";
import HeroSection from "@/components/HeroSection";
import MovieRow from "@/components/MovieRow";
import TopTrendingTabs from "@/components/TopTrendingTabs";
import QuickNav from "@/components/QuickNav";
import ContinueWatchingRow from "@/components/ContinueWatchingRow";

import HomeSection from "@/components/HomeSection";
import LazySection from "@/components/LazySection";
import { getMoviesList, getTrendMovies } from "@/services/api";
import { getTMDBDataForCard } from "@/app/actions/tmdb";

export const revalidate = 3600;
const ROW_LIMIT = 12; // Tăng một chút để nhìn đầy đặn hơn trên màn hình ultra-wide

const heroSkeleton = <div className="w-full h-[66vh] md:h-[88vh] bg-[#0a0a0a] animate-pulse" />;
const contentSkeleton = (
  <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 md:px-8 py-8 space-y-8">
    <div className="h-6 w-48 bg-white/10 rounded animate-pulse" />
    <div className="flex gap-4 overflow-hidden">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="min-w-[150px] aspect-[2/3] rounded-lg bg-white/10 animate-pulse" />
      ))}
    </div>
    <div className="h-6 w-40 bg-white/10 rounded animate-pulse mt-8" />
    <div className="flex gap-4 overflow-hidden">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="min-w-[150px] aspect-[2/3] rounded-lg bg-white/10 animate-pulse" />
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
    const mediaUrl = item.poster_url || item.thumb_url;
    if (!mediaUrl) return true;
    if (seenMedia.has(mediaUrl)) return false;
    seenMedia.add(mediaUrl);
    return true;
  });

  if (data.length < 10) {
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

  return data.slice(0, 10);
}

function mergeTopPools(...pools: any[][]) {
  const bySlug = new Map<string, any>();
  for (const pool of pools) {
    for (const item of pool || []) {
      if (!item?.slug) continue;
      if (!bySlug.has(item.slug)) bySlug.set(item.slug, item);
      if (bySlug.size >= 12) break;
    }
    if (bySlug.size >= 12) break;
  }
  return [...bySlug.values()].slice(0, 10);
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
      // Chỉ enrich TMDB cho các slide đầu để giảm thời gian render trang chủ
      if (idx > 2) return { ...movie, tmdbData: null };
      const year = movie.year ? parseInt(movie.year.toString().split("-")[0]) : undefined;
      let type: 'movie' | 'tv' = 'movie';
      if (movie.type === 'phim-bo' || movie.type === 'tv-shows' || movie.type === 'hoat-hinh') type = 'tv';

      const tmdbData = await getTMDBDataForCard(
        movie.origin_name || movie.name,
        isNaN(year!) ? undefined : year,
        type,
        { originalName: movie.origin_name, countrySlug: movie.country?.[0]?.slug }
      ).catch((): any => null);

      return { ...movie, tmdbData: tmdbData || null };
    })
  );

  return <HeroSection movies={enhancedHeroData} />;
}

/** Hàng phim tự tải dữ liệu (Self-fetching Row) để hỗ trợ Streaming */
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
  try {
    const res = await getMoviesList(slug, { 
      limit: ROW_LIMIT, 
      category: endpoint === 'the-loai' ? slug : undefined, 
      country: endpoint === 'quoc-gia' ? slug : undefined 
    });
    
    const movies = res?.items || [];

    if (!movies.length) return null;

    return (
      <LazySection minHeight={minHeight}>
        <MovieRow
          title={title}
          movies={movies}
          slug={viewAllHref || slug}
          priorityFirst={priorityFirst}
        />
      </LazySection>
    );
  } catch (error) {
    return null;
  }
}

/** Hero stream: tải dữ liệu top trending độc lập */
async function HeroStream() {
  try {
    const heroTrending = await getTrendMovies('all');
    let finalHeroData: any[] = (heroTrending || []).slice(0, 5);
    
    // Nếu không có trending, tải backup nhẹ nhàng
    if (finalHeroData.length < 3) {
      const backup = await getMoviesList('phim-moi', { limit: 5 });
      finalHeroData = backup?.items || [];
    }
    
    return <AsyncHeroSection initialMovies={finalHeroData} />;
  } catch (error) {
    return null;
  }
}

export default function Home() {
  return (
    <main className="min-h-screen pb-16 bg-[#0a0a0a]">
      {/* Hero Section - Tải đầu tiên */}
      <Suspense fallback={heroSkeleton}>
        <HeroStream />
      </Suspense>

      <div className="w-full max-w-[1920px] mx-auto px-1.5 sm:px-3 md:px-5 lg:pl-20 relative z-20 pb-16">
        <div className="mb-6">
          <QuickNav />
        </div>

        {/* Top Trending - Tải độc lập */}
        <LazySection minHeight={280}>
          <Suspense fallback={<div className="h-[260px] bg-white/5 rounded-lg animate-pulse mx-4" />}>
            <AsyncTopTrendingHub />
          </Suspense>
        </LazySection>

        <div className="space-y-4 md:space-y-8">
          {/* Hàng phim tiếp diễn - Client Side nhẹ nhàng */}
          <LazySection minHeight={200}>
            <ContinueWatchingRow />
          </LazySection>

          {/* Group: Phim Mới */}
          <Suspense fallback={<div className="h-[380px] w-full animate-pulse bg-white/5 rounded-xl" />}>
            <HomeRowSection title="Phim Chiếu Rạp Mới" slug="phim-chieu-rap" viewAllHref="/danh-sach/phim-chieu-rap" priorityFirst={true} />
          </Suspense>

          <Suspense fallback={<div className="h-[380px] w-full animate-pulse bg-white/5 rounded-xl" />}>
            <HomeRowSection title="Phim Mới Cập Nhật" slug="phim-moi-cap-nhat" viewAllHref="/danh-sach/phim-moi" priorityFirst={true} />
          </Suspense>

          {/* Group: Quốc gia */}
          <Suspense fallback={<div className="h-[380px] w-full animate-pulse bg-white/5 rounded-xl" />}>
            <HomeRowSection title="Phim Hàn Quốc" slug="han-quoc" endpoint="quoc-gia" viewAllHref="/quoc-gia/han-quoc" />
          </Suspense>

          <Suspense fallback={<div className="h-[380px] w-full animate-pulse bg-white/5 rounded-xl" />}>
            <HomeRowSection title="Phim Trung Quốc" slug="trung-quoc" endpoint="quoc-gia" viewAllHref="/quoc-gia/trung-quoc" />
          </Suspense>

          {/* Group: Mới cập nhật khác */}
          <Suspense fallback={<div className="h-[380px] w-full animate-pulse bg-white/5 rounded-xl" />}>
            <HomeRowSection title="Phim Lẻ Mới" slug="phim-le" viewAllHref="/danh-sach/phim-le" />
          </Suspense>

          <Suspense fallback={<div className="h-[380px] w-full animate-pulse bg-white/5 rounded-xl" />}>
            <HomeRowSection title="Phim Bộ Mới" slug="phim-bo" viewAllHref="/danh-sach/phim-bo" />
          </Suspense>

          {/* Group: Thể loại */}
          <Suspense fallback={<div className="h-[380px] w-full animate-pulse bg-white/5 rounded-xl" />}>
            <HomeRowSection title="Phim Hành Động" slug="hanh-dong" endpoint="the-loai" viewAllHref="/the-loai/hanh-dong" />
          </Suspense>

          <Suspense fallback={<div className="h-[380px] w-full animate-pulse bg-white/5 rounded-xl" />}>
            <HomeRowSection title="Phim Hoạt Hình" slug="hoat-hinh" endpoint="the-loai" viewAllHref="/the-loai/hoat-hinh" />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

