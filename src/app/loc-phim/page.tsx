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
        <main className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
            {/* Decorative background glow */}
            <div className={cn("absolute top-0 left-0 right-0 h-[600px] via-transparent to-transparent pointer-events-none -z-10 blur-[150px] opacity-50", theme.glow)} />
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#8FA7C5]/5 blur-[130px] rounded-full pointer-events-none -z-10" />
            
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-24 md:pt-32 pb-20">
                {/* Header & Breadcrumb */}
                <div className="mb-10 md:mb-14 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center justify-center md:justify-start gap-2 text-[11px] font-bold text-white/40 uppercase tracking-[0.15em] mb-4">
                            <Link href="/" className="hover:text-primary transition-colors">Trang chủ</Link>
                            <ChevronRight className="w-3.5 h-3.5" />
                            <span className="text-white/80">Khám Phá</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight flex items-center justify-center md:justify-start gap-4">
                            Duyệt Tìm Nâng Cao
                            <SlidersHorizontal className="w-10 h-10 md:w-12 md:h-12 text-primary opacity-30" />
                        </h1>
                        <p className="mt-3 text-white/40 text-sm max-w-lg font-medium">Khám phá hàng ngàn bộ phim đa dạng thể loại và quốc gia. Tối ưu hóa trải nghiệm tìm kiếm của bạn.</p>
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

                <FilterGridClient {...sParams} sort={sort} limit={limit} />
            </div>
        </main>
    );
}
