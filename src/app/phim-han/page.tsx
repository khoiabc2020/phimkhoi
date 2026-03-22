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
    { name: "Kim Ji-won", role: "Nữ Hoàng Nước Mắt", image: "https://image.tmdb.org/t/p/w300_and_h450_face/lX7W1j9kg4jV6XNn5XEE3rKsd3x.jpg" },
    { name: "Ji Chang-wook", role: "Hậu Duệ Mặt Trời", image: "https://image.tmdb.org/t/p/w300_and_h450_face/sBmHrO5Tn27Ot5hy0yAKniROmNb.jpg" },
    { name: "Song Hye-kyo", role: "Vinh Quang Trong Hận Thù", image: "https://image.tmdb.org/t/p/w300_and_h450_face/3qUaQG8W0lP9S6p2f3B0h9R6N5.jpg" },
    { name: "Park Seo-joon", role: "Tầng Lớp Itaewon", image: "https://image.tmdb.org/t/p/w300_and_h450_face/96Y63pUf2bE486V02r2K5c0kFf3.jpg" },
    { name: "Han So-hee", role: "Dẫu Biết", image: "https://image.tmdb.org/t/p/w300_and_h450_face/6LPr0Bov63jS5s6Dk5W6F8G2Y1.jpg" },
    { name: "Lee Min-ho", role: "Quân Vương Bất Diệt", image: "https://image.tmdb.org/t/p/w300_and_h450_face/6LPr0Bov63jS5s6Dk5W6F8G2Y1.jpg" },
];

async function PhimHanHome() {
    // Fetch multiple categories for Korea
    const [action, romance, comedy, thriller] = await Promise.all([
        getMoviesByCategory("hanh-dong", 1, 60),
        getMoviesByCategory("tinh-cam", 1, 60),
        getMoviesByCategory("hai-huoc", 1, 60),
        getMoviesByCategory("kinh-di", 1, 60),
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
        <main className="min-h-screen pb-20 bg-[#0a0a0a]">
            {/* Immersive Hero Section - Flush to Top */}
            {currentPage === 1 && (
                <Suspense fallback={(
                    <div className="relative w-full aspect-[10/14] md:aspect-video lg:h-[80vh] flex items-center justify-center bg-black overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#111] via-[#0a0a0a] to-[#111] animate-pulse" />
                        <div className="relative z-10 w-full max-w-7xl px-8 flex flex-col gap-6">
                            <div className="h-16 w-64 bg-white/5 rounded-lg" />
                            <div className="h-8 w-48 bg-white/5 rounded-lg" />
                            <div className="flex gap-4">
                                <div className="h-14 w-40 bg-white/5 rounded-full" />
                                <div className="h-14 w-14 bg-white/5 rounded-full" />
                            </div>
                        </div>
                    </div>
                )}>
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
