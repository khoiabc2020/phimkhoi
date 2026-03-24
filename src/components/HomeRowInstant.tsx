"use client";

import { useMoviesInstant } from "@/hooks/useMoviesInstant";
import { getMoviesList } from "@/services/api";
import MovieRow from "./MovieRow";
import LazySection from "./LazySection";
import { useCallback } from "react";

interface HomeRowInstantProps {
    title: string;
    slug: string;
    endpoint?: 'danh-sach' | 'the-loai' | 'quoc-gia';
    viewAllHref?: string;
    minHeight?: number;
    priorityFirst?: boolean;
}

export default function HomeRowInstant({
    title,
    slug,
    endpoint = 'danh-sach',
    viewAllHref,
    minHeight = 350,
    priorityFirst = false
}: HomeRowInstantProps) {
    const fetcher = useCallback(async () => {
        return await getMoviesList(slug, { 
            limit: 12, 
            category: endpoint === 'the-loai' ? slug : undefined, 
            country: endpoint === 'quoc-gia' ? slug : undefined 
        });
    }, [slug, endpoint]);

    const { movies, isLoading } = useMoviesInstant(`home_row_${slug}`, fetcher);

    if (isLoading && movies.length === 0) {
        return (
            <div className="w-full max-w-[1920px] mx-auto px-1.5 sm:px-3 md:px-5 lg:pl-24 lg:pr-12 md:py-6 py-4 space-y-4">
                <div className="h-6 w-48 bg-white/10 rounded shimmer" />
                <div className="flex gap-3 md:gap-4 overflow-hidden">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <div 
                            key={i} 
                            className="min-w-[140px] md:min-w-[180px] aspect-[2/3] rounded-lg bg-indigo-500/5 border border-white/5 shimmer" 
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (movies.length === 0 && !isLoading) return null;

    return (
        <LazySection minHeight={minHeight} className="movie-row-standard">
            <MovieRow
                title={title}
                movies={movies}
                slug={viewAllHref || slug}
                priorityFirst={priorityFirst}
            />
        </LazySection>
    );
}
