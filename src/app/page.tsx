import { Suspense } from 'react';
import HeroSection from "@/components/HeroSection";
import MovieRow from "@/components/MovieRow";
import TopTrending from "@/components/TopTrending";
import QuickNav from "@/components/QuickNav";
import ContinueWatchingRow from "@/components/ContinueWatchingRow";
import TopicSection from "@/components/TopicSection";
import TopicCloud from "@/components/TopicCloud";
import { LazyLoadWrapper } from "@/components/LazyLoadWrapper";
import { getMoviesList, getTrendMovies, getMoviesByCountry, getMoviesByCategory } from "@/services/api";

export const revalidate = 3600;

// Reusable Async component for Rows
async function AsyncMovieRow({ title, type, slug, country, variant = 'default' }: { title: string, type?: string, slug?: string, country?: string, variant?: 'default' | 'sidebar' }) {
  let data: any = null;
  let viewAllSlug = "#";

  if (country) {
    data = await getMoviesByCountry(country, 1, 12);
    viewAllSlug = `/quoc-gia/${country}`;
  } else if (slug) {
    data = await getMoviesByCategory(slug, 1, 12);
    viewAllSlug = `/the-loai/${slug}`;
  } else if (type) {
    data = await getMoviesList(type, { limit: 12 });
    viewAllSlug = `/danh-sach/${type}`;
  }

  if (!data?.items?.length) return null;
  return <MovieRow title={title} movies={data.items} slug={viewAllSlug} variant={variant} />;
}

// Wrapper cho Sidebar Trending
async function AsyncTopTrending({ title, slug, type }: { title: string, slug: string, type: 'tv' | 'movie' }) {
  let data: any[] = await getTrendMovies(type).catch(() => []);

  // Backfill if empty
  if (data.length < 10) {
    const backup = await getMoviesList(type === 'tv' ? 'phim-bo' : 'phim-le', { limit: 10 });
    const sourceIds = new Set(data.map((m: any) => m._id));
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

export default async function Home() {
  // Fetch Hero + first above-fold row concurrently for faster FCP
  const [heroTrending, cinemaData] = await Promise.all([
    getTrendMovies('all').catch(() => []),
    getMoviesByCategory('phim-chieu-rap', 1, 12).catch(() => ({ items: [] })),
  ]);

  let finalHeroData: any[] = heroTrending.slice(0, 20);

  if (finalHeroData.length < 4) {
    // Nếu Hero fail, gọi fallback
    const [phimBo, phimLe] = await Promise.all([
      getMoviesList('phim-bo', { limit: 10 }),
      getMoviesList('phim-le', { limit: 10 })
    ]);
    const heroMixed: any[] = [];
    const maxLen = Math.max(phimBo.items?.length || 0, phimLe.items?.length || 0);
    for (let i = 0; i < maxLen; i++) {
      if (phimBo.items?.[i]) heroMixed.push(phimBo.items[i]);
      if (phimLe.items?.[i]) heroMixed.push(phimLe.items[i]);
    }
    finalHeroData = heroMixed.slice(0, 20);
  }

  return (
    <main className="min-h-screen pb-20 bg-[#0a0a0a]">
      {/* Hero Section */}
      <HeroSection movies={finalHeroData} />

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

            {/* First row: already fetched above-fold — NO LazyLoadWrapper, renders immediately */}
            {cinemaData?.items?.length ? (
              <MovieRow title="Phim Chiếu Rạp Mới" movies={cinemaData.items} slug="/the-loai/phim-chieu-rap" />
            ) : null}

            <LazyLoadWrapper fallback={<div className="h-64 bg-white/5 rounded-3xl animate-pulse" />}>
              <Suspense fallback={<div className="h-64 bg-white/5 rounded-3xl animate-pulse" />}>
                <AsyncMovieRow title="Phim Hàn Quốc" country="han-quoc" />
              </Suspense>
            </LazyLoadWrapper>

            <LazyLoadWrapper fallback={<div className="h-64 bg-white/5 rounded-3xl animate-pulse" />}>
              <Suspense fallback={<div className="h-64 bg-white/5 rounded-3xl animate-pulse" />}>
                <AsyncMovieRow title="Phim Trung Quốc" country="trung-quoc" />
              </Suspense>
            </LazyLoadWrapper>

            <LazyLoadWrapper fallback={<div className="h-64 bg-white/5 rounded-xl animate-pulse" />}>
              <Suspense fallback={<div className="h-64 bg-white/5 rounded-xl animate-pulse" />}>
                <AsyncMovieRow title="Phim Sắp Chiếu" type="phim-sap-chieu" />
              </Suspense>
            </LazyLoadWrapper>

            <LazyLoadWrapper fallback={<div className="h-64 bg-white/5 rounded-xl animate-pulse" />}>
              <Suspense fallback={<div className="h-64 bg-white/5 rounded-xl animate-pulse" />}>
                <AsyncMovieRow title="Phim Lẻ Mới" type="phim-le" />
              </Suspense>
            </LazyLoadWrapper>

            <LazyLoadWrapper fallback={<div className="h-64 bg-white/5 rounded-xl animate-pulse" />}>
              <Suspense fallback={<div className="h-64 bg-white/5 rounded-xl animate-pulse" />}>
                <AsyncMovieRow title="Phim Bộ Mới" type="phim-bo" />
              </Suspense>
            </LazyLoadWrapper>

            <LazyLoadWrapper fallback={<div className="h-64 bg-white/5 rounded-xl animate-pulse" />}>
              <Suspense fallback={<div className="h-64 bg-white/5 rounded-xl animate-pulse" />}>
                <AsyncMovieRow title="Phim Hành Động" slug="hanh-dong" />
              </Suspense>
            </LazyLoadWrapper>

            <LazyLoadWrapper fallback={<div className="h-64 bg-white/5 rounded-xl animate-pulse" />}>
              <Suspense fallback={<div className="h-64 bg-white/5 rounded-xl animate-pulse" />}>
                <AsyncMovieRow title="Hoạt Hình" type="hoat-hinh" />
              </Suspense>
            </LazyLoadWrapper>

            <LazyLoadWrapper fallback={<div className="h-64 bg-white/5 rounded-xl animate-pulse" />}>
              <Suspense fallback={<div className="h-64 bg-white/5 rounded-xl animate-pulse" />}>
                <AsyncMovieRow title="TV Shows" type="tv-shows" />
              </Suspense>
            </LazyLoadWrapper>
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

