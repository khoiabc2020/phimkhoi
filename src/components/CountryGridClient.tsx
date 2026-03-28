"use client";

import { useCallback } from "react";
import { getResilientMoviesList } from "@/app/actions/movies";
import MovieGridInstant from "./MovieGridInstant";

export default function CountryGridClient({ 
    slug, 
    page,
    category,
    year,
    limit = 49
}: { 
    slug: string; 
    page: number;
    category?: string;
    year?: string;
    limit?: number;
}) {
    const fetcher = useCallback(async () => {
        return await getResilientMoviesList("country", page, limit, {
            country: slug,
            category,
            year,
        });
    }, [page, limit, slug, category, year]);

    const cacheKey = `country_${slug}_p${page}_c${category || 'all'}_y${year || 'all'}`;

    return <MovieGridInstant fetcher={fetcher} cacheKey={cacheKey} />;
}
