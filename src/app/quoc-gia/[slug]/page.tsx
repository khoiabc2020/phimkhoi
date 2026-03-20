import { Suspense } from "react";
import MovieCard from "@/components/MovieCard";
import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";
import { getMoviesByCountry, getMenuData } from "@/services/api";
import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

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

/** Stream component for the movie grid */
async function CountryGridStream({ 
    slug, 
    page 
}: { 
    slug: string; 
    page: number;
}) {
    const data = await getMoviesByCountry(slug, page);
    const { items, pagination } = data;

    if (!items || items.length === 0) {
        return (
            <div className="col-span-full text-center py-20 text-gray-400">
                Không tìm thấy phim nào cho quốc gia này.
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-2.5 md:gap-3 mt-6 [contain:layout_paint]">
                {items.map((movie: any, idx: number) => (
                    <MovieCard 
                        key={movie._id} 
                        movie={movie} 
                        priority={page === 1 && idx < 7}
                        loading={page === 1 && idx < 14 ? "eager" : "lazy"}
                    />
                ))}
            </div>

            {pagination && (
                <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                />
            )}
        </>
    );
}

const GridSkeleton = () => (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-2.5 md:gap-3 mt-6">
        {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-lg bg-white/5 animate-pulse" />
        ))}
    </div>
);

export default async function CountryPage({ params, searchParams }: { params: Promise<{ slug: string }>, searchParams: Promise<{ page?: string }> }) {
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
            <div className="pt-24 w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-12 relative">
                {/* Decorative background glow */}
                <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-[#0e1621] via-transparent to-transparent pointer-events-none -z-10 blur-[120px]" />

                <div className="mb-6 md:mb-10 max-w-4xl">
                    <Link 
                        href="/" 
                        className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-[13px] font-medium transition-colors mb-4 group"
                    >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        Quay lại
                    </Link>
                    
                    <div className="space-y-1">
                        <span className="text-[#8FA7C5] text-xs font-bold uppercase tracking-[0.2em] opacity-80 pl-1">Quốc gia</span>
                        <h1 className="text-[36px] md:text-[56px] font-outfit font-extrabold text-white tracking-tighter leading-none italic uppercase">
                            {countryName}
                        </h1>
                    </div>
                </div>

                <div className="relative z-10 sticky top-[64px] bg-[#0a0a0a]/80 backdrop-blur-md rounded-[12px] px-2 mb-6 border border-white/[0.05] shadow-xl shadow-black/20">
                    <FilterBar categories={categories} countries={countries} />
                </div>

                <Suspense key={`${slug}-${currentPage}`} fallback={<GridSkeleton />}>
                    <CountryGridStream slug={slug} page={currentPage} />
                </Suspense>
            </div>
        </main>
    );
}
