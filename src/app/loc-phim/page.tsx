import { getMoviesList, getMenuData } from "@/services/api";
import MovieCard from "@/components/MovieCard";
import { Suspense } from "react";
import Link from "next/link";
import { Filter, SlidersHorizontal, ChevronRight } from "lucide-react";
import FilterToolbar from "@/components/FilterToolbar";
import Pagination from "@/components/Pagination";
import { headers } from "next/headers";
import { getThemeBySlug } from "@/lib/theme";
import { cn } from "@/lib/utils";

interface FilterPageProps {
    searchParams: Promise<{
        category?: string;
        country?: string;
        year?: string;
        type?: string;
        page?: string;
    }>;
}

const YEARS = Array.from({ length: 16 }, (_, i) => (2025 - i).toString());
const TYPES = [
    { name: "Phim mới", slug: "phim-moi-cap-nhat" },
    { name: "Phim lẻ", slug: "phim-le" },
    { name: "Phim bộ", slug: "phim-bo" },
    { name: "Hoạt hình", slug: "hoat-hinh" },
    { name: "TV Shows", slug: "tv-shows" },
];

async function MovieGrid({ category, country, year, type, page, limit = 49 }: any) {
    const data = await getMoviesList(type || "phim-moi-cap-nhat", {
        category,
        country,
        year: year ? parseInt(year) : undefined,
        page: page ? parseInt(page) : 1,
        limit
    });

    const movies = data.items || [];

    if (movies.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <Filter className="w-10 h-10 text-white/20" />
                </div>
                <h3 className="text-xl font-bold mb-2">Không tìm thấy phim</h3>
                <p className="text-white/40 max-w-md">Hãy thử thay đổi bộ lọc để tìm kiếm kết quả khác nhé.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-12 w-full">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4">
                {movies.map((movie: any) => (
                    <div key={movie._id || movie.slug} className="animate-in fade-in duration-500">
                        <MovieCard movie={movie} />
                    </div>
                ))}
            </div>
            {data.pagination && data.pagination.totalPages > 1 && (
                <div className="w-full">
                    <Pagination 
                        currentPage={data.pagination.currentPage || parseInt(page || "1")} 
                        totalPages={Math.min(data.pagination.totalPages, 200)} 
                    />
                </div>
            )}
        </div>
    );
}

function LoadingSkeleton({ limit = 49 }: { limit?: number }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4">
            {Array.from({ length: limit }).map((_, i) => (
                <div key={i} className="space-y-3">
                    <div className="aspect-[2/3] w-full bg-white/5 rounded-xl animate-pulse" />
                    <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-white/5 rounded animate-pulse" />
                </div>
            ))}
        </div>
    );
}

export default async function AdvancedFilterPage({ searchParams }: FilterPageProps) {
    const sParams = await searchParams;
    const { categories, countries } = await getMenuData();
    const { page } = sParams;
    const theme = getThemeBySlug("loc-phim");

    const userAgent = (await headers()).get('user-agent') || '';
    const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
    const limit = isMobile ? 28 : 49;

    const buildUrl = (updates: Record<string, string | null>) => {
        const params = new URLSearchParams();
        Object.entries(sParams).forEach(([k, v]) => {
            if (v) params.set(k, v);
        });
        Object.entries(updates).forEach(([k, v]) => {
            if (v === null || v === "") params.delete(k);
            else params.set(k, v);
        });
        return `/loc-phim?${params.toString()}`;
    };

    return (
        <main className="min-h-screen bg-[#080b12] text-white relative overflow-hidden">
            {/* Decorative background glow */}
            <div className={cn("absolute top-0 left-0 right-0 h-[600px] via-transparent to-transparent pointer-events-none -z-10 blur-[150px] opacity-50", theme.glow)} />
            
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-24 md:pt-32 pb-20">
                {/* Header & Breadcrumb */}
                <div className="mb-8 md:mb-12">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-white/30 uppercase tracking-widest mb-4">
                        <Link href="/" className="hover:text-primary transition-colors">Trang chủ</Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-white/60">Lọc phim</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight flex items-center gap-4">
                            Lọc Phim Nâng Cao
                            <SlidersHorizontal className="w-8 h-8 md:w-10 md:h-10 text-primary opacity-50" />
                        </h1>
                    </div>
                </div>

                {/* Filter Toolbar */}
                <FilterToolbar 
                    searchParams={sParams}
                    categories={categories}
                    countries={countries}
                    years={YEARS}
                    types={TYPES}
                />

                {/* Results Grid */}
                <Suspense key={JSON.stringify(sParams)} fallback={<LoadingSkeleton limit={limit} />}>
                    <MovieGrid {...sParams} limit={limit} />
                </Suspense>
            </div>
        </main>
    );
}
