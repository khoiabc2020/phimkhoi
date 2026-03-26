"use server";

import {
    getMoviesList,
    getMoviesByCategory,
    getMoviesByCountry,
    Movie,
    getMovieDetail,
} from "@/services/api";
import { getFallbackDisplayMovies, syncMoviesToLocalCache } from "@/services/server-movies";
import { sanitizeMovieList } from "@/lib/movie-list";
import { 
    getMoviesFromCache, 
    getMoviesByFilterFromCache, 
    getMovieDetailFromCache, 
    saveMovieToCache 
} from "@/lib/movie-cache";

/**
 * [Elite Resilience] Resilient Movie List Loader
 * Pattern: DB Cache -> External API -> JIT Update
 */
export async function getResilientMoviesList(
    type: string, 
    page: number = 1, 
    limit: number = 12,
    options: { category?: string; country?: string; year?: string | number } = {}
) {
    try {
        const allowAdult = options.category === "phim-18" || type === "phim-18";
        const finalize = (items: Movie[]) => sanitizeMovieList(items, { limit, allowAdult });

        // 1. Try DB first for maximum speed (sub-50ms)
        let data = null;
        if (options.category || options.country) {
            const filterType = options.category ? 'category' : 'country';
            const slug = options.category || options.country || "";
            data = await getMoviesByFilterFromCache(filterType, slug, page, limit, options);
        } else {
            data = await getMoviesFromCache(type, page, limit);
        }

        if (data && data.items && data.items.length > 0) {
            return {
                ...data,
                items: finalize(data.items),
            };
        }

        // 2. Fallback to External API (Higher latency but fresh)
        const yearParam =
            options.year == null || options.year === 'all'
                ? undefined
                : typeof options.year === 'string'
                    ? Number(options.year)
                    : options.year;

        const normalizedYearParam = typeof yearParam === 'number' && Number.isNaN(yearParam)
            ? undefined
            : yearParam;

        const apiData =
            options.country
                ? await getMoviesByCountry(options.country, page, limit, {
                    category: options.category,
                    year: normalizedYearParam,
                })
                : options.category
                    ? await getMoviesByCategory(options.category, page, limit, {
                        country: options.country,
                        year: normalizedYearParam,
                    })
                    : await getMoviesList(type, {
                        page,
                        limit,
                        category: options.category,
                        country: options.country,
                        year: normalizedYearParam,
                    });

        if (apiData && apiData.items && apiData.items.length > 0) {
            syncMoviesToLocalCache(apiData.items).catch(() => {});
            return {
                ...apiData,
                items: finalize(apiData.items),
            };
        }

        const fallbackItems = await getFallbackDisplayMovies({ type, limit, options });
        return {
            items: finalize(fallbackItems),
            pagination: { currentPage: page, totalPages: Math.max(1, fallbackItems.length ? page : 1) }
        };
    } catch (error) {
        console.error(`[ResilientAction] getResilientMoviesList Error:`, error);
        const fallbackItems = await getFallbackDisplayMovies({ type, limit, options }).catch((): Movie[] => []);
        const allowAdult = options.category === "phim-18" || type === "phim-18";
        return {
            items: sanitizeMovieList(fallbackItems, { limit, allowAdult }),
            pagination: { currentPage: page, totalPages: 1 }
        };
    }
}

/**
 * [Elite Resilience] Resilient Movie Detail Loader
 * Pattern: DB Cache -> External API -> JIT Update
 */
export async function getResilientMovieDetail(slug: string) {
    try {
        // 1. Try DB first
        const cache = await getMovieDetailFromCache(slug);
        if (cache) return cache;

        // 2. Fallback to External API
        const apiData = await getMovieDetail(slug);
        if (apiData) {
            // JIT saving is usually handled in the page.tsx but we can trigger it here too
            saveMovieToCache(slug, apiData).catch(() => {});
            return apiData;
        }

        return null;
    } catch (error) {
        console.error(`[ResilientAction] getResilientMovieDetail Error:`, error);
        return null;
    }
}
