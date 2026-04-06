"use client";

import { useCallback } from "react";
import { getResilientMoviesList } from "@/app/actions/movies";
import MovieGridInstant from "./MovieGridInstant";

export default function CategoryGridClient({
    slug,
    page,
    country,
    year,
    limit = 49,
    isTypeFallback = false,
    initialMovies,
    initialPagination,
}: {
    slug: string;
    page: number;
    country?: string;
    year?: string;
    limit?: number;
    isTypeFallback?: boolean;
    initialMovies?: any[];
    initialPagination?: any;
}) {
    const fetcher = useCallback(async () => {
        if (isTypeFallback) {
            return await getResilientMoviesList(slug, page, limit, {
                country,
                year,
            });
        }
        return await getResilientMoviesList("category", page, limit, {
            category: slug,
            country,
            year,
        });
    }, [page, limit, slug, country, year, isTypeFallback]);

    const cacheKey = `category_${slug}_p${page}_c${country || 'all'}_y${year || 'all'}`;

    return <MovieGridInstant fetcher={fetcher} cacheKey={cacheKey} initialMovies={initialMovies} initialPagination={initialPagination} />;
}
