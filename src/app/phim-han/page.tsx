import { Suspense } from "react";
import KoreaHero from "@/components/KoreaHero";
import MovieCard from "@/components/MovieCard";
import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";
import { getMoviesByCategory, getMenuData, getMoviesByCountry, Movie, getMovieDetail, getMoviesList, getMoviesByCountryAndCategory } from "@/services/api";
import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import MovieRow from "@/components/MovieRow";
import ActorRow from "@/components/ActorRow";
import LazySection from "@/components/LazySection";
import { detectOrientation, cn } from "@/lib/utils";
import { getThemeBySlug } from "@/lib/theme";

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
    { name: "Kim Soo-hyun", role: "Nữ Hoàng Nước Mắt", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/q24P4pmtWGhe08T7rTkoDc5EC1p.jpg" },
    { name: "Kim Ji-won", role: "Nữ Hoàng Nước Mắt", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/lX7W1j9kg4jV6XNn5XEE3rKsd3x.jpg" },
    { name: "Ji Chang-wook", role: "Chào mừng tới Samdal-ri", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/sBmHrO5Tn27Ot5hy0yAKniROmNb.jpg" },
    { name: "Song Hye-kyo", role: "Vinh Quang Trong Hận Thù", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/tlAX3f82Mf5h0rznpVBVK7nD2om.jpg" },
    { name: "Hyun Bin", role: "Hạ Cánh Nơi Anh", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/JQFzhO9j8HRiyr7leGPj6cqhvM.jpg" },
    { name: "Son Ye-jin", role: "Hạ Cánh Nơi Anh", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/pR3QiJKcMBG7oseZUnnU54lgU1V.jpg" },
    { name: "Gong Yoo", role: "Yêu Tinh (Goblin)", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/ocGoFb6TrK3uWGXt4WnuibUG1vD.jpg" },
    { name: "Bae Suzy", role: "Khởi Nghiệp (Start-up)", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/xdmQeM0UuwVGyZucc3eLhynlb7b.jpg" },
    { name: "Lee Jung-jae", role: "Trò Chơi Con Mực", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/lx8oiTXL9lIx78KOXlrlvNfoz43.jpg" },
    { name: "Jun Ji-hyun", role: "Vì Sao Đưa Anh Tới", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/pM5U2KH8RmuV1F7RsoE7Pn6AyhP.jpg" },
    { name: "Song Joong-ki", role: "Hậu Duệ Mặt Trời", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/kgjb5OppOVTh5tz3hhnfDVnTvDv.jpg" },
    { name: "Park Shin-hye", role: "Người Thừa Kế", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/pumaPD2AtInYXXYsLirfFdYa4yc.jpg" },
];

async function CountryMovieRow({ title, categorySlug, countrySlug, variant = 'default', minHeight = 380 }: { title: string; categorySlug: string; countrySlug: string; variant?: 'default' | 'sidebar'; minHeight?: number }) {
    // Ưu tiên filter từ MovieCountry (lấy mẫu lớn 450 phim) để đảm bảo 100% phim thuộc đúng Quốc Gia (Hàn/Trung)
    const data = await getMoviesByCountryAndCategory(countrySlug, categorySlug, 32);
    const filteredMovies = data.items;
    
    return (
        <LazySection minHeight={minHeight} className={variant === 'sidebar' ? "movie-row-sidebar" : "movie-row-standard"}>
            <MovieRow title={title} movies={filteredMovies} slug={`/the-loai/${categorySlug}`} variant={variant} />
        </LazySection>
    );
}

async function PhimHanHome() {
    const latest = await getMoviesByCountry("han-quoc", 1, 14);

    return (
        <div className="space-y-12 md:space-y-16 pb-12">
            <LazySection minHeight={380} className="movie-row-standard">
                <MovieRow title="Phim Mới Cập Nhật" movies={latest.items} slug="/quoc-gia/han-quoc" priorityFirst />
            </LazySection>
            
            <Suspense fallback={<div className="h-[380px] bg-white/5 animate-pulse mx-12 rounded-xl" />}>
                <CountryMovieRow title="Phim Tình Cảm" categorySlug="tinh-cam" countrySlug="han-quoc" />
            </Suspense>
            
            <Suspense fallback={<div className="h-[380px] bg-white/5 animate-pulse mx-12 rounded-xl" />}>
                <CountryMovieRow title="Phim Hành Động" categorySlug="hanh-dong" countrySlug="han-quoc" />
            </Suspense>

            <Suspense fallback={<div className="h-[380px] bg-white/5 animate-pulse mx-12 rounded-xl" />}>
                <CountryMovieRow title="Phim Cổ Trang" categorySlug="co-trang" countrySlug="han-quoc" />
            </Suspense>

            <LazySection minHeight={200} className="movie-row-landscape">
                <ActorRow title="Diễn viên nổi bật" actors={FEATURED_ACTORS} />
            </LazySection>

            <Suspense fallback={<div className="h-[380px] bg-white/5 animate-pulse mx-12 rounded-xl" />}>
                <CountryMovieRow title="Phim Hài Hước" categorySlug="hai-huoc" countrySlug="han-quoc" />
            </Suspense>

            <Suspense fallback={<div className="h-[380px] bg-white/5 animate-pulse mx-12 rounded-xl" />}>
                <CountryMovieRow title="Phim Kinh Dị" categorySlug="kinh-di" countrySlug="han-quoc" />
            </Suspense>

            <Suspense fallback={<div className="h-[380px] bg-white/5 animate-pulse mx-12 rounded-xl" />}>
                <CountryMovieRow title="Phim Hoạt Hình" categorySlug="hoat-hinh" countrySlug="han-quoc" />
            </Suspense>
            
            <Suspense fallback={<div className="h-[380px] bg-white/5 animate-pulse mx-12 rounded-xl" />}>
                <CountryMovieRow title="Phim Hình Sự" categorySlug="hinh-su" countrySlug="han-quoc" />
            </Suspense>
        </div>
    );
}

async function CountryGridStream({ slug, page }: { slug: string; page: number }) {
    const data = await getMoviesByCountry(slug, page);
    
    if (!data.items || data.items.length === 0) {
        return <div className="py-20 text-center text-white/40">Không tìm thấy phim nào.</div>;
    }

    return (
        <div className="px-2 sm:px-6 md:px-12 lg:pl-24 lg:pr-12">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4 mb-12">
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
    const theme = getThemeBySlug(slug);

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
                    <div className="relative w-full h-[500px] md:h-[600px] lg:h-[700px] xl:h-[800px] bg-black">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#111] to-[#0a0a0a]" />
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
                <div className={cn("absolute top-0 left-0 right-0 h-[600px] via-transparent to-transparent pointer-events-none -z-10 blur-[150px] opacity-50", theme.glow)} />

                {currentPage === 1 ? (
                    <div className="-mt-4 md:-mt-8 lg:-mt-10 xl:-mt-12 relative z-50 w-full">
                        <Suspense fallback={<div className="h-96 flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                            <PhimHanHome />
                        </Suspense>
                    </div>
                ) : (
                    <div className="w-full max-w-[1920px] mx-auto">
                         <div className="px-2 sm:px-6 md:px-12 lg:pl-24 lg:pr-12 mb-6 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
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
