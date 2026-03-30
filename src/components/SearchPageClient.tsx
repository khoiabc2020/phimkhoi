"use client";

import { useMoviesInstant } from "@/hooks/useMoviesInstant";
import { searchMoviesAction, searchTMDBPersonAction } from "@/app/actions/search";
import MovieCard from "./MovieCard";
import { User, SearchX, Globe, Star } from "lucide-react";
import Link from "next/link";
import { useCallback, useState, useEffect } from "react";

export default function SearchPageClient({ 
    keyword,
    category,
    country,
    year,
    type,
    limit = 49
}: { 
    keyword: string;
    category?: string;
    country?: string;
    year?: string;
    type?: string;
    limit?: number;
}) {
    const [actors, setActors] = useState<any[]>([]);

    const fetcher = useCallback(async () => {
        // Parallel fetch movies and actors
        const [movies, actorsList] = await Promise.all([
            searchMoviesAction(keyword, { limit: 30, enrichTMDB: false }),
            keyword.length >= 3 ? searchTMDBPersonAction(keyword) : Promise.resolve([])
        ]);
        
        setActors(actorsList || []);
        
        // Return movies for the hook to cache
        return { items: movies || [], pagination: { currentPage: 1, totalPages: 1 } };
    }, [keyword, limit]);

    const cacheKey = `search_v2_${keyword}`;
    const { movies: rawMovies, isLoading } = useMoviesInstant(cacheKey, fetcher);

    // Client-side filtering — API doesn't support filter params
    const movies = rawMovies.filter((movie: any) => {
        if (category && category !== 'all') {
            const cats = Array.isArray(movie.category) ? movie.category : [];
            if (!cats.some((c: any) => c?.slug === category)) return false;
        }
        if (country && country !== 'all') {
            const countries = Array.isArray(movie.country) ? movie.country : [];
            if (!countries.some((c: any) => c?.slug === country)) return false;
        }
        if (year && year !== 'all') {
            if (String(movie.year) !== String(year)) return false;
        }
        if (type && type !== 'all') {
            if (movie.type !== type) return false;
        }
        return true;
    });

    const hasMovies = movies.length > 0;
    const hasActors = actors.length > 0;

    if (isLoading && movies.length === 0) {
        return (
            <div className="space-y-12">
                <div className="h-8 w-48 bg-white/5 animate-pulse rounded" />
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4 mt-6">
                    {Array.from({ length: 14 }).map((_, i) => (
                        <div key={i} className="aspect-[2/3] rounded-lg bg-white/5 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500">
            <div className="mb-6">
                <p className="text-gray-400 text-sm">
                    Tìm thấy {movies.length} phim {hasActors && `và ${actors.length} diễn viên`}
                </p>
                <div className="mt-3 flex items-center gap-2">
                    <span className="inline-flex items-center h-8 px-3 rounded-full bg-white/[0.08] border border-white/[0.10] text-white text-xs font-bold">
                        Phim ({movies.length})
                    </span>
                    {hasActors && (
                        <span className="inline-flex items-center h-8 px-3 rounded-full bg-[#0B0B10] border border-white/[0.08] text-gray-300 text-xs font-semibold">
                            Diễn viên ({actors.length})
                        </span>
                    )}
                </div>
            </div>

            {hasActors && (
                <div className="mb-10">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="w-1 h-5 bg-[#8FA7C5] rounded-full" />
                        <h2 className="text-base font-bold text-white">Diễn viên / Đạo diễn</h2>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none">
                        {actors.slice(0, 8).map((actor: any) => (
                            <Link
                                key={actor.id}
                                href={`/dien-vien/${actor.name.toLowerCase().replace(/ /g, "-")}`}
                                className="flex-shrink-0 flex flex-col items-center gap-2 group"
                            >
                                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-[#8FA7C5] transition-colors bg-white/5">
                                    {actor.profile_path ? (
                                        <img
                                            src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                                            alt={actor.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <User className="w-8 h-8 text-gray-500" />
                                        </div>
                                    )}
                                </div>
                                <div className="text-center max-w-[88px]">
                                    <p className="text-xs font-semibold text-white group-hover:text-[#c7d7ea] transition-colors truncate">
                                        {actor.name}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {hasMovies ? (
                <>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="w-1 h-5 bg-[#8FA7C5] rounded-full" />
                        <h2 className="text-base font-bold text-white">Phim kết quả</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4 mt-6">
                        {movies.map((movie, idx) => (
                            <MovieCard
                                key={movie._id || movie.slug}
                                movie={movie}
                                priority={idx < 7}
                                loading={idx < 14 ? "eager" : "lazy"}
                            />
                        ))}
                    </div>
                </>
            ) : !isLoading && !hasActors ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                        <SearchX className="w-10 h-10 text-gray-500" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Không tìm thấy kết quả nào</h2>
                    <p className="text-gray-400 max-w-md mx-auto">
                        Hãy thử với từ khóa khác hoặc điều chỉnh bộ lọc.
                    </p>
                </div>
            ) : null}
        </div>
    );
}
