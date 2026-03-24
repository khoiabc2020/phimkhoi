"use client";

import { useState, useEffect, useCallback } from "react";
import { Movie } from "@/services/api";

interface InstantData {
    movies: Movie[];
    timestamp: number;
    pagination?: any;
}

export function useMoviesInstant(
    cacheKey: string, 
    fetcher: () => Promise<{ items: Movie[]; pagination?: any }>
) {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [pagination, setPagination] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFresh, setIsFresh] = useState(false);

    // Initial Hydration from Cache
    useEffect(() => {
        const cached = localStorage.getItem(`phimkhoi_cache_${cacheKey}`);
        if (cached) {
            try {
                const parsed: InstantData = JSON.parse(cached);
                setMovies(parsed.movies);
                setPagination(parsed.pagination);
                setIsLoading(false); // We have something to show, so not "loading" in the blank sense
            } catch (e) {
                console.error("Cache Parse Error:", e);
            }
        }
    }, [cacheKey]);

    // Background Sync
    const sync = useCallback(async () => {
        try {
            const res = await fetcher();
            if (res.items && res.items.length > 0) {
                setMovies(res.items);
                setPagination(res.pagination);
                setIsFresh(true);
                setIsLoading(false);

                // Update Cache
                const dataToCache: InstantData = {
                    movies: res.items,
                    pagination: res.pagination,
                    timestamp: Date.now()
                };
                localStorage.setItem(`phimkhoi_cache_${cacheKey}`, JSON.stringify(dataToCache));
            }
        } catch (error) {
            console.error("Sync Error:", error);
            setIsLoading(false);
        }
    }, [cacheKey, fetcher]);

    useEffect(() => {
        sync();
    }, [sync]);

    return { movies, pagination, isLoading, isFresh, refetch: sync };
}
