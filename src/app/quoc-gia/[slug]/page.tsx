import { Suspense } from "react";
import MovieCard from "@/components/MovieCard";
import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";
import { getMoviesByCountry, getMenuData } from "@/services/api";
import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

// Revalidate mỗi 5 phút
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const { countries } = await getMenuData();
    const country = countries.find(c => c.slug === slug);
    const countryName = country?.name || slug.replace(/-/g, " ");

    return {
        title: `Phim ${countryName} - KHOIPHIM`,
        description: `Xem phim ${countryName} mới nhất tại KHOIPHIM.`,
    };
}

import CountryGridClient from "@/components/CountryGridClient";

const GridSkeleton = () => (
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4 mt-6">
        {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-lg bg-white/5 animate-pulse" />
        ))}
    </div>
);

export default async function CountryPage({ 
    params, 
    searchParams 
}: { 
    params: Promise<{ slug: string }>, 
    searchParams: Promise<{ page?: string; category?: string; year?: string }> 
}) {
    const { slug } = await params;
    const sParams = await searchParams;
    const currentPage = Number(sParams.page) || 1;

    // Fetch menu data immediately for the shell
    const { categories, countries } = await getMenuData();

    // Resolve properly formatted name (with full diacritics)
    const country = countries.find(c => c.slug === slug);
    const countryName = country?.name || (slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " "));

    return (
        <main className="min-h-screen pb-20">
            <div className="pt-24 w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-12 lg:pl-24 lg:pr-12 relative">
                {/* Decorative background glow */}
                <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-[#0e1621] via-transparent to-transparent pointer-events-none -z-10 blur-[120px]" />

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
                            <span className="text-[#8FA7C5] text-xs font-bold uppercase tracking-[0.2em] opacity-80 pl-1">Quốc gia</span>
                            <h1 className="text-[32px] md:text-[40px] lg:text-[48px] font-outfit font-extrabold text-white tracking-tighter leading-tight italic uppercase drop-shadow-lg">
                                {countryName}
                            </h1>
                        </div>
                    </div>

                    <div className="w-full md:w-auto bg-[#0a0a0a]/80 backdrop-blur-md rounded-[12px] p-1 shadow-xl">
                        <Suspense fallback={<div className="w-32 h-8 bg-white/5 animate-pulse rounded" />}>
                            <FilterBar categories={categories} countries={countries} />
                        </Suspense>
                    </div>
                </div>

                <Suspense key={`${slug}-${currentPage}-${sParams.category || 'all'}-${sParams.year || 'all'}`} fallback={<GridSkeleton />}>
                    <CountryGridClient 
                        slug={slug} 
                        page={currentPage} 
                        category={sParams.category}
                        year={sParams.year}
                    />
                </Suspense>
            </div>
        </main>
    );
}
