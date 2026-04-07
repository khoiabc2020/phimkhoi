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
            <main className="min-h-screen pt-24 pb-24 md:pb-16 bg-[#0a0a0a] relative overflow-hidden">
                <div className="pt-24 w-full max-w-[1920px] mx-auto px-4 md:px-12 lg:pl-24 lg:pr-12">
                    <div className="text-center py-20">
                        <h1 className="text-2xl font-bold text-white mb-4">Nhập từ khóa để tìm kiếm</h1>
                        <p className="text-gray-400">Bạn có thể tìm kiếm theo tên phim, tên diễn viên hoặc đạo diễn.</p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen pb-24 md:pb-16 bg-[#0a0a0a] relative overflow-hidden">
            {/* Decorative background glow */}
            <div className={cn("absolute top-0 left-0 right-0 h-[600px] via-transparent to-transparent pointer-events-none -z-10 blur-[150px] opacity-50", theme.glow)} />
            
            <div className="pt-24 w-full max-w-[1920px] mx-auto px-4 md:px-12 lg:pl-24 lg:pr-12">
                <div className="mb-6 rounded-[12px] border border-white/[0.06] bg-white/[0.03] backdrop-blur-md p-4 md:p-5 shadow-xl transition-all">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="space-y-1">
                            <p className="text-[#8FA7C5] text-[11px] font-bold uppercase tracking-[0.2em] opacity-80 pl-1">
                                Kết quả tìm kiếm cho
                            </p>
                            <h1 className="text-[30px] md:text-[40px] font-outfit font-extrabold text-white tracking-tighter leading-tight uppercase drop-shadow-lg truncate max-w-[500px]">
                                "{keyword}"
                            </h1>
                        </div>
                        
                        <div className="flex flex-col items-end gap-3 flex-1">
                            <div className="w-full md:w-auto">
                                <Suspense fallback={<div className="w-32 h-8 bg-white/5 animate-pulse rounded" />}>
                                    <FilterBar categories={categories} countries={countries} />
                                </Suspense>
                            </div>
                        </div>
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
