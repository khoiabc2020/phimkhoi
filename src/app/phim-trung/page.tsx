import { Suspense } from "react";
import ChinaHero from "@/components/ChinaHero";
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
import { detectOrientation, cn } from "@/lib/utils";
import { getThemeBySlug } from "@/lib/theme";

export async function generateMetadata(): Promise<Metadata> {
    const menuData = await getMenuData();
    const categories = menuData?.categories || [];
    const countries = menuData?.countries || [];
    const slug = "trung-quoc"; // Define slug here for metadata
    const country = countries.find(c => c.slug === slug);
    const countryName = country?.name || "Trung Quốc";

    return {
        title: `Phim ${countryName} - KHOIPHIM`,
        description: `Xem hàng ngàn bộ phim ${countryName} hay nhất, chất lượng cao, vietsub chuẩn tại KHOIPHIM.`,
    };
}

const FEATURED_ACTORS = [
    { name: "Tiêu Chiến", role: "Ngọc Cốt Dao", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/468n73j2sSJIbfZvsIZvDpvUaS8.jpg" },
    { name: "Vương Nhất Bác", role: "Trần Tình Lệnh", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/5akr656RvJX8hl1pa1qZckfiQeF.jpg" },
    { name: "Địch Lệ Nhiệt Ba", role: "Trường Ca Hành", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/bLa0rBHdZ4Su1l5Xh0cY4mTB70Z.jpg" },
    { name: "Triệu Lộ Tư", role: "Thần Ẩn", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/y82wmaDqTdXqvtasb4kxAIuT44U.jpg" },
    { name: "Cung Tuấn", role: "An Lạc Truyện", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/rtjBdEF61NySmDDnoDgAtuclAJJ.jpg" },
    { name: "Ngu Thư Hân", role: "Thương Lan Quyết", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/xQ2Bur9AEy0IX3qHMvLbr7tmTyD.jpg" },
    { name: "Dương Tử", role: "Trường Tương Tư", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/20Nc1xnRFC5XGsb896ZxVNUOzFU.jpg" },
    { name: "Hứa Khải", role: "Lạc Du Nguyên", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/f8I79Gf7L3N9L6C5uUqQGfF9lqW.jpg" },
    { name: "Cúc Tịnh Y", role: "Hoa Nhung", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/g8I79Gf7L3N9L6C5uUqQGfF9lqW.jpg" },
    { name: "Trần Tinh Húc", role: "Tinh Lạc Ngưng Thành Đường", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/f8I79Gf7L3N9L6C5uUqQGfF9lqW.jpg" },
];

async function PhimTrungHome() {
    // Fetch multiple categories for China
    const [latest, romance, action, historical, animation, crime, comedy, thriller] = await Promise.all([
        getMoviesByCountry("trung-quoc", 1, 14),
        getMoviesByCategory("tinh-cam", 1, 100),
        getMoviesByCategory("hanh-dong", 1, 100),
        getMoviesByCategory("co-trang", 1, 100),
        getMoviesByCategory("hoat-hinh", 1, 100),
        getMoviesByCategory("hinh-su", 1, 100),
        getMoviesByCategory("hai-huoc", 1, 100),
        getMoviesByCategory("kinh-di", 1, 100),
    ]);

    // Filter by country if needed (PhimAPI usually groups by category globally)
    const filterChina = (movies: Movie[]) => movies.filter(m => m.country?.some(c => c.slug === "trung-quoc"));

    return (
        <div className="space-y-12 md:space-y-16 pb-12">
            <LazySection minHeight={380} className="movie-row-standard">
                <MovieRow title="Phim Đang Chiếu" movies={latest.items} slug="/quoc-gia/trung-quoc" priorityFirst />
            </LazySection>
            
            <LazySection minHeight={380} className="movie-row-standard">
                <MovieRow title="Phim Tình Cảm" movies={filterChina(romance.items)} slug="/the-loai/tinh-cam" />
            </LazySection>

            <LazySection minHeight={380} className="movie-row-standard">
                <MovieRow title="Phim Hành Động" movies={filterChina(action.items)} slug="/the-loai/hanh-dong" />
            </LazySection>
            
            <LazySection minHeight={200} className="movie-row-landscape">
                <ActorRow title="Diễn viên nổi bật" actors={FEATURED_ACTORS} />
            </LazySection>

            <LazySection minHeight={380} className="movie-row-standard">
                <MovieRow title="Phim Cổ Trang" movies={filterChina(historical.items)} slug="/the-loai/co-trang" />
            </LazySection>

            <LazySection minHeight={380} className="movie-row-standard">
                <MovieRow title="Phim Hài Hước" movies={filterChina(comedy.items)} slug="/the-loai/hai-huoc" />
            </LazySection>

            <LazySection minHeight={380} className="movie-row-standard">
                <MovieRow title="Phim Kinh Dị" movies={filterChina(thriller.items)} slug="/the-loai/kinh-di" />
            </LazySection>

            <LazySection minHeight={380} className="movie-row-standard">
                <MovieRow title="Phim Hoạt Hình" movies={filterChina(animation.items)} slug="/the-loai/hoat-hinh" />
            </LazySection>
            
            <LazySection minHeight={380} className="movie-row-standard">
                <MovieRow title="Phim Hình Sự" movies={filterChina(crime.items)} slug="/the-loai/hinh-su" />
            </LazySection>

            {/* View All Button */}
            <div className="flex justify-center pt-8">
                <Link 
                    href="/phim-trung?page=1"
                    className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-white font-bold transition-all hover:scale-105 active:scale-95"
                >
                    Xem tất cả phim
                </Link>
            </div>
        </div>
    );
}

/** Legacy Grid Stream for Pagination pages */
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

async function ChinaHeroWithData() {
    const HERO_SLUGS = [
        "bach-nguyet-phan-tinh",
        "bui-hoa-hong",
        "dai-mong-quy-ly",
        "giang-ho-da-vu-thap-nien-dang",
        "mac-nhan-tang-kieu",
        "ngoc-minh-tra-cot",
        "con-ra-the-thong-gi-nua",
        "truc-ngoc",
        "xin-chao-1983",
        "duong-cung-ky-an-thanh-vu-phong-minh"
    ];

    const movieDetails = await Promise.all(
        HERO_SLUGS.map(async (slug) => {
            const data = await getMovieDetail(slug);
            return data?.movie || null;
        })
    );

    return <ChinaHero initialMovies={movieDetails.filter(Boolean)} />;
}

export default async function PhimTrungPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    const sParams = await searchParams;
    const currentPage = Number(sParams.page) || 1;
    const slug = "trung-quoc";
    const theme = getThemeBySlug(slug);

    const menuData = await getMenuData();
    const categories = menuData?.categories || [];
    const countries = menuData?.countries || [];
    const country = countries.find(c => c.slug === slug);
    const countryName = country?.name || "Phim Trung Quốc";

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
                    <ChinaHeroWithData />
                </Suspense>
            )}

            <div className={cn(
                "relative z-50",
                currentPage === 1 ? "" : "pt-24",
                "lg:pl-20" // Clear sidebar space
            )}>
                {/* Decorative background glow */}
                <div className={cn("absolute top-0 left-0 right-0 h-[600px] via-transparent to-transparent pointer-events-none -z-10 blur-[150px] opacity-50", theme.glow)} />

                {currentPage === 1 ? (
                    <div className="-mt-16 md:-mt-24 lg:-mt-32 xl:-mt-40 relative z-50 w-full">
                        <Suspense fallback={<div className="h-96 flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                            <PhimTrungHome />
                        </Suspense>
                    </div>
                ) : (
                    <div className="w-full max-w-[1920px] mx-auto">
                         <div className="px-4 sm:px-6 md:px-12 lg:pl-24 lg:pr-12 mb-6 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="max-w-4xl">
                                <Link 
                                    href="/phim-trung" 
                                    className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-[13px] font-medium transition-colors mb-4 group"
                                >
                                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                                    Quay lại Phim Trung
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
