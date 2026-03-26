"use client";

import { useMoviesInstant } from "@/hooks/useMoviesInstant";
import { getResilientMoviesList } from "@/app/actions/movies";
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
        return await getResilientMoviesList(slug, 1, 12, { 
            category: endpoint === 'the-loai' ? slug : undefined, 
            country: endpoint === 'quoc-gia' ? slug : undefined 
        });
    }, [slug, endpoint]);

    const { movies, isLoading } = useMoviesInstant(`home_row_${slug}`, fetcher);

    if (isLoading && movies.length === 0) {
        return (
            <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 md:px-8 lg:pl-24 lg:pr-12 md:py-6 py-4 space-y-3">
                <div className="h-5 w-40 bg-white/10 rounded-full shimmer opacity-50" />
                <div className="flex gap-3 md:gap-4 overflow-hidden">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <div 
                            key={i} 
                            className="min-w-[130px] md:min-w-[175px] aspect-[2/3] rounded-xl bg-white/[0.03] border border-white/[0.05] shimmer relative overflow-hidden" 
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-30" />
                        </div>
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
