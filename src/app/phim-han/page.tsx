import { Suspense } from "react";
import KoreaHero from "@/components/KoreaHero";
import MovieCard from "@/components/MovieCard";
import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";
import { getMoviesByCategory, getMenuData, getMoviesByCountry, Movie, getMovieDetail } from "@/services/api";
import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import MovieRow from "@/components/MovieRow";
import ActorRow from "@/components/ActorRow";
import LazySection from "@/components/LazySection";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
    const { countries } = await getMenuData();
    const country = countries.find(c => c.slug === "han-quoc");
    const countryName = country?.name || "Hàn Quốc";

    return {
        title: `Phim ${countryName} - KHOIPHIM`,
        description: `Xem hàng ngàn bộ phim ${countryName} hay nhất, chất lượng cao, vietsub chuẩn tại KHOIPHIM.`,
    };
}

const FEATURED_ACTORS = [
    { name: "Kim Ji-won", image: "https://image.tmdb.org/t/p/w300_and_h300_face/3qUaQG8W0lP9S6p2f3B0h9R6N5.jpg" },
    { name: "Ji Chang-wook", image: "https://image.tmdb.org/t/p/w300_and_h300_face/h8I79Gf7L3N9L6C5uUqQGfF9lqW.jpg" },
    { name: "Kim Yoo-jung", image: "https://image.tmdb.org/t/p/w300_and_h300_face/7qS7W8C5uUqQGfF9lqW8u9R6N5.jpg" },
    { name: "Kim Se-jeong", image: "https://image.tmdb.org/t/p/w300_and_h300_face/m9p0q1r2s3t4u5v6w7x8y9z0a1b.jpg" },
    { name: "Ahn Bo-hyun", image: "https://image.tmdb.org/t/p/w300_and_h300_face/k7X8v8K7X8v8K7X8v8K7X8v8K7X.jpg" },
];

async function PhimHanHome() {
    // Fetch multiple categories for Korea
    const [latest, romance, action, historical, animation, crime] = await Promise.all([
        getMoviesByCountry("han-quoc", 1, 14),
        getMoviesByCategory("tinh-cam", 1, 20),
        getMoviesByCategory("hanh-dong", 1, 20),
        getMoviesByCategory("co-trang", 1, 20),
        getMoviesByCategory("hoat-hinh", 1, 20),
        getMoviesByCategory("hinh-su", 1, 20),
    ]);

    const filterKorea = (movies: Movie[]) => movies.filter(m => m.country?.some(c => c.slug === "han-quoc"));

    return (
        <div className="space-y-12 md:space-y-16 pb-12">
            <LazySection minHeight={380} className="movie-row-standard">
                <MovieRow title="Phim Đang Chiếu" movies={latest.items} slug="/quoc-gia/han-quoc" priorityFirst />
            </LazySection>
            
            <LazySection minHeight={380} className="movie-row-standard">
                <MovieRow title="Phim Tình Cảm" movies={filterKorea(romance.items)} slug="/the-loai/tinh-cam" />
            </LazySection>
            
            <LazySection minHeight={380} className="movie-row-standard">
                <MovieRow title="Phim Hành Động" movies={filterKorea(action.items)} slug="/the-loai/hanh-dong" />
            </LazySection>

            <LazySection minHeight={380} className="movie-row-standard">
                <MovieRow title="Phim Cổ Trang" movies={filterKorea(historical.items)} slug="/the-loai/co-trang" />
            </LazySection>

            <LazySection minHeight={200} className="movie-row-landscape">
                <ActorRow title="Diễn viên nổi bật" actors={FEATURED_ACTORS} />
            </LazySection>

            <LazySection minHeight={380} className="movie-row-standard">
                <MovieRow title="Phim Hoạt Hình" movies={filterKorea(animation.items)} slug="/the-loai/hoat-hinh" />
            </LazySection>
            
            <LazySection minHeight={380} className="movie-row-standard">
                <MovieRow title="Phim Hình Sự" movies={filterKorea(crime.items)} slug="/the-loai/hinh-su" />
            </LazySection>

            {/* View All Button */}
            <div className="flex justify-center pt-8">
                <Link 
                    href="/phim-han?page=1"
                    className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-white font-bold transition-all hover:scale-105 active:scale-95"
                >
                    Xem tất cả phim
                </Link>
            </div>
        </div>
    );
}

async function CountryGridStream({ slug, page }: { slug: string; page: number }) {
    const data = await getMoviesByCountry(slug, page);
    
    if (!data.items || data.items.length === 0) {
        return <div className="py-20 text-center text-white/40">Không tìm thấy phim nào.</div>;
    }

    return (
        <div className="px-4 sm:px-6 md:px-12 lg:pl-24 lg:pr-12">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 mb-12">
                {data.items.map((movie: any) => (
                    <MovieCard key={movie._id} movie={movie} />
                ))}
            </div>
            <Suspense fallback={<div className="h-10 bg-white/5 rounded-lg animate-pulse" />}>
                <Pagination
                    currentPage={data.pagination.currentPage}
                    totalPages={data.pagination.totalPages}
                />
            </Suspense>
        </div>
    );
}

async function KoreaHeroWithData() {
    const HERO_SLUGS = [
        "nghe-thuat-lua-doi-cua-sarah",
        "khi-cuoc-doi-cho-ban-qua-quyt",
        "tieng-yeu-nay-anh-dich-duoc-khong",
        "ban-trai-theo-yeu-cau",
        "trao-em-ca-vu-tru"
    ];

    const movieDetails = await Promise.all(
        HERO_SLUGS.map(async (slug) => {
            const data = await getMovieDetail(slug);
            return data?.movie || null;
        })
    );

    return <KoreaHero initialMovies={movieDetails.filter(Boolean)} />;
}

export default async function PhimHanPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    const sParams = await searchParams;
    const currentPage = Number(sParams.page) || 1;
    const slug = "han-quoc";

    const menuData = await getMenuData();
    const categories = menuData?.categories || [];
    const countries = menuData?.countries || [];
    const country = countries.find(c => c.slug === slug);
    const countryName = country?.name || "Phim Hàn Quốc";

    return (
        <main className="min-h-screen pb-20 bg-[#000000]">
            {/* Immersive Hero Section - Flush to Top */}
            {currentPage === 1 && (
                <Suspense fallback={<div className="h-[500px] md:h-[600px] lg:h-[700px] xl:h-[800px] bg-black/50 animate-pulse" />}>
                    <KoreaHeroWithData />
                </Suspense>
            )}

            <div className={cn(
                "relative z-50",
                currentPage === 1 ? "" : "pt-24",
                "lg:pl-20"
            )}>
                {/* Decorative background glow */}
                <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-[#0e1621] via-transparent to-transparent pointer-events-none -z-10 blur-[120px]" />

                {currentPage === 1 ? (
                    <div className="-mt-4 md:-mt-8 lg:-mt-12 relative z-50 w-full">
                        <Suspense fallback={<div className="h-96 flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                            <PhimHanHome />
                        </Suspense>
                    </div>
                ) : (
                    <div className="w-full max-w-[1920px] mx-auto">
                         <div className="px-4 sm:px-6 md:px-12 lg:pl-24 lg:pr-12 mb-6 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="max-w-4xl">
                                <Link 
                                    href="/phim-han" 
                                    className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-[13px] font-medium transition-colors mb-4 group"
                                >
                                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                                    Quay lại Phim Hàn
                                </Link>
                                
                                <div className="space-y-1">
                                    <h1 className="text-[32px] md:text-[40px] lg:text-[48px] font-outfit font-extrabold text-white tracking-tighter leading-tight italic uppercase drop-shadow-lg">
                                        {countryName} <span className="text-primary/50 mx-2">/</span> Trang {currentPage}
                                    </h1>
                                </div>
                            </div>

                            <div className="w-full md:w-auto bg-[#0a0a0a]/80 backdrop-blur-md rounded-[12px] p-1 border border-white/[0.05] shadow-xl">
                                <Suspense fallback={<div className="w-32 h-8 bg-white/5 animate-pulse rounded" />}>
                                    <FilterBar categories={categories} countries={countries} />
                                </Suspense>
                            </div>
                        </div>

                        <Suspense key={`${slug}-${currentPage}`} fallback={<div className="px-12 grid grid-cols-7 gap-4">{Array.from({length: 14}).map((_, i) => <div key={i} className="aspect-[2/3] bg-white/5 animate-pulse rounded-lg"/>)}</div>}>
                            <CountryGridStream slug={slug} page={currentPage} />
                        </Suspense>
                    </div>
                )}
            </div>
        </main>
    );
}
