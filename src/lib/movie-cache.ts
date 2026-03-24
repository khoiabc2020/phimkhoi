/**
 * [Server-Only] Movie Cache Service
 * Uses MongoDB/Mongoose to retrieve pre-synced movie lists.
 * MUST only be imported from Server Components or Route Handlers.
 */
import dbConnect from "@/lib/db";
import TrendingCache from "@/models/TrendingCache";
import type { Movie } from "@/services/api";

export const getMoviesFromCache = async (
    type: string,
    page: number = 1,
    limit: number = 28
): Promise<{ items: Movie[]; pagination: any } | null> => {
    try {
        await dbConnect();
        const cache = await TrendingCache.findOne({ type }).lean();
        if (!cache || !cache.movies || cache.movies.length === 0) return null;

        const allMovies = cache.movies as Movie[];
        const totalItems = allMovies.length;
        const totalPages = Math.ceil(totalItems / limit);
        const startIndex = (page - 1) * limit;
        const paginatedItems = allMovies.slice(startIndex, startIndex + limit);

        if (paginatedItems.length === 0) return null;

        return {
            items: paginatedItems,
            pagination: { totalItems, totalPages, currentPage: page, totalItemsPerPage: limit },
        };
    } catch (error) {
        console.error(`[MovieCache] Fetch Error [${type}]:`, error);
        return null;
    }
};
