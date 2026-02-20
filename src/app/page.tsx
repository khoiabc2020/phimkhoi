import { Suspense } from 'react';
import HeroSection from "@/components/HeroSection";
import MovieRow from "@/components/MovieRow";
import TopTrending from "@/components/TopTrending";
import QuickNav from "@/components/QuickNav";
import ContinueWatchingRow from "@/components/ContinueWatchingRow";
import TopicSection from "@/components/TopicSection";
import TopicCloud from "@/components/TopicCloud";
import { getMoviesList, getTrendMovies, getMoviesByCountry } from "@/services/api";
import { getTMDBTrending } from "@/services/tmdb";

// Revalidate every hour - TMDB trending updates daily
export const revalidate = 3600;

// Async Component for Row
import { getMoviesByCategory } from "@/services/api";

async function AsyncMovieRow({ title, type, slug, country, variant = 'default' }: { title: string, type?: string, slug?: string, country?: string, variant?: 'default' | 'sidebar' }) {
  let data: any = null;
  let viewAllSlug = "#";

  if (country) {
    data = await getMoviesByCountry(country, 1, 12);
    viewAllSlug = `/quoc-gia/${country}`;
  } else if (slug) {
    // If it's a category (like phim-chieu-rap)
    data = await getMoviesByCategory(slug, 1, 12);
    viewAllSlug = `/the-loai/${slug}`;
  } else if (type) {
    // Standard lists (phim-le, phim-bo, tv-shows, hoat-hinh, phim-sap-chieu)
    data = await getMoviesList(type, { limit: 12 });
    viewAllSlug = `/danh-sach/${type}`;
  }

  if (!data?.items?.length) return null;

  return <MovieRow title={title} movies={data.items} slug={viewAllSlug} variant={variant} />;
}

export default async function Home() {
  // Fetch data in parallel: TMDB trending for hero + section data
  const [heroTrending, phimBoData, phimLeData, trendTv, trendMovies, hanQuocData, trungQuocData] = await Promise.all([
    getTrendMovies('all').catch(() => []),    // TMDB trending -> matched KKPHIM movies
    getMoviesList('phim-bo', { limit: 12 }),
    getMoviesList('phim-le', { limit: 12 }),
    getTrendMovies('tv').catch(() => []),     // Top Trending Series (sidebar)
    getTrendMovies('movie').catch(() => []),  // Top Trending Movies (sidebar)
    getMoviesByCountry('han-quoc', 1, 10),
    getMoviesByCountry('trung-quoc', 1, 10)
  ]);

  // Hero: TMDB trending is primary. Fallback to interleaved if empty.
  let finalHeroData: any[] = heroTrending.slice(0, 20);

  if (finalHeroData.length < 4) {
    // Fallback: interleave phimBo + phimLe
    const heroMixed: any[] = [];
    const maxLen = Math.max(phimBoData.items?.length || 0, phimLeData.items?.length || 0);
    for (let i = 0; i < maxLen; i++) {
      if (phimBoData.items?.[i]) heroMixed.push(phimBoData.items[i]);
      if (phimLeData.items?.[i]) heroMixed.push(phimLeData.items[i]);
    }
    finalHeroData = heroMixed.slice(0, 20);
  }

  // Ensure we have 10 items for Top Trending by backfilling
  const fillList = (source: any[], backup: any[], limit: number) => {
    const sourceIds = new Set(source.map(m => m._id));
    const filled = [...source];

    for (const item of backup) {
      if (filled.length >= limit) break;
      if (!sourceIds.has(item._id)) {
        filled.push(item);
        sourceIds.add(item._id);
      }
    }
    return filled.slice(0, limit);
  };

  const finalTrendTv = fillList(trendTv, phimBoData.items || [], 10);
  const finalTrendMovies = fillList(trendMovies, phimLeData.items || [], 10);

  return (
    <main className="min-h-screen pb-20 bg-[#0a0a0a]">
      {/* Hero Section */}
      <HeroSection movies={finalHeroData} />

      {/* Interested Topics Section */}
      <div className="relative z-20 -mt-10 md:-mt-20 lg:-mt-24 mb-8">
        <TopicSection />
      </div>

      <div className="container mx-auto px-4 md:px-12 relative z-20 pb-20">

        {/* Quick Navigation (Categories) */}
        <div className="mb-8">
          <QuickNav />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">

          {/* MAIN CONTENT (Left - 9 cols) */}
          <div className="xl:col-span-9 space-y-20">

            {/* Continue Watching */}
            <ContinueWatchingRow />

            {/* Hot Sections */}
            <Suspense fallback={<div className="h-64 bg-white/5 rounded-3xl animate-pulse" />}>
              <AsyncMovieRow title="Phim Chiếu Rạp Mới" slug="phim-chieu-rap" />
            </Suspense>

            {/* Country Specific Sections */}
            {hanQuocData?.items?.length > 0 && (
              <MovieRow title="Phim Hàn Quốc Mới" movies={hanQuocData.items} slug="/quoc-gia/han-quoc" />
            )}

            {trungQuocData?.items?.length > 0 && (
              <MovieRow title="Phim Trung Quốc Mới" movies={trungQuocData.items} slug="/quoc-gia/trung-quoc" />
            )}

            <Suspense fallback={<div className="h-64 bg-white/5 rounded-xl animate-pulse" />}>
              <AsyncMovieRow title="Phim Sắp Chiếu" type="phim-sap-chieu" />
            </Suspense>

            <Suspense fallback={<div className="h-64 bg-white/5 rounded-xl animate-pulse" />}>
              <AsyncMovieRow title="Phim Lẻ Mới Cập Nhật" type="phim-le" />
            </Suspense>

            <Suspense fallback={<div className="h-64 bg-white/5 rounded-xl animate-pulse" />}>
              <AsyncMovieRow title="Phim Bộ Mới Cập Nhật" type="phim-bo" />
            </Suspense>

            <Suspense fallback={<div className="h-64 bg-white/5 rounded-xl animate-pulse" />}>
              <AsyncMovieRow title="Phim Hành Động Hot" slug="hanh-dong" />
            </Suspense>

            <Suspense fallback={<div className="h-64 bg-white/5 rounded-xl animate-pulse" />}>
              <AsyncMovieRow title="Phim Tình Cảm Lãng Mạn" slug="tinh-cam" />
            </Suspense>

            <Suspense fallback={<div className="h-64 bg-white/5 rounded-xl animate-pulse" />}>
              <AsyncMovieRow title="Hoạt Hình - Anime" type="hoat-hinh" />
            </Suspense>

            <Suspense fallback={<div className="h-64 bg-white/5 rounded-xl animate-pulse" />}>
              <AsyncMovieRow title="TV Shows" type="tv-shows" />
            </Suspense>
          </div>

          {/* SIDEBAR (Right - 3 cols) */}
          <div className="xl:col-span-3 space-y-12">

            {/* Top Trending - Phim Bộ (Series) */}
            <TopTrending
              title="Top Phim Bộ"
              movies={finalTrendTv}
              slug="/danh-sach/phim-bo"
            />

            {/* Genre Tags Cloud */}
            <TopicCloud />

            {/* Top Trending - Phim Lẻ (Movies) */}
            <TopTrending
              title="Top Phim Lẻ"
              movies={finalTrendMovies}
              slug="/danh-sach/phim-le"
              className="mt-8"
            />

            {/* Phim Sắp Chiếu (Vertical List) */}
            <Suspense fallback={<div className="h-64 bg-white/5 rounded-xl animate-pulse" />}>
              <div className="bg-[#111] p-4 rounded-xl border border-white/5 hidden xl:block">
                <h3 className="text-[#fbbf24] font-bold text-lg mb-4 uppercase flex items-center gap-2">
                  <span className="w-1 h-5 bg-[#fbbf24] rounded-full text-transparent">.</span>
                  Phim sắp chiếu
                </h3>
                <div className="space-y-3">
                  {/* Placeholder for sidebar content or ad */}
                  <div className="text-gray-500 text-xs text-center py-4">
                    Danh sách đang cập nhật...
                  </div>
                </div>
              </div>
            </Suspense>

          </div>
        </div>
      </div>
    </main>
  );
}
