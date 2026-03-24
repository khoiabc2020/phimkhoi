import { Suspense } from "react";
import ChinaHero from "@/components/ChinaHero";
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
    { name: "Dương Tử", role: "Trường Tương Tư", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/uS80R3jOnm9Fm8k6P9uT8H6zF7x.jpg" },
    { name: "Hứa Khải", role: "Kháng Chiến Bút Mặc", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/n555fWjI0uVscG6S5Y0XnB7R5P0.jpg" },
    { name: "Cúc Tịnh Y", role: "Tiên Kiếm Kỳ Hiệp 4", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/jFf6pC5zS5s6E5vXf7G9u6W2zRr.jpg" },
    { name: "Trần Tinh Húc", role: "Người Phiên Dịch", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/pS7m1Gq7b5qWf0z9h8M6p2uX4u.jpg" },
    { name: "Trần Triết Viễn", role: "Vụng Trộm Không Thể Giấu", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/pS7m1Gq7b5qWf0z9h8M6p2uX4u.jpg" }, // Reuse for now or find better
    { name: "Vương Tử Kỳ", role: "Tình Yêu Thôi Mà", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/uS80R3jOnm9Fm8k6P9uT8H6zF7x.jpg" }
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

async function PhimTrungHome() {
    const latest = await getMoviesByCountry("trung-quoc", 1, 14);

    return (
        <div className="space-y-12 md:space-y-16 pb-12">
            <LazySection minHeight={380} className="movie-row-standard">
                <MovieRow title="Phim Đang Chiếu" movies={latest.items} slug="/quoc-gia/trung-quoc" priorityFirst />
            </LazySection>
            
            <Suspense fallback={<div className="h-[380px] bg-white/5 animate-pulse mx-12 rounded-xl" />}>
                <CountryMovieRow title="Phim Tình Cảm" categorySlug="tinh-cam" countrySlug="trung-quoc" />
            </Suspense>

            <Suspense fallback={<div className="h-[380px] bg-white/5 animate-pulse mx-12 rounded-xl" />}>
                <CountryMovieRow title="Phim Hành Động" categorySlug="hanh-dong" countrySlug="trung-quoc" />
            </Suspense>
            
            <LazySection minHeight={200} className="movie-row-landscape">
                <ActorRow title="Diễn viên nổi bật" actors={FEATURED_ACTORS} />
            </LazySection>

            <Suspense fallback={<div className="h-[380px] bg-white/5 animate-pulse mx-12 rounded-xl" />}>
                <CountryMovieRow title="Phim Cổ Trang" categorySlug="co-trang" countrySlug="trung-quoc" />
            </Suspense>

            <Suspense fallback={<div className="h-[380px] bg-white/5 animate-pulse mx-12 rounded-xl" />}>
                <CountryMovieRow title="Phim Hài Hước" categorySlug="hai-huoc" countrySlug="trung-quoc" />
            </Suspense>

            <Suspense fallback={<div className="h-[380px] bg-white/5 animate-pulse mx-12 rounded-xl" />}>
                <CountryMovieRow title="Phim Kinh Dị" categorySlug="kinh-di" countrySlug="trung-quoc" />
            </Suspense>

            <Suspense fallback={<div className="h-[380px] bg-white/5 animate-pulse mx-12 rounded-xl" />}>
                <CountryMovieRow title="Phim Hoạt Hình" categorySlug="hoat-hinh" countrySlug="trung-quoc" />
            </Suspense>
            
            <Suspense fallback={<div className="h-[380px] bg-white/5 animate-pulse mx-12 rounded-xl" />}>
                <CountryMovieRow title="Phim Hình Sự" categorySlug="hinh-su" countrySlug="trung-quoc" />
            </Suspense>
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

async function ChinaHeroWithData() {
    const HERO_SLUGS = [
        "bach-nguyet-phan-tinh",
        "bui-hoa-hong",
        "dai-mong-quy-ly",
        "giang-ho-da-vu-thap-nien-dang",
        "mac-nhan-tang-kieu",
        "ngoc-minh-tra-cot"
    ];

    const movieDetails = await Promise.all(
        HERO_SLUGS.map(async (slug) => {
            const data = await getMovieDetail(slug);
            return data?.movie || null;
        })
    );

    let filteredMovies = movieDetails.filter(Boolean);

    // [Hardening] Fallback to latest movies if featured slugs are missing
    if (filteredMovies.length === 0) {
        const fallback = await getMoviesByCountry("trung-quoc", 1, 8);
        filteredMovies = fallback.items;
    }

    return <ChinaHero initialMovies={filteredMovies} />;
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
                    <div className="relative w-full h-[500px] md:h-[600px] lg:h-[700px] xl:h-[800px] bg-black">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#111] to-[#0a0a0a]" />
                    </div>
                )}>
                    <ChinaHeroWithData />
                </Suspense>
            )}

            <div className={cn(
                "relative z-10", // Lowered z-index to stay below Header/Sidebar z-100
                currentPage === 1 ? "" : "pt-24",
                "lg:pl-20" // Clear sidebar space
            )}>
                {/* Decorative background glow */}
                <div className={cn("absolute top-0 left-0 right-0 h-[600px] via-transparent to-transparent pointer-events-none -z-10 blur-[150px] opacity-50", theme.glow)} />

                {currentPage === 1 ? (
                    <div className="-mt-10 md:-mt-16 lg:-mt-20 xl:-mt-24 relative z-50 w-full">
                        <Suspense fallback={<div className="h-96 flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                            <PhimTrungHome />
                        </Suspense>
                    </div>
                ) : (
                    <div className="w-full max-w-[1920px] mx-auto">
                         <div className="px-2 sm:px-6 md:px-12 lg:pl-24 lg:pr-12 mb-6 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
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
