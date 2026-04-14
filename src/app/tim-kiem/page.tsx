import { Suspense } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import FilterBar from "@/components/FilterBar";
import { getThemeBySlug } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { getMenuData } from "@/services/api";
import SearchPageClient from "@/components/SearchPageClient";

export const metadata: Metadata = {
    title: "Tìm kiếm phim",
    description: "Tìm kiếm phim, diễn viên và nội dung tại KHOIPHIM.",
    robots: {
        index: false,
        follow: true,
    },
};

export default async function SearchPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
    const params = await searchParams;
    const keyword = params.keyword || "";
    const category = params.category;
    const country = params.country;
    const year = params.year;
    const type = params.type;

    const userAgent = (await headers()).get('user-agent') || '';
    const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
    const limit = isMobile ? 28 : 49;

    const { categories, countries } = await getMenuData();
    const theme = getThemeBySlug("tim-kiem");

    if (!keyword) {
        return (
            <main className="min-h-screen pt-24 pb-20 bg-[#0a0a0a] relative">
                <div className="w-full max-w-[1920px] mx-auto px-4 md:px-12 lg:pl-24 lg:pr-12">
                    <div className="text-center py-20">
                        <h1 className="text-2xl font-bold text-white mb-4">Nhập từ khóa để tìm kiếm</h1>
                        <p className="text-gray-400">Bạn có thể tìm kiếm theo tên phim, tên diễn viên hoặc đạo diễn.</p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen pb-20 bg-[#0a0a0a] relative">
            {/* Onflix-style top banner */}
            <div className={cn("absolute top-0 inset-x-0 h-[60vh] bg-gradient-to-b to-transparent pointer-events-none", theme.banner)} />

            <div className="pt-24 w-full max-w-[1920px] mx-auto px-3 sm:px-4 md:px-8 lg:pl-24 lg:pr-12 relative z-10">
                <div className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
                    <div>
                        <p className="text-[#8FA7C5] text-[10px] font-bold uppercase tracking-[0.22em] mb-2 opacity-70">
                            Kết quả tìm kiếm
                        </p>
                        <h1 className="text-[26px] sm:text-[34px] md:text-[44px] font-outfit font-black text-white tracking-tight leading-none drop-shadow-lg">
                            &ldquo;{keyword}&rdquo;
                        </h1>
                    </div>
                    <div className="shrink-0 overflow-visible relative z-20">
                        <Suspense fallback={<div className="w-32 h-8 bg-white/5 animate-pulse rounded" />}>
                            <FilterBar categories={categories} countries={countries} />
                        </Suspense>
                    </div>
                </div>

                <SearchPageClient 
                    keyword={keyword}
                    category={category}
                    country={country}
                    year={year}
                    type={type}
                    limit={limit}
                />
            </div>
        </main>
    );
}
