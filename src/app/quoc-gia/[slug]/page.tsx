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

export default async function CountryPage({ params, searchParams }: { params: Promise<{ slug: string }>, searchParams: Promise<{ page?: string }> }) {
    const { slug } = await params;
    const { page } = await searchParams;
    const currentPage = Number(page) || 1;

    // Fetch movies and menu data in parallel
    const [data, menuData] = await Promise.all([
        getMoviesByCountry(slug, currentPage),
        getMenuData()
    ]);

    const { items, pagination } = data;
    const { categories, countries } = menuData;

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
                    
                    <h1 className="text-[32px] md:text-[52px] font-outfit font-extrabold text-white tracking-tight leading-[1.1]">
                        <span className="text-white/40 block text-lg md:text-xl font-medium tracking-normal mb-1">Quốc gia</span>
                        {countryName}
                    </h1>
                </div>

                <div className="relative z-10 sticky top-[56px] bg-[#0a0a0a]/80 backdrop-blur-md rounded-[12px] px-2 mb-6 border border-white/[0.05] shadow-xl shadow-black/20">
                    <FilterBar categories={categories} countries={countries} />
                </div>

                {/* Optimized Grid for Mobile */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-2.5 md:gap-3 mt-6 [contain:layout_paint]">
                    {items?.length > 0 ? (
                        items.map((movie: any) => (
                            <MovieCard key={movie._id} movie={movie} />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20 text-gray-400">
                            Không tìm thấy phim nào cho quốc gia này.
                        </div>
                    )}
                </div>

                {pagination && (
                    <Pagination
                        currentPage={pagination.currentPage}
                        totalPages={pagination.totalPages}
                    />
                )}
            </div>
        </main>
    );
}
