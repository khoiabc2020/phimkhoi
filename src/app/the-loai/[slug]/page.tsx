import { Suspense } from "react";
import MovieCard from "@/components/MovieCard";
import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";
import { getMoviesByCategory, getMenuData } from "@/services/api";
import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getThemeBySlug } from "@/lib/theme";
import { cn } from "@/lib/utils";

// Revalidate mỗi 5 phút
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const { categories } = await getMenuData();
    const category = categories.find(c => c.slug === slug);
    const categoryName = category?.name || slug.replace(/-/g, " ");

    return {
        title: `Phim ${categoryName} - KHOIPHIM`,
        description: `Xem phim ${categoryName} mới nhất tại KHOIPHIM.`,
    };
}

import CategoryGridClient from "@/components/CategoryGridClient";

const GridSkeleton = () => (
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4 mt-6">
        {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-lg bg-white/5 animate-pulse" />
        ))}
    </div>
);

export default async function CategoryPage({
    params,
    searchParams
}: {
    params: Promise<{ slug: string }>,
    searchParams: Promise<{ page?: string; country?: string; year?: string }>
}) {
    const { slug } = await params;
    const sParams = await searchParams;
    const currentPage = Number(sParams.page) || 1;

    // Fetch menu data immediately for the shell
    const { categories, countries } = await getMenuData();

    // Resolve properly formatted name (with full diacritics)
    const category = categories.find(c => c.slug === slug);
    const categoryName = category?.name || (slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " "));

    const theme = getThemeBySlug(slug);

    const currentYear = new Date().getFullYear();
    const years = [
        ...Array.from({ length: 30 }, (_, i) => ({
            name: `${currentYear - i}`,
            slug: `${currentYear - i}`,
        })),
        { name: "2010s", slug: "2010" },
        { name: "2000s", slug: "2000" },
        { name: "1990s", slug: "1990" },
    ];

    return (
        <main className="min-h-screen pb-20">
            <div className="pt-24 w-full max-w-[1920px] mx-auto px-2 sm:px-6 md:px-12 lg:pl-24 lg:pr-12 relative">
                {/* Decorative background glow */}
                <div className={cn("absolute top-0 left-0 right-0 h-[500px] via-transparent to-transparent pointer-events-none -z-10 blur-[130px] opacity-60", theme.glow)} />

                <div className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="max-w-4xl">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-[13px] font-medium transition-colors mb-4 group"
                        >
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            Quay lại
                        </Link>

                        <div className="space-y-1">
                            <span className="text-[#8FA7C5] text-xs font-bold uppercase tracking-[0.2em] opacity-80 pl-1">{displayLabel}</span>
                            <h1 className="text-[32px] md:text-[40px] lg:text-[48px] font-bold text-white leading-tight">
                                {displayTitle}
                            </h1>
                        </div>
                    </div>

                    <div className="w-full md:w-auto bg-[#0a0a0a]/80 backdrop-blur-md rounded-[12px] p-1 shadow-xl">
                        <Suspense fallback={<div className="w-32 h-8 bg-white/5 animate-pulse rounded" />}>
                            <FilterBar categories={categories} countries={countries} years={years} hideCategory={!!category} hideCountry={!!country} />
                        </Suspense>
                    </div>
                </div>

                <Suspense key={`${slug}-${currentPage}-${sParams.country || 'all'}-${sParams.year || 'all'}`} fallback={<GridSkeleton />}>
                    <CategoryGridClient
                        slug={slug}
                        page={currentPage}
                        country={sParams.country}
                        year={sParams.year}
                    />
                </Suspense>
            </div>
        </main>
    );
}
