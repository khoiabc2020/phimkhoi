"use client";

import { getMoviesByCountry } from "@/services/api";
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
    const fetcher = async () => {
        return await getMoviesByCountry(slug, page, limit, { category, year });
    };

    const cacheKey = `country_${slug}_p${page}_c${category || 'all'}_y${year || 'all'}`;

    return <MovieGridInstant fetcher={fetcher} cacheKey={cacheKey} />;
}
