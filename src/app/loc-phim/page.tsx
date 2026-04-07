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
import FilterGridClient from "@/components/FilterGridClient";

interface FilterPageProps {
    searchParams: Promise<{
        category?: string;
        country?: string;
        year?: string;
        type?: string;
        sort?: string;
        page?: string;
    }>;
}

const YEARS = Array.from({ length: 36 }, (_, i) => (2025 - i).toString()); // 1990–2025
const TYPES = [
    { name: "Phim mới", slug: "phim-moi-cap-nhat" },
    { name: "Phim lẻ", slug: "phim-le" },
    { name: "Phim bộ", slug: "phim-bo" },
    { name: "Hoạt hình", slug: "hoat-hinh" },
    { name: "TV Shows", slug: "tv-shows" },
];



function LoadingSkeleton({ limit = 49 }: { limit?: number }) {
    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4">
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
    const sort = sParams.sort;

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
        <main className="min-h-screen bg-[#080b12] text-white relative">
            {/* Decorative background glow */}
            <div className={cn("absolute top-0 left-0 right-0 h-[600px] via-transparent to-transparent pointer-events-none -z-10 blur-[150px] opacity-50", theme.glow)} />
            
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-20 md:pt-24 pb-24 md:pb-20">
                {/* Header — mobile: minimal 1-line title */}
                <div className="flex md:hidden items-center gap-2 mb-4">
                    <h1 className="text-[15px] font-bold text-white flex items-center gap-1.5">
                        Khám Phá
                        <SlidersHorizontal className="w-3.5 h-3.5 text-primary/50 shrink-0" />
                    </h1>
                </div>

                {/* Header — desktop: compact inline strip */}
                <div className="hidden md:flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white/30 uppercase tracking-wider shrink-0">
                            <Link href="/" className="hover:text-white/60 transition-colors">Trang chủ</Link>
                            <ChevronRight className="w-3 h-3" />
                            <span className="text-white/50">Khám Phá</span>
                        </div>
                        <span className="text-white/10 select-none">·</span>
                        <h1 className="text-[17px] font-bold text-white flex items-center gap-1.5 truncate">
                            Duyệt Tìm Nâng Cao
                            <SlidersHorizontal className="w-4 h-4 text-primary/40 shrink-0" />
                        </h1>
                    </div>
                    <p className="text-white/25 text-xs font-medium hidden lg:block shrink-0 ml-4">
                        Hàng ngàn bộ phim · Lọc theo thể loại, quốc gia, năm
                    </p>
                </div>

                {/* Filter Toolbar */}
                <FilterToolbar
                    searchParams={sParams}
                    categories={categories}
                    countries={countries}
                    years={YEARS}
                    types={TYPES}
                />

                <FilterGridClient {...sParams} sort={sort} limit={limit} />
            </div>
        </main>
    );
}
