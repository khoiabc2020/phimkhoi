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

      <div className="container mx-auto px-4 md:px-12 mt-8 md:mt-16 relative z-20 pb-20">

        {/* Quick Navigation (Categories) - Optional: Move below Hero or keep here */}
        <div className="mb-8">
          <QuickNav />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

          {/* MAIN CONTENT (Left - 9 cols) */}
          <div className="xl:col-span-9 space-y-10">

            {/* Continue Watching */}
            <ContinueWatchingRow />

            {/* Hot Sections */}
            <Suspense fallback={<div className="h-64 bg-white/5 rounded-xl animate-pulse" />}>
              <AsyncMovieRow title="Phim Chiếu Rạp Mới" slug="phim-chieu-rap" />
            </Suspense>

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
          <div className="xl:col-span-3 space-y-8">

            {/* Top Trending - Phim Bộ (Series) */}
            <TopTrending
              title="Top Phim Bộ"
              movies={finalTrendTv}
              slug="/danh-sach/phim-bo"
            />

            {/* Top Trending - Phim Lẻ (Movies) */}
            <TopTrending
              title="Top Phim Lẻ"
              movies={finalTrendMovies}
              slug="/danh-sach/phim-le"
              className="mt-8"
            />

            {/* Phim Sắp Chiếu (Vertical List) */}
            <Suspense fallback={<div className="h-64 bg-white/5 rounded-xl animate-pulse" />}>
              <div className="bg-[#111] p-4 rounded-xl border border-white/5">
                <h3 className="text-[#fbbf24] font-bold text-lg mb-4 uppercase flex items-center gap-2">
                  <span className="w-1 h-5 bg-[#fbbf24] rounded-full text-transparent">.</span>
                  Phim S sắp chiếu
                </h3>
                <div className="space-y-3">
                  {/* Re-use AsyncMovieRow but we might need a specific 'sidebar' variant for rendering vertical list. 
                                 For now, standard AsyncMovieRow renders a horizontal slider which might break layout in sidebar.
                                 Let's stick to placing full width rows in main area and specific trending lists in sidebar.
                             */}
                  {/* Since AsyncMovieRow returns a MovieRow (slider), it's not suitable for Sidebar unless modified.
                                 I'll leave 'Phim Sắp Chiếu' in the main column for now if I can't easily switch it to vertical.
                              */}
                </div>
                {/* Fallback simply putting Sắp Chiếu back to Main or hidden for now in sidebar until we have a SidebarRow component */}
              </div>
            </Suspense>

            {/* Genre Tags Cloud (Static for visual density) */}
            <div className="bg-[#111] p-5 rounded-xl border border-white/5">
              <h3 className="text-white font-bold text-base mb-4 uppercase">Từ khóa hot</h3>
              <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                {['Hành động', 'Tình cảm', 'Cổ trang', 'Kinh dị', 'Viễn tưởng', 'Hàn Quốc', 'Anime', 'Netflix'].map(tag => (
                  <span key={tag} className="bg-white/5 hover:bg-[#fbbf24] hover:text-black px-3 py-1.5 rounded-full transition-colors cursor-pointer border border-white/5">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
