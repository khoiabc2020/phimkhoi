import MovieCard from "@/components/MovieCard";
import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";
import { getMoviesByCategory } from "@/services/api";
import { Metadata } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

// Revalidate mỗi 5 phút
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    return {
        title: `Phim ${slug} - KHOIPHIM`,
        description: `Xem phim ${slug} mới nhất tại KHOIPHIM.`,
    };
}

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>, searchParams: Promise<{ page?: string }> }) {
    const { slug } = await params;
    const { page } = await searchParams;
    const currentPage = Number(page) || 1;

    // Fetch movies by category
    const data = await getMoviesByCategory(slug, currentPage);

    const { items, pagination } = data;

    return (
        <main className="min-h-screen pb-20">
            <div className="pt-24 w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-12 relative">
                {/* Decorative background glow to match Image 4 */}
                <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none -z-10 blur-[100px]" />

                <div className="mb-8 md:mb-12">
                    <Link 
                        href="/" 
                        className="flex items-center gap-1.5 text-white/50 hover:text-white text-[13px] font-medium transition-colors mb-3 group"
                    >
                        <ChevronDown className="w-4 h-4 rotate-90 group-hover:-translate-x-0.5 transition-transform" />
                        Quay lại
                    </Link>
                    
                    <h1 className="text-[28px] md:text-[42px] font-black text-white tracking-tight leading-tight">
                        Thể loại: <span className="text-white/90 capitalize">{slug.replace(/-/g, " ")}</span>
                    </h1>
                </div>

                <div className="relative z-10 md:sticky md:top-[56px] md:z-20 bg-[#0a0a0a]/92 backdrop-blur-md rounded-[10px] px-1 border border-white/[0.06]">
                    <FilterBar />
                </div>

                {/* Optimized Grid for Mobile */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-2.5 md:gap-3 mt-6 [contain:layout_paint]">
                    {items?.length > 0 ? (
                        items.map((movie: any) => (
                            <MovieCard key={movie._id} movie={movie} />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20 text-gray-400">
                            Không tìm thấy phim nào cho thể loại này.
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
