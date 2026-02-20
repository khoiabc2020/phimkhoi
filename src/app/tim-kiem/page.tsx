import MovieCard from "@/components/MovieCard";
import FilterBar from "@/components/FilterBar";
import { searchMovies } from "@/services/api";
import { SearchX } from "lucide-react";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q: string; category?: string; country?: string; year?: string }> }) {
    const { q, category, country, year } = await searchParams;
    const keyword = q || "";
    const movies = await searchMovies(keyword);

    // Client-side filtering because search API doesn't support complex filters
    const filteredMovies = movies.filter((movie: any) => {
        if (category && category !== "all") {
            const hasCategory = movie.category?.some((c: any) => c.slug === category);
            if (!hasCategory) return false;
        }
        if (country && country !== "all") {
            const hasCountry = movie.country?.some((c: any) => c.slug === country);
            if (!hasCountry) return false;
        }
        if (year && year !== "all") {
            if (movie.year !== parseInt(year)) return false;
        }
        return true;
    });

    return (
        <main className="min-h-screen pb-20 bg-[#0a0a0a]">
            <div className="container mx-auto px-4 pt-24">
                <div className="mb-6">
                    <h1 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                        <span className="w-1 h-5 bg-[#fbbf24] rounded-full shadow-[0_0_10px_#fbbf24]"></span>
                        Kết quả: <span className="text-primary truncate max-w-[200px] md:max-w-md">"{keyword}"</span>
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Tìm thấy {filteredMovies.length} kết quả {movies.length !== filteredMovies.length && `(từ ${movies.length} phim gốc)`}
                    </p>

                    {/* Add Filter Bar */}
                    <div className="mt-6">
                        <FilterBar />
                    </div>
                </div>

                {filteredMovies.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3 md:gap-4 animate-in fade-in slide-in-from-bottom-5 duration-500">
                        {filteredMovies.map((movie: any) => (
                            <MovieCard key={movie._id} movie={movie} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 relative group">
                            <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                            <SearchX className="w-10 h-10 text-gray-500 group-hover:text-yellow-500 transition-colors duration-300 relative z-10" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Không tìm thấy phim này</h2>
                        <p className="text-gray-400 max-w-md mx-auto">
                            Rất tiếc, chúng tôi không tìm thấy kết quả nào phù hợp với từ khóa <span className="text-yellow-500">"{keyword}"</span>
                            {(category || country || year) && " và bộ lọc hiện tại"}.
                        </p>
                        <p className="text-gray-500 text-sm mt-4">
                            Hãy thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc.
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}
