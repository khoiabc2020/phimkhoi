"use client";

import { useCallback } from "react";
import { getResilientMoviesList } from "@/app/actions/movies";
import MovieGridInstant from "./MovieGridInstant";

export default function CategoryGridClient({ 
    slug, 
    page,
    country,
    year,
    limit = 49
}: { 
    slug: string; 
    page: number;
    country?: string;
    year?: string;
    limit?: number;
}) {
    const fetcher = useCallback(async () => {
        return await getResilientMoviesList("category", page, limit, {
            category: slug,
            country,
            year,
        });
    }, [page, limit, slug, country, year]);

    const cacheKey = `category_${slug}_p${page}_c${country || 'all'}_y${year || 'all'}`;

    return <MovieGridInstant fetcher={fetcher} cacheKey={cacheKey} />;
}
