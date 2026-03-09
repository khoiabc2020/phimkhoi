import { Suspense } from 'react';
import HeroSection from "@/components/HeroSection";
import MovieRow from "@/components/MovieRow";
import TopTrending from "@/components/TopTrending";
import QuickNav from "@/components/QuickNav";
import ContinueWatchingRow from "@/components/ContinueWatchingRow";
import TopicSection from "@/components/TopicSection";
import TopicCloud from "@/components/TopicCloud";
import { getMoviesList, getTrendMovies, getHomeData } from "@/services/api";
import { getTMDBDataForCard } from "@/app/actions/tmdb";

export const revalidate = 3600;

// Wrapper cho Sidebar Trending
async function AsyncTopTrending({ title, slug, type }: { title: string, slug: string, type: 'tv' | 'movie' }) {
  const data: any[] = await getTrendMovies(type).catch((): any[] => []);

  // Backfill if empty
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

// Server Component for fetching TMDB data asynchronously for the Hero Section
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

      return {
        ...movie,
        tmdbData: tmdbData || null
      };
    })
  );

  return <HeroSection movies={enhancedHeroData} />;
}

export default async function Home() {
  // Fetch Hero + Home Data concurrently for faster FCP
  const [heroTrending, homeData] = await Promise.all([
    getTrendMovies('all').catch((): any[] => []),
    getHomeData(),
  ]);

  let finalHeroData: any[] = heroTrending.slice(0, 5); // Limit hero to 5 items early on

  if (finalHeroData.length < 4) {
    // Nếu Hero fail, gọi fallback từ homeData
    const heroMixed: any[] = [];
    const phimBoItems = homeData.phimBo || [];
    const phimLeItems = homeData.phimLe || [];
    const maxLen = Math.max(phimBoItems.length, phimLeItems.length);
    for (let i = 0; i < maxLen; i++) {
      if (phimBoItems[i]) heroMixed.push(phimBoItems[i]);
      if (phimLeItems[i]) heroMixed.push(phimLeItems[i]);
    }
    finalHeroData = heroMixed.slice(0, 5);
  }

  return (
    <main className="min-h-screen pb-20">
      {/* Hero Section */}
      <Suspense fallback={<div className="w-full h-[60vh] md:h-[80vh] bg-neutral-900 animate-pulse" />}>
        <AsyncHeroSection initialMovies={finalHeroData} />
      </Suspense>

      {/* Interested Topics Section */}
      <div className="relative z-20 -mt-10 md:-mt-20 lg:-mt-24 mb-8">
        <TopicSection />
      </div>

      <div className="container mx-auto px-4 md:px-12 relative z-20 pb-20">
        <div className="mb-8">
          <QuickNav />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">

          {/* MAIN CONTENT */}
          <div className="xl:col-span-9 space-y-16">
            <ContinueWatchingRow />

            {/* Render rows directly from pre-fetched homeData (mượt mà, không giật lag, chuẩn SEO) */}
            {homeData.phimChieuRap?.length ? (
              <MovieRow title="Phim Chiếu Rạp Mới" movies={homeData.phimChieuRap} slug="/the-loai/phim-chieu-rap" />
            ) : null}

            {homeData.phimMoi?.length ? (
              <MovieRow title="Phim Mới Cập Nhật" movies={homeData.phimMoi.slice(0, 12)} slug="/danh-sach/phim-moi-cap-nhat" />
            ) : null}

            {homeData.hanQuoc?.length ? (
              <MovieRow title="Phim Hàn Quốc" movies={homeData.hanQuoc.slice(0, 12)} slug="/quoc-gia/han-quoc" />
            ) : null}

            {homeData.trungQuoc?.length ? (
              <MovieRow title="Phim Trung Quốc" movies={homeData.trungQuoc.slice(0, 12)} slug="/quoc-gia/trung-quoc" />
            ) : null}

            {homeData.phimSapChieu?.length ? (
              <MovieRow title="Phim Sắp Chiếu" movies={homeData.phimSapChieu.slice(0, 12)} slug="/danh-sach/phim-sap-chieu" />
            ) : null}

            {homeData.phimLe?.length ? (
              <MovieRow title="Phim Lẻ Mới" movies={homeData.phimLe.slice(0, 12)} slug="/danh-sach/phim-le" />
            ) : null}

            {homeData.phimBo?.length ? (
              <MovieRow title="Phim Bộ Mới" movies={homeData.phimBo.slice(0, 12)} slug="/danh-sach/phim-bo" />
            ) : null}

            {homeData.hanhDong?.length ? (
              <MovieRow title="Phim Hành Động" movies={homeData.hanhDong.slice(0, 12)} slug="/the-loai/hanh-dong" />
            ) : null}

            {homeData.hoatHinh?.length ? (
              <MovieRow title="Hoạt Hình" movies={homeData.hoatHinh.slice(0, 12)} slug="/danh-sach/hoat-hinh" />
            ) : null}

            {homeData.tvShows?.length ? (
              <MovieRow title="TV Shows" movies={homeData.tvShows.slice(0, 12)} slug="/danh-sach/tv-shows" />
            ) : null}
          </div>

          {/* SIDEBAR */}
          <div className="xl:col-span-3 space-y-12">
            <Suspense fallback={<div className="h-[600px] bg-white/5 rounded-xl animate-pulse" />}>
              <AsyncTopTrending title="Top Phim Bộ" slug="/danh-sach/phim-bo" type="tv" />
            </Suspense>

            <TopicCloud />

            <Suspense fallback={<div className="h-[600px] bg-white/5 rounded-xl animate-pulse mt-8" />}>
              <AsyncTopTrending title="Top Phim Lẻ" slug="/danh-sach/phim-le" type="movie" />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}

