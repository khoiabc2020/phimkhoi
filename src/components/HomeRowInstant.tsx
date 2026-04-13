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
    country?: string;
    category?: string;
    cacheKeyPrefix?: string;
}

function HomeRowFetcher({
    title,
    slug,
    viewAllHref,
    priorityFirst,
    cacheKeyPrefix,
    fetcher
}: {
    title: string;
    slug: string;
    viewAllHref?: string;
    priorityFirst?: boolean;
    cacheKeyPrefix: string;
    fetcher: () => Promise<{ items: any[]; pagination?: any }>;
}) {
    const { movies, isLoading } = useMoviesInstant(cacheKeyPrefix, fetcher);

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

    if (movies.length === 0 && !isLoading) {
        return (
            <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 md:px-8 lg:pl-24 lg:pr-12 py-4">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-6 text-white/70">
                    <div className="text-sm font-bold uppercase tracking-[0.2em] text-white/40">{title}</div>
                    <div className="mt-2 text-sm">Đang đồng bộ dữ liệu mới nhất. Hệ thống sẽ tự làm đầy danh sách ngay khi nguồn trả dữ liệu.</div>
                </div>
            </div>
        );
    }

    return (
        <MovieRow
            title={title}
            movies={movies}
            slug={viewAllHref || slug}
            priorityFirst={priorityFirst}
        />
    );
}

export default function HomeRowInstant({
    title,
    slug,
    endpoint = 'danh-sach',
    viewAllHref,
    minHeight = 350,
    priorityFirst = false,
    country,
    category,
    cacheKeyPrefix
}: HomeRowInstantProps) {
    const fetcher = useCallback(async () => {
        return await getResilientMoviesList(slug, 1, 12, { 
            category: category || (endpoint === 'the-loai' ? slug : undefined), 
            country: country || (endpoint === 'quoc-gia' ? slug : undefined) 
        });
    }, [slug, endpoint, category, country]);

    const finalCacheKey = cacheKeyPrefix || `home_row_${slug}`;

    return (
        <LazySection minHeight={minHeight} className="movie-row-standard">
            <HomeRowFetcher
                title={title}
                slug={slug}
                viewAllHref={viewAllHref}
                priorityFirst={priorityFirst}
                cacheKeyPrefix={finalCacheKey}
                fetcher={fetcher}
            />
        </LazySection>
    );
}
