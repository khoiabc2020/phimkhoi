import { getMenuData } from "@/services/api";
import Link from "next/link";
import { SlidersHorizontal, ChevronRight } from "lucide-react";
import FilterToolbar from "@/components/FilterToolbar";
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



export default async function AdvancedFilterPage({ searchParams }: FilterPageProps) {
    const sParams = await searchParams;
    const { categories, countries } = await getMenuData();
    const { page } = sParams;
    const theme = getThemeBySlug("loc-phim");
    const sort = sParams.sort;

    const userAgent = (await headers()).get('user-agent') || '';
    const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
    const limit = isMobile ? 28 : 49;

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white relative">
            {/* Onflix-style top banner */}
            <div className={cn("absolute top-0 inset-x-0 h-[60vh] bg-gradient-to-b to-transparent pointer-events-none", theme.banner)} />

            <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-4 md:px-8 lg:pl-24 lg:pr-12 pt-24 pb-20 relative z-10">
                {/* Header */}
                <div className="mb-6 md:mb-10">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-white/40 uppercase tracking-[0.15em] mb-3">
                        <Link href="/" className="hover:text-primary transition-colors">Trang chủ</Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-white/70">Khám Phá</span>
                    </div>
                    <h1 className="text-[26px] sm:text-[34px] md:text-[44px] font-outfit font-black text-white tracking-tight leading-none uppercase drop-shadow-lg flex items-center gap-3">
                        Duyệt Tìm Nâng Cao
                        <SlidersHorizontal className="w-7 h-7 md:w-9 md:h-9 text-primary opacity-30 shrink-0" />
                    </h1>
                    <p className="mt-2 text-white/35 text-[13px] font-medium">Khám phá hàng ngàn bộ phim đa dạng thể loại và quốc gia.</p>
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
