"use client";

import { useCallback } from "react";
import { getResilientMoviesList } from "@/app/actions/movies";
import MovieGridInstant from "./MovieGridInstant";

export default function TypeGridClient({ 
    type, 
    page,
    limit = 49,
    category,
    country,
    year
}: { 
    type: string; 
    page: number;
    limit?: number;
    category?: string;
    country?: string;
    year?: string;
}) {
    const fetcher = useCallback(async () => {
        const isSpecialCategory = ["thuyet-minh", "vietsub", "long-tieng", "phim-thuyet-minh", "phim-vietsub", "phim-long-tieng"].includes(type);
        const activeCategory = isSpecialCategory ? type : category;
        const endpoint = (type === 'tat-ca-the-loai' || type === 'phim-moi' || isSpecialCategory) ? 'phim-moi-cap-nhat' : type;
        
        return await getResilientMoviesList(endpoint, page, limit, { 
            year: year ? parseInt(year) : undefined, 
            category: activeCategory, 
            country 
        });
    }, [type, page, limit, category, country, year]);

    const cacheKey = `type_${type}_p${page}_c${category || 'all'}_co${country || 'all'}_y${year || 'all'}`;

    return <MovieGridInstant fetcher={fetcher} cacheKey={cacheKey} />;
}
