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
    fetcher: () => Promise<{ items: Movie[]; pagination?: any }>,
    initialMovies?: Movie[],
    initialPagination?: any,
) {
    const hasInitial = !!initialMovies?.length;
    const [movies, setMovies] = useState<Movie[]>(hasInitial ? initialMovies! : []);
    const [pagination, setPagination] = useState<any>(initialPagination ?? null);
    const [isLoading, setIsLoading] = useState(!hasInitial);
    const [isFresh, setIsFresh] = useState(false);

    const STALE_MS = 5 * 60 * 1000; // 5 minutes

    // Initial Hydration from Cache
    useEffect(() => {
        const cached = localStorage.getItem(`phimkhoi_cache_${cacheKey}`);
        if (cached) {
            try {
                const parsed: InstantData = JSON.parse(cached);
                if (parsed.movies?.length) {
                    setMovies(parsed.movies);
                    setPagination(parsed.pagination);
                }
                setIsLoading(false);
            } catch (e) {
                console.error("Cache Parse Error:", e);
            }
        } else if (hasInitial) {
            setIsLoading(false);
        }
    }, [cacheKey]); // eslint-disable-line react-hooks/exhaustive-deps

    // Background Sync — skip if cache is fresh (<5 min old)
    const sync = useCallback(async (force = false) => {
        if (!force) {
            const cached = localStorage.getItem(`phimkhoi_cache_${cacheKey}`);
            if (cached) {
                try {
                    const parsed: InstantData = JSON.parse(cached);
                    if (Date.now() - parsed.timestamp < STALE_MS) {
                        setIsLoading(false);
                        return; // Data is fresh, skip network call
                    }
                } catch { /* ignore */ }
            }
        }
        try {
            const res = await fetcher();
            const items = res.items || [];
            setMovies(items);
            setPagination(res.pagination);
            setIsFresh(true);
            setIsLoading(false);

            const dataToCache: InstantData = {
                movies: items,
                pagination: res.pagination,
                timestamp: Date.now()
            };
            localStorage.setItem(`phimkhoi_cache_${cacheKey}`, JSON.stringify(dataToCache));
        } catch (error) {
            console.error("Sync Error:", error);
            setIsLoading(false);
        }
    }, [cacheKey, fetcher]);

    useEffect(() => {
        sync();
    }, [sync]);

    return { movies, pagination, isLoading, isFresh, refetch: () => sync(true) };
}
