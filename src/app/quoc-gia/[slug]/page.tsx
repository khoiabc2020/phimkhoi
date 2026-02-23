import MovieCard from "@/components/MovieCard";
import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";
import { getMoviesByCountry } from "@/services/api";
import { Metadata } from "next";

// Revalidate every 60 seconds for real-time updates
export const revalidate = 60;

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
        <main className="min-h-screen pb-20 bg-[#0a0a0a]">
            <div className="pt-24 container mx-auto px-4 md:px-12">
                <div className="mb-8">
                    <h1 className="text-xl md:text-2xl font-bold text-white capitalize flex items-center gap-2">
                        <span className="w-1 h-6 bg-[#fbbf24] rounded-full shadow-[0_0_10px_#fbbf24]"></span>
                        Quốc gia: <span className="text-primary">{slug.replace(/-/g, " ")}</span>
                    </h1>
                </div>

                <FilterBar />

                {/* Optimized Grid for Mobile */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3 md:gap-4 mt-6 [contain:layout_paint]">
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
