"use client";

import { useMoviesInstant } from "@/hooks/useMoviesInstant";
import MovieCard from "./MovieCard";
import Pagination from "./Pagination";
import { useCallback } from "react";

interface MovieGridInstantProps {
    fetcher: () => Promise<{ items: any[]; pagination?: any }>;
    cacheKey: string;
    emptyMessage?: string;
    initialMovies?: any[];
    initialPagination?: any;
}

export default function MovieGridInstant({
    fetcher,
    cacheKey,
    emptyMessage = "Không tìm thấy phim nào.",
    initialMovies,
    initialPagination,
}: MovieGridInstantProps) {
    const { movies, pagination, isLoading } = useMoviesInstant(cacheKey, fetcher, initialMovies, initialPagination);

    if (isLoading && movies.length === 0) {
        return (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4 mt-6">
                {Array.from({ length: 14 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                        <div className="aspect-[2/3] w-full bg-white/[0.03] rounded-xl border border-white/[0.05] animate-pulse overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent" />
                        </div>
                        <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse" />
                        <div className="h-3 w-1/2 bg-white/5 rounded animate-pulse opacity-50" />
                    </div>
                ))}
            </div>
        );
    }

    if (movies.length === 0 && !isLoading) {
        return (
            <div className="col-span-full text-center py-20 text-gray-400">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="space-y-10">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4 mt-6 [contain:layout_paint]">
                {movies.map((movie, idx) => (
                    <MovieCard 
                        key={movie._id} 
                        movie={movie} 
                        priority={idx < 7}
                        loading={idx < 14 ? "eager" : "lazy"}
                    />
                ))}
            </div>

            {pagination && (
                <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                />
            )}
        </div>
    );
}
