"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
    // Dùng generation counter để bỏ qua kết quả fetch cũ khi keyword/filter thay đổi nhanh
    const generationRef = useRef(0);

    // Hydration: when cacheKey changes (filter/page changed), prefer initialMovies
    // from server over stale localStorage — then layer in localStorage if fresher
    useEffect(() => {
        // Immediately show server-preloaded data so filters feel instant
        if (initialMovies?.length) {
            setMovies(initialMovies);
            setPagination(initialPagination ?? null);
            setIsLoading(false);
        }

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
        } else if (!initialMovies?.length) {
            // No server data and no cache — show loader until sync() completes
            setIsLoading(true);
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

        // Tăng generation: nếu fetch cũ hoàn thành sau fetch mới → bỏ qua kết quả cũ
        const generation = ++generationRef.current;

        try {
            const res = await fetcher();
            if (generation !== generationRef.current) return; // race — request mới hơn đã bắt đầu

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
            if (generation !== generationRef.current) return;
            console.error("Sync Error:", error);
            setIsLoading(false);
        }
    }, [cacheKey, fetcher]);

    useEffect(() => {
        sync();
    }, [sync]);

    return { movies, pagination, isLoading, isFresh, refetch: () => sync(true) };
}
