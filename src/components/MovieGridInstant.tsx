"use client";

import { useMoviesInstant } from "@/hooks/useMoviesInstant";
import MovieCard from "./MovieCard";
import Pagination from "./Pagination";
import { useCallback } from "react";

interface MovieGridInstantProps {
    fetcher: () => Promise<{ items: any[]; pagination?: any }>;
    cacheKey: string;
    emptyMessage?: string;
}

export default function MovieGridInstant({ 
    fetcher, 
    cacheKey,
    emptyMessage = "Không tìm thấy phim nào."
}: MovieGridInstantProps) {
    const { movies, pagination, isLoading } = useMoviesInstant(cacheKey, fetcher);

    if (isLoading && movies.length === 0) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4 mt-6">
                {Array.from({ length: 14 }).map((_, i) => (
                    <div key={i} className="aspect-[2/3] rounded-lg bg-white/5 animate-pulse" />
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
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4 mt-6 [contain:layout_paint]">
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
