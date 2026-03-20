import { Suspense } from 'react';
import { cache } from "react";
import HeroSection from "@/components/HeroSection";
import MovieRow from "@/components/MovieRow";
import TopTrendingTabs from "@/components/TopTrendingTabs";
import QuickNav from "@/components/QuickNav";
import ContinueWatchingRow from "@/components/ContinueWatchingRow";

import HomeSection from "@/components/HomeSection";
import LazySection from "@/components/LazySection";
import { getMoviesList, getTrendMovies, getHomeData, HOME_SECTION_SLUGS } from "@/services/api";
import { getTMDBDataForCard } from "@/app/actions/tmdb";

export const revalidate = 3600;
const ROW_LIMIT = 10;
const getCachedHomeData = cache(getHomeData);

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

/** Hero stream: chỉ đợi getTrendMovies, không chờ getHomeData → FCP nhanh */
async function HeroStream() {
  const heroTrending = await getTrendMovies('all').catch((): any[] => []);
  let finalHeroData: any[] = (heroTrending || []).slice(0, 5);
  if (finalHeroData.length < 4) {
    const home = await getCachedHomeData();
    const heroMixed: any[] = [];
    const len = Math.max((home.phimBo || []).length, (home.phimLe || []).length);
    for (let i = 0; i < len; i++) {
      if (home.phimBo?.[i]) heroMixed.push(home.phimBo[i]);
      if (home.phimLe?.[i]) heroMixed.push(home.phimLe[i]);
    }
    finalHeroData = heroMixed.slice(0, 5);
  }
  return <AsyncHeroSection initialMovies={finalHeroData} />;
}

/** Nội dung trang chủ: đợi getHomeData (cache 20 phút) → stream khi xong */
async function HomeContentStream() {
  const homeData = await getCachedHomeData();

  return (
    <div className="w-full max-w-[1920px] mx-auto px-1.5 sm:px-3 md:px-5 lg:pl-20 relative z-20 pb-16">
      <div className="mb-6">
        <QuickNav />
      </div>
      <LazySection minHeight={280}>
        <Suspense fallback={<div className="h-[260px] bg-white/5 rounded-lg animate-pulse" />}>
          <AsyncTopTrendingHub />
        </Suspense>
      </LazySection>
      <div className="space-y-10 md:space-y-12">
        <LazySection minHeight={360}>
          <HomeSection title="Đề xuất cho bạn">
            <ContinueWatchingRow />
            {homeData.phimChieuRap?.length ? (
              <MovieRow title="Phim Chiếu Rạp Mới" movies={homeData.phimChieuRap.slice(0, ROW_LIMIT)} slug={HOME_SECTION_SLUGS.phimChieuRap} />
            ) : null}
            {homeData.phimMoi?.length ? (
              <MovieRow title="Phim Mới Cập Nhật" movies={homeData.phimMoi.slice(0, ROW_LIMIT)} slug={HOME_SECTION_SLUGS.phimMoi} />
            ) : null}
          </HomeSection>
        </LazySection>

        <LazySection minHeight={340}>
          <HomeSection title="Phim theo quốc gia" viewAllHref={HOME_SECTION_SLUGS.hanQuoc} viewAllLabel="Xem thêm">
            {homeData.hanQuoc?.length ? (
              <MovieRow title="Hàn Quốc" movies={homeData.hanQuoc.slice(0, ROW_LIMIT)} slug={HOME_SECTION_SLUGS.hanQuoc} />
            ) : null}
            {homeData.trungQuoc?.length ? (
              <MovieRow title="Trung Quốc" movies={homeData.trungQuoc.slice(0, ROW_LIMIT)} slug={HOME_SECTION_SLUGS.trungQuoc} />
            ) : null}
          </HomeSection>
        </LazySection>

        <LazySection minHeight={360}>
          <HomeSection title="Mới cập nhật" viewAllHref={HOME_SECTION_SLUGS.phimMoi}>
            {homeData.phimSapChieu?.length ? (
              <MovieRow title="Phim Sắp Chiếu" movies={homeData.phimSapChieu.slice(0, ROW_LIMIT)} slug={HOME_SECTION_SLUGS.phimSapChieu} />
            ) : null}
            {homeData.phimLe?.length ? (
              <MovieRow title="Phim Lẻ Mới" movies={homeData.phimLe.slice(0, ROW_LIMIT)} slug={HOME_SECTION_SLUGS.phimLe} />
            ) : null}
            {homeData.phimBo?.length ? (
              <MovieRow title="Phim Bộ Mới" movies={homeData.phimBo.slice(0, ROW_LIMIT)} slug={HOME_SECTION_SLUGS.phimBo} />
            ) : null}
          </HomeSection>
        </LazySection>

        <LazySection minHeight={360}>
          <HomeSection title="Thể loại" viewAllHref={HOME_SECTION_SLUGS.hanhDong} viewAllLabel="Xem thêm">
            {homeData.hanhDong?.length ? (
              <MovieRow title="Hành Động" movies={homeData.hanhDong.slice(0, ROW_LIMIT)} slug={HOME_SECTION_SLUGS.hanhDong} />
            ) : null}
            {homeData.tinhCam?.length ? (
              <MovieRow title="Tình Cảm" movies={homeData.tinhCam.slice(0, ROW_LIMIT)} slug={HOME_SECTION_SLUGS.tinhCam} />
            ) : null}
            {homeData.hoatHinh?.length ? (
              <MovieRow title="Hoạt Hình" movies={homeData.hoatHinh.slice(0, ROW_LIMIT)} slug={HOME_SECTION_SLUGS.hoatHinh} />
            ) : null}
            {homeData.tvShows?.length ? (
              <MovieRow title="TV Shows" movies={homeData.tvShows.slice(0, ROW_LIMIT)} slug={HOME_SECTION_SLUGS.tvShows} />
            ) : null}
          </HomeSection>
        </LazySection>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen pb-16 bg-[#0a0a0a]">
      <Suspense fallback={heroSkeleton}>
        <HeroStream />
      </Suspense>



      <Suspense fallback={contentSkeleton}>
        <HomeContentStream />
      </Suspense>
    </main>
  );
}

