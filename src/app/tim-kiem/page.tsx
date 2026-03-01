import MovieCard from "@/components/MovieCard";
import FilterBar from "@/components/FilterBar";
import { searchMovies } from "@/services/api";
import { searchTMDBPerson } from "@/services/tmdb";
import { SearchX, User } from "lucide-react";
import Link from "next/link";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q: string; category?: string; country?: string; year?: string }> }) {
    const { q, category, country, year } = await searchParams;
    const keyword = q || "";

    // Fetch movies + actors concurrently for best performance
    const [movies, actors] = await Promise.all([
        searchMovies(keyword),
        keyword.length >= 2 ? searchTMDBPerson(keyword) : Promise.resolve([])
    ]);

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

    const hasActors = actors.length > 0;
    const hasMovies = filteredMovies.length > 0;

    return (
        <main className="min-h-screen pb-20 bg-[#0a0a0a]">
            <div className="container mx-auto px-4 pt-24">
                <div className="mb-6">
                    <h1 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                        <span className="w-1 h-5 bg-[#fbbf24] rounded-full"></span>
                        Kết quả: <span className="text-primary truncate max-w-[200px] md:max-w-md">"{keyword}"</span>
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Tìm thấy {filteredMovies.length} phim {hasActors && `và ${actors.length} diễn viên`}
                        {movies.length !== filteredMovies.length && ` (từ ${movies.length} phim gốc)`}
                    </p>

                    {/* Add Filter Bar */}
                    <div className="mt-6">
                        <FilterBar />
                    </div>
                </div>

                {/* Actor Results Section */}
                {hasActors && (
                    <div className="mb-10">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-1 h-5 bg-[#F4C84A] rounded-full"></span>
                            <h2 className="text-base font-bold text-white">Diễn viên / Đạo diễn</h2>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none">
                            {actors.map((actor: any) => {
                                const profileImg = actor.profile_path
                                    ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                                    : null;
                                const actorName = actor.name;

                                return (
                                    <Link
                                        key={actor.id}
                                        href={`/dien-vien/${encodeURIComponent(actorName)}`}
                                        className="flex-shrink-0 flex flex-col items-center gap-2 group"
                                    >
                                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-[#F4C84A] transition-colors bg-white/5">
                                            {profileImg ? (
                                                <img
                                                    src={profileImg}
                                                    alt={actorName}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <User className="w-8 h-8 text-gray-500" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-center max-w-[88px]">
                                            <p className="text-xs font-semibold text-white group-hover:text-[#F4C84A] transition-colors truncate">
                                                {actorName}
                                            </p>
                                            {actor.known_for_department && (
                                                <p className="text-[10px] text-gray-500 mt-0.5">
                                                    {actor.known_for_department === 'Acting' ? 'Diễn viên' : actor.known_for_department}
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Movie Results */}
                {hasMovies ? (
                    <>
                        {hasActors && (
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-1 h-5 bg-[#F4C84A] rounded-full"></span>
                                <h2 className="text-base font-bold text-white">Phim</h2>
                            </div>
                        )}
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3 md:gap-4 [contain:layout_paint]">
                            {filteredMovies.map((movie: any) => (
                                <MovieCard key={movie._id} movie={movie} />
                            ))}
                        </div>
                    </>
                ) : !hasActors ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                            <SearchX className="w-10 h-10 text-gray-500" />
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
                ) : null}
            </div>
        </main>
    );
}
