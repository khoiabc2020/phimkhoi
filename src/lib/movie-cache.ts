/**
 * [Server-Only] Movie Cache Service
 * Uses MongoDB/Mongoose to retrieve pre-synced movie lists.
 * MUST only be imported from Server Components or Route Handlers.
 */
import dbConnect from "@/lib/db";
import TrendingCache from "@/models/TrendingCache";
import MovieModel from "@/models/Movie";
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

/**
 * [Elite Persistence] Retrieve full movie details from MongoDB
 * Eliminates external API latency for 99% of requests.
 */
export const getMovieDetailFromCache = async (slug: string): Promise<any | null> => {
    try {
        await dbConnect();
        const movie = await MovieModel.findOne({ slug }).lean();
        if (!movie || !movie.episodes || movie.episodes.length === 0) return null;
        
        // Match the format expected by the frontend
        return {
            movie,
            episodes: movie.episodes
        };
    } catch (error) {
        console.error(`[MovieCache] Detail Fetch Error [${slug}]:`, error);
        return null;
    }
};
