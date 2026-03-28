"use client";

import { useCallback } from "react";
import { searchMovies } from "@/services/api";
import MovieGridInstant from "./MovieGridInstant";

export default function SearchGridClient({ 
    keyword,
    category,
    country,
    year,
    type,
    limit = 49
}: { 
    keyword: string;
    category?: string;
    country?: string;
    year?: string;
    type?: string;
    limit?: number;
}) {
    const fetcher = useCallback(async () => {
        // We use the searchMovies API directly or via a server action
        // For now, let's assume searchMovies is client-safe or we use an action
        const results = await searchMovies(keyword, { 
            limit: limit * 2 // Fetch more for filtering
        });
        
        // Basic filtering logic moved to client if needed, 
        // but searchMovies already does some work.
        // Let's keep it simple for now.
        return { items: results || [], pagination: { currentPage: 1, totalPages: 1 } };
    }, [keyword, limit]);

    const cacheKey = `search_${keyword}_c${category || 'all'}_co${country || 'all'}_y${year || 'all'}_t${type || 'all'}`;

    return <MovieGridInstant fetcher={fetcher} cacheKey={cacheKey} />;
}
