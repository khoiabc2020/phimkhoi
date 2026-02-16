import { Suspense } from 'react';
import HeroSection from "@/components/HeroSection";
import MovieRow from "@/components/MovieRow";
import TopTrending from "@/components/TopTrending";
import QuickNav from "@/components/QuickNav";
import ContinueWatchingRow from "@/components/ContinueWatchingRow";
import { getMoviesList, getTrendMovies } from "@/services/api";

// Revalidate every 60 seconds for real-time updates
export const revalidate = 60;

// Async Component for Row
// Async Component for Row
import { getMoviesByCategory, getMoviesByCountry } from "@/services/api";

async function AsyncMovieRow({ title, type, slug, country, variant = 'sidebar' }: { title: string, type?: string, slug?: string, country?: string, variant?: 'default' | 'sidebar' }) {
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
  // Fetch data in parallel
  const [phimBoData, phimLeData, trendTv, trendMovies] = await Promise.all([
    getMoviesList('phim-bo', { limit: 12 }),
    getMoviesList('phim-le', { limit: 12 }),
    getTrendMovies('tv'),    // Top Trending Series
    getTrendMovies('movie')  // Top Trending Movies (for the new section)
  ]);

  // Interleave for Hero
  const heroMovies: any[] = [];
  const maxLen = Math.max(phimBoData.items?.length || 0, phimLeData.items?.length || 0);

  for (let i = 0; i < maxLen; i++) {
    if (phimBoData.items?.[i]) heroMovies.push(phimBoData.items[i]);
    if (phimLeData.items?.[i]) heroMovies.push(phimLeData.items[i]);
  }

  // Top 20 for Hero
  const finalHeroData = heroMovies.slice(0, 20);

  // Ensure we have 10 items for Top Trending by backfilling with latest if needed
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

      <div className="space-y-12 relative z-20 pb-20 container mx-auto px-4 md:px-12 mt-12 md:mt-24">

        {/* Quick Navigation (Categories) */}
        <div className="relative z-30 -mt-10 md:-mt-20 mb-8">
          <QuickNav />
        </div>

        {/* Continue Watching */}
        <ContinueWatchingRow />

        {/* Top 10 Trending Series */}
        <TopTrending title="Top 10 Phim Bộ Hôm Nay" movies={finalTrendTv} slug="/danh-sach/phim-bo" />

        {/* Categories */}
        <Suspense fallback={<div className="h-64 bg-white/5 rounded-xl animate-pulse" />}>
          <AsyncMovieRow title="Phim Chiếu Rạp Mới" slug="phim-chieu-rap" />
        </Suspense>

        <Suspense fallback={<div className="h-64 bg-white/5 rounded-xl animate-pulse" />}>
          <AsyncMovieRow title="Phim Lẻ Mới Cập Nhật" type="phim-le" />
        </Suspense>

        <Suspense fallback={<div className="h-64 bg-white/5 rounded-xl animate-pulse" />}>
          <AsyncMovieRow title="Phim Bộ Mới Cập Nhật" type="phim-bo" />
        </Suspense>

        <Suspense fallback={<div className="h-64 bg-white/5 rounded-xl animate-pulse" />}>
          <AsyncMovieRow title="Phim Hàn Quốc Hot" country="han-quoc" />
        </Suspense>

        <Suspense fallback={<div className="h-64 bg-white/5 rounded-xl animate-pulse" />}>
          <AsyncMovieRow title="Phim Trung Quốc Hot" country="trung-quoc" />
        </Suspense>

        <Suspense fallback={<div className="h-64 bg-white/5 rounded-xl animate-pulse" />}>
          <AsyncMovieRow title="Hoạt Hình Mới Cập Nhật" type="hoat-hinh" />
        </Suspense>

        <Suspense fallback={<div className="h-64 bg-white/5 rounded-xl animate-pulse" />}>
          <AsyncMovieRow title="TV Shows Mới Cập Nhật" type="tv-shows" />
        </Suspense>

        <Suspense fallback={<div className="h-64 bg-white/5 rounded-xl animate-pulse" />}>
          <AsyncMovieRow title="Phim Sắp Chiếu" type="phim-sap-chieu" />
        </Suspense>
      </div>
    </main>
  );
}
