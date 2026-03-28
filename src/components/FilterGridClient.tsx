"use client";

import { useCallback } from "react";
import { getResilientMoviesList } from "@/app/actions/movies";
import MovieGridInstant from "./MovieGridInstant";

export default function FilterGridClient({ 
    category,
    country,
    year,
    type,
    page = "1",
    limit = 49 
}: { 
    category?: string;
    country?: string;
    year?: string;
    type?: string;
    page?: string;
    limit?: number;
}) {
    const fetcher = useCallback(async () => {
        const data = await getResilientMoviesList(type || "phim-moi-cap-nhat", page ? parseInt(page) : 1, limit, {
            category,
            country,
            year: year ? parseInt(year) : undefined,
        });
        return { 
            items: data.items || [], 
            pagination: data.pagination || { currentPage: 1, totalPages: 1 } 
        };
    }, [category, country, year, type, page, limit]);

    const cacheKey = `filter_t${type || 'default'}_c${category || 'all'}_co${country || 'all'}_y${year || 'all'}_p${page}`;

    return <MovieGridInstant fetcher={fetcher} cacheKey={cacheKey} />;
}
