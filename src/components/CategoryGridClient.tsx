"use client";

import { getMoviesByCategory } from "@/services/api";
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
    const fetcher = async () => {
        return await getMoviesByCategory(slug, page, limit, { country, year });
    };

    const cacheKey = `category_${slug}_p${page}_c${country || 'all'}_y${year || 'all'}`;

    return <MovieGridInstant fetcher={fetcher} cacheKey={cacheKey} />;
}
