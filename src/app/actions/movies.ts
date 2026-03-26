"use server";

import { getMoviesList, Movie, getMovieDetail } from "@/services/api";
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
            return data;
        }

        // 2. Fallback to External API (Higher latency but fresh)
        const apiData = await getMoviesList(type, { 
            page, 
            limit, 
            category: options.category, 
            country: options.country,
            year: options.year
        });

        if (apiData && apiData.items && apiData.items.length > 0) {
            return apiData;
        }

        return { items: [], pagination: { currentPage: page, totalPages: 1 } };
    } catch (error) {
        console.error(`[ResilientAction] getResilientMoviesList Error:`, error);
        return { items: [], pagination: { currentPage: page, totalPages: 1 } };
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
