import MovieCard from "@/components/MovieCard";
import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";
import { getMoviesByCountry } from "@/services/api";
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

export default async function CountryPage({ params, searchParams }: { params: Promise<{ slug: string }>, searchParams: Promise<{ page?: string }> }) {
    const { slug } = await params;
    const { page } = await searchParams;
    const currentPage = Number(page) || 1;

    // Fetch movies by country
    const data = await getMoviesByCountry(slug, currentPage);

    const { items, pagination } = data;

    return (
        <main className="min-h-screen pb-20">
            <div className="pt-24 w-full max-w-[1920px] mx-auto px-2 sm:px-4 md:px-8">
                <div className="mb-5 rounded-[10px] border border-white/[0.06] bg-[#07070b]/78 px-3 sm:px-4 py-3 sm:py-3.5 shadow-[0_8px_20px_#00000055]">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-white/40 mb-1">
                        Quốc gia
                    </p>
                    <h1 className="text-[20px] md:text-[26px] font-extrabold text-white capitalize flex items-center gap-2 tracking-tight">
                        <span className="w-1 h-5 bg-[#8FA7C5] rounded-full"></span>
                        {slug.replace(/-/g, " ")}
                    </h1>
                </div>

                <div className="relative z-10 md:sticky md:top-[56px] md:z-20 bg-[#050507]/92 backdrop-blur-md rounded-[10px] px-1 border border-white/[0.06]">
                    <FilterBar />
                </div>

                {/* Optimized Grid for Mobile */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2 sm:gap-2.5 md:gap-3 mt-6 [contain:layout_paint]">
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
