import { Suspense } from 'react';
import HeroSection from "@/components/HeroSection";
import MovieRow from "@/components/MovieRow";
import TopTrending from "@/components/TopTrending";
import QuickNav from "@/components/QuickNav";
import ContinueWatchingRow from "@/components/ContinueWatchingRow";
import TopicSection from "@/components/TopicSection";
import TopicCloud from "@/components/TopicCloud";
import HomeSection from "@/components/HomeSection";
import LazySection from "@/components/LazySection";
import { getMoviesList, getTrendMovies, getHomeData, HOME_SECTION_SLUGS } from "@/services/api";
import { getTMDBDataForCard } from "@/app/actions/tmdb";

export const revalidate = 3600;

const heroSkeleton = <div className="w-full h-[60vh] md:h-[80vh] bg-[#020617] animate-pulse" />;
const contentSkeleton = (
  <div className="w-full max-w-[1920px] mx-auto px-4 md:px-12 py-8 space-y-8">
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

// Wrapper cho Sidebar Trending
async function AsyncTopTrending({ title, slug, type }: { title: string, slug: string, type: 'tv' | 'movie' }) {
  const data: any[] = await getTrendMovies(type).catch((): any[] => []);

  if (data.length < 10) {
    const backup = await getMoviesList(type === 'tv' ? 'phim-bo' : 'phim-le', { limit: 10 });
    const sourceIds = new Set(data.map((m: { _id?: string }) => m._id));
    for (const item of (backup?.items || [])) {
      if (data.length >= 10) break;
      if (!sourceIds.has(item._id)) {
        data.push(item);
        sourceIds.add(item._id);
      }
    }
  }

  if (!data?.length) return null;
  return <TopTrending title={title} movies={data.slice(0, 10)} slug={slug} className={type === 'movie' ? "mt-8" : ""} />;
}

async function AsyncHeroSection({ initialMovies }: { initialMovies: any[] }) {
  const enhancedHeroData = await Promise.all(
    initialMovies.map(async (movie) => {
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
    const home = await getHomeData();
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
  const homeData = await getHomeData();

  return (
    <div className="w-full max-w-[1920px] mx-auto px-4 md:px-12 relative z-20 pb-16">
      <div className="mb-6">
        <QuickNav />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        <div className="xl:col-span-9 space-y-12 md:space-y-14">
          <LazySection minHeight={360}>
            <HomeSection title="Đề xuất cho bạn">
              <ContinueWatchingRow />
              {homeData.phimChieuRap?.length ? (
                <MovieRow title="Phim Chiếu Rạp Mới" movies={homeData.phimChieuRap} slug={HOME_SECTION_SLUGS.phimChieuRap} />
              ) : null}
              {homeData.phimMoi?.length ? (
                <MovieRow title="Phim Mới Cập Nhật" movies={homeData.phimMoi.slice(0, 12)} slug={HOME_SECTION_SLUGS.phimMoi} />
              ) : null}
            </HomeSection>
          </LazySection>

          <LazySection minHeight={340}>
            <HomeSection title="Phim theo quốc gia" viewAllHref={HOME_SECTION_SLUGS.hanQuoc} viewAllLabel="Xem thêm">
              {homeData.hanQuoc?.length ? (
                <MovieRow title="Hàn Quốc" movies={homeData.hanQuoc.slice(0, 12)} slug={HOME_SECTION_SLUGS.hanQuoc} />
              ) : null}
              {homeData.trungQuoc?.length ? (
                <MovieRow title="Trung Quốc" movies={homeData.trungQuoc.slice(0, 12)} slug={HOME_SECTION_SLUGS.trungQuoc} />
              ) : null}
            </HomeSection>
          </LazySection>

          <LazySection minHeight={360}>
            <HomeSection title="Mới cập nhật" viewAllHref={HOME_SECTION_SLUGS.phimMoi}>
              {homeData.phimSapChieu?.length ? (
                <MovieRow title="Phim Sắp Chiếu" movies={homeData.phimSapChieu.slice(0, 12)} slug={HOME_SECTION_SLUGS.phimSapChieu} />
              ) : null}
              {homeData.phimLe?.length ? (
                <MovieRow title="Phim Lẻ Mới" movies={homeData.phimLe} slug={HOME_SECTION_SLUGS.phimLe} />
              ) : null}
              {homeData.phimBo?.length ? (
                <MovieRow title="Phim Bộ Mới" movies={homeData.phimBo} slug={HOME_SECTION_SLUGS.phimBo} />
              ) : null}
            </HomeSection>
          </LazySection>

          <LazySection minHeight={360}>
            <HomeSection title="Thể loại" viewAllHref={HOME_SECTION_SLUGS.hanhDong} viewAllLabel="Xem thêm">
              {homeData.hanhDong?.length ? (
                <MovieRow title="Hành Động" movies={homeData.hanhDong.slice(0, 12)} slug={HOME_SECTION_SLUGS.hanhDong} />
              ) : null}
              {homeData.tinhCam?.length ? (
                <MovieRow title="Tình Cảm" movies={homeData.tinhCam.slice(0, 12)} slug={HOME_SECTION_SLUGS.tinhCam} />
              ) : null}
              {homeData.hoatHinh?.length ? (
                <MovieRow title="Hoạt Hình" movies={homeData.hoatHinh.slice(0, 12)} slug={HOME_SECTION_SLUGS.hoatHinh} />
              ) : null}
              {homeData.tvShows?.length ? (
                <MovieRow title="TV Shows" movies={homeData.tvShows.slice(0, 12)} slug={HOME_SECTION_SLUGS.tvShows} />
              ) : null}
            </HomeSection>
          </LazySection>
        </div>

        <div className="xl:col-span-3 space-y-12">
          <LazySection minHeight={520}>
            <Suspense fallback={<div className="h-[600px] bg-white/5 rounded-lg animate-pulse" />}>
              <AsyncTopTrending title="Top Phim Bộ" slug="/danh-sach/phim-bo" type="tv" />
            </Suspense>
          </LazySection>

          <LazySection minHeight={220}>
            <TopicCloud />
          </LazySection>

          <LazySection minHeight={520}>
            <Suspense fallback={<div className="h-[600px] bg-white/5 rounded-lg animate-pulse mt-8" />}>
              <AsyncTopTrending title="Top Phim Lẻ" slug="/danh-sach/phim-le" type="movie" />
            </Suspense>
          </LazySection>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen pb-16 bg-[#080b12]">
      <Suspense fallback={heroSkeleton}>
        <HeroStream />
      </Suspense>

      <div className="relative z-20 -mt-6 md:-mt-10 lg:-mt-14 mb-4 pt-4 md:pt-6 bg-[#080b12]">
        <TopicSection />
      </div>

      <Suspense fallback={contentSkeleton}>
        <HomeContentStream />
      </Suspense>
    </main>
  );
}

