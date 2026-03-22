import { Suspense } from "react";
import ChinaHero from "@/components/ChinaHero";
import MovieCard from "@/components/MovieCard";
import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";
import { getMoviesByCategory, getMenuData, getMoviesByCountry, Movie } from "@/services/api";
import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import MovieRow from "@/components/MovieRow";
import ActorRow from "@/components/ActorRow";

export async function generateMetadata(): Promise<Metadata> {
    const { countries } = await getMenuData();
    const country = countries.find(c => c.slug === "trung-quoc");
    const countryName = country?.name || "Trung Quốc";

    return {
        title: `Phim ${countryName} - KHOIPHIM`,
        description: `Xem hàng ngàn bộ phim ${countryName} hay nhất, chất lượng cao, vietsub chuẩn tại KHOIPHIM.`,
    };
}

const FEATURED_ACTORS = [
    { name: "Tiêu Chiến", image: "https://i.pinimg.com/736x/0a/6e/8b/0a6e8b5c5e0e0e0e0e0e0e0e0e0e0e0e.jpg" },
    { name: "Vương Nhất Bác", image: "https://i.pinimg.com/736x/8b/0a/6e/8b0a6e8b5c5e0e0e0e0e0e0e0e0e0e.jpg" },
    { name: "Triệu Lộ Tư", image: "https://i.pinimg.com/736x/6e/8b/0a/6e8b5c5e0e0e0e0e0e0e0e0e0e0e0e0e.jpg" },
    { name: "Ngu Thư Hân", image: "https://i.pinimg.com/736x/0e/8e/8e/0e8e8e5c5e0e0e0e0e0e0e0e0e0e0e.jpg" },
    { name: "Địch Lệ Nhiệt Ba", image: "https://i.pinimg.com/736x/5c/5e/0e/5c5e0e0e0e0e0e0e0e0e0e0e0e0e.jpg" },
    { name: "Dương Tử", image: "https://i.pinimg.com/736x/e0/e0/e0/e0e0e0e0e0e0e0e0e0e0e0e0e0e.jpg" },
    { name: "Hứa Khải", image: "https://i.pinimg.com/736x/a0/a0/a0/a0a0a0a0a0a0a0a0a0a0a0a0a0a0.jpg" },
    { name: "Cúc Tịnh Y", image: "https://i.pinimg.com/736x/b0/b0/b0/b0b0b0b0b0b0b0b0b0b0b0b0b0b0.jpg" },
    { name: "Trần Tinh Húc", image: "https://i.pinimg.com/736x/c0/c0/c0/c0/c0c0c0c0c0c0c0c0c0c0.jpg" },
];

async function PhimTrungHome() {
    // Fetch multiple categories for China
    const [latest, romance, action, historical] = await Promise.all([
        getMoviesByCountry("trung-quoc", 1, 14),
        getMoviesByCategory("tinh-cam", 1, 20),
        getMoviesByCategory("hanh-dong", 1, 20),
        getMoviesByCategory("co-trang", 1, 20),
    ]);

    // Filter by country if needed (PhimAPI usually groups by category globally)
    const filterChina = (movies: Movie[]) => movies.filter(m => m.country?.some(c => c.slug === "trung-quoc"));

    return (
        <div className="space-y-6 md:space-y-10 pb-12">
            <MovieRow title="Phim Đang Chiếu" movies={latest.items} slug="/quoc-gia/trung-quoc" priorityFirst />
            <MovieRow title="Phim Tình Cảm" movies={filterChina(romance.items)} slug="/the-loai/tinh-cam" />
            
            <ActorRow title="Diễn viên nổi bật" actors={FEATURED_ACTORS} />

            <MovieRow title="Phim Hành Động" movies={filterChina(action.items)} slug="/the-loai/hanh-dong" />
            <MovieRow title="Phim Cổ Trang" movies={filterChina(historical.items)} slug="/the-loai/co-trang" />
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
            <Pagination
                currentPage={data.pagination.currentPage}
                totalPages={data.pagination.totalPages}
            />
        </div>
    );
}

export default async function PhimTrungPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    const sParams = await searchParams;
    const currentPage = Number(sParams.page) || 1;
    const slug = "trung-quoc";

    const { categories, countries } = await getMenuData();
    const country = countries.find(c => c.slug === slug);
    const countryName = country?.name || "Phim Trung Quốc";

    return (
        <main className="min-h-screen pb-20 bg-[#000000]">
            {/* Immersive Hero Section - Flush to Top */}
            {currentPage === 1 && <ChinaHero />}

            <div className={currentPage === 1 ? "relative z-10" : "pt-24 relative z-10"}>
                {/* Decorative background glow */}
                <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-[#0e1621] via-transparent to-transparent pointer-events-none -z-10 blur-[120px]" />

                {currentPage === 1 ? (
                    <div className="pt-4 lg:pt-8 w-full">
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
                                <FilterBar categories={categories} countries={countries} />
                            </div>
                        </div>

                        <Suspense key={`${slug}-${currentPage}`} fallback={<div className="px-12 grid grid-cols-7 gap-4">{Array.from({length: 14}).map((_, i) => <div key={i} className="aspect-[2/3] bg-white/5 animate-pulse rounded-lg"/>)}</div>}>
                            <CountryGridStream slug={slug} page={currentPage} />
                        </Suspense>
                    </>
                )}
            </div>
        </main>
    );
}
