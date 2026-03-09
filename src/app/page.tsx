import { Suspense } from 'react';
import HeroSection from "@/components/HeroSection";
import MovieRow from "@/components/MovieRow";
import TopTrending from "@/components/TopTrending";
import QuickNav from "@/components/QuickNav";
import ContinueWatchingRow from "@/components/ContinueWatchingRow";
import TopicSection from "@/components/TopicSection";
import TopicCloud from "@/components/TopicCloud";
import HomeSection from "@/components/HomeSection";
import { getMoviesList, getTrendMovies, getHomeData, HOME_SECTION_SLUGS } from "@/services/api";
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
    <main className="min-h-screen pb-16">
      {/* Hero Section */}
      <Suspense fallback={<div className="w-full h-[60vh] md:h-[80vh] bg-[#020617] animate-pulse" />}>
        <AsyncHeroSection initialMovies={finalHeroData} />
      </Suspense>

      {/* Interested Topics Section — giảm kéo lên trên mobile để không đè nút Xem ngay */}
      <div className="relative z-20 -mt-6 md:-mt-28 lg:-mt-32 mb-4">
        <TopicSection />
      </div>

      <div className="container mx-auto px-4 md:px-12 relative z-20 pb-16">
        <div className="mb-6">
          <QuickNav />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">

          {/* MAIN CONTENT — tổ chức theo đề mục kiểu rophim, mượt và rõ ràng */}
          <div className="xl:col-span-9 space-y-12 md:space-y-14">
            {/* Đề xuất cho bạn */}
            <HomeSection title="Đề xuất cho bạn">
              <ContinueWatchingRow />
              {homeData.phimChieuRap?.length ? (
                <MovieRow title="Phim Chiếu Rạp Mới" movies={homeData.phimChieuRap} slug={HOME_SECTION_SLUGS.phimChieuRap} />
              ) : null}
              {homeData.phimMoi?.length ? (
                <MovieRow title="Phim Mới Cập Nhật" movies={homeData.phimMoi.slice(0, 12)} slug={HOME_SECTION_SLUGS.phimMoi} />
              ) : null}
            </HomeSection>

            {/* Phim theo quốc gia */}
            <HomeSection title="Phim theo quốc gia" viewAllHref={HOME_SECTION_SLUGS.hanQuoc} viewAllLabel="Xem thêm">
              {homeData.hanQuoc?.length ? (
                <MovieRow title="Hàn Quốc" movies={homeData.hanQuoc.slice(0, 12)} slug={HOME_SECTION_SLUGS.hanQuoc} />
              ) : null}
              {homeData.trungQuoc?.length ? (
                <MovieRow title="Trung Quốc" movies={homeData.trungQuoc.slice(0, 12)} slug={HOME_SECTION_SLUGS.trungQuoc} />
              ) : null}
            </HomeSection>

            {/* Mới cập nhật */}
            <HomeSection title="Mới cập nhật" viewAllHref={HOME_SECTION_SLUGS.phimMoi}>
              {homeData.phimSapChieu?.length ? (
                <MovieRow title="Phim Sắp Chiếu" movies={homeData.phimSapChieu.slice(0, 12)} slug={HOME_SECTION_SLUGS.phimSapChieu} />
              ) : null}
              {homeData.phimLe?.length ? (
                <MovieRow title="Phim Lẻ Mới" movies={homeData.phimLe.slice(0, 12)} slug={HOME_SECTION_SLUGS.phimLe} />
              ) : null}
              {homeData.phimBo?.length ? (
                <MovieRow title="Phim Bộ Mới" movies={homeData.phimBo.slice(0, 12)} slug={HOME_SECTION_SLUGS.phimBo} />
              ) : null}
            </HomeSection>

            {/* Thể loại */}
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

