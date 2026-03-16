import MovieCard from "@/components/MovieCard";
import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";
import { getMoviesByCategory } from "@/services/api";
import { Metadata } from "next";

// Revalidate mỗi 5 phút
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    return {
        title: `Phim ${slug} - Khôi Phim`,
        description: `Xem phim ${slug} mới nhất tại Khôi Phim.`,
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
            <div className="pt-24 w-full max-w-[1920px] mx-auto px-2 sm:px-4 md:px-8">
                <div className="mb-5 rounded-[10px] border border-white/[0.05] bg-[#09090c]/55 px-3 sm:px-4 py-3 sm:py-4">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-white/40 mb-1">
                        Thể loại
                    </p>
                    <h1 className="text-[18px] md:text-[22px] font-extrabold text-white capitalize flex items-center gap-2 tracking-tight">
                        <span className="w-1 h-5 bg-[#fbbf24] rounded-full"></span>
                        {slug.replace(/-/g, " ")}
                    </h1>
                </div>

                <div className="sticky top-[56px] z-20 bg-[#050507]/92 backdrop-blur-md rounded-[10px] px-1 border border-white/[0.05]">
                    <FilterBar />
                </div>

                {/* Optimized Grid for Mobile */}
                <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(140px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] xl:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] 2xl:grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-2 sm:gap-3 md:gap-4 mt-6 [contain:layout_paint]">
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
