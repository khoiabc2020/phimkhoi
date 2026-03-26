/**
 * [Server-Only] Movie Cache Service
 * Uses MongoDB/Mongoose to retrieve pre-synced movie lists.
 * MUST only be imported from Server Components or Route Handlers.
 */
import dbConnect from "@/lib/db";
import TrendingCache from "@/models/TrendingCache";
import MovieModel from "@/models/Movie";
import type { Movie } from "@/services/api";
import { cache } from "react";

export const getMoviesFromCache = async (
    type: string,
    page: number = 1,
    limit: number = 49
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
 * [Elite Retrieval] Query for movies by specific filter (Category, Country, etc.)
 * Provides perfectly filled "full" pages as requested.
 */
export const getMoviesByFilterFromCache = async (
    filterType: 'category' | 'country',
    slug: string,
    page: number = 1,
    limit: number = 49,
    options: { year?: string | number; category?: string } = {}
): Promise<{ items: Movie[]; pagination: any } | null> => {
    try {
        await dbConnect();
        const skip = (page - 1) * limit;
        
        // Construct query
        const query: any = {};
        if (filterType === 'category') query["category.slug"] = slug;
        if (filterType === 'country') query["country.slug"] = slug;
        
        if (options.year && options.year !== 'all') query.year = Number(options.year);
        if (options.category && options.category !== 'all') query["category.slug"] = options.category;

        // Perform count and find in parallel
        const [totalItems, movies] = await Promise.all([
            MovieModel.countDocuments(query),
            MovieModel.find(query)
                .sort({ updatedAt: -1, lastSynced: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
        ]);

        if (movies.length === 0) return null;

        return {
            items: movies as unknown as Movie[],
            pagination: {
                totalItems,
                totalPages: Math.ceil(totalItems / limit),
                currentPage: page,
                totalItemsPerPage: limit
            }
        };
    } catch (error) {
        console.error(`[MovieCache] Filter Error [${slug}]:`, error);
        return null;
    }
};

/**
 * [Elite Persistence] Retrieve full movie details from MongoDB
 * Eliminates external API latency for 99% of requests.
 */
export const getMovieDetailFromCache = cache(async (slug: string): Promise<any | null> => {
    try {
        await dbConnect();
        const movie = await MovieModel.findOne({ slug }).lean();
        if (!movie) return null;
        
        // Match the format expected by the frontend
        return {
            movie,
            episodes: movie.episodes || []
        };
    } catch (error) {
        console.error("Cache retrieval error:", error);
        return null;
    }
};
/**
 * [Elite Persistence] Save movie details to MongoDB on-demand (JIT)
 */
export const saveMovieToCache = async (slug: string, data: any) => {
    try {
        await dbConnect();
        // Normalize different API response structures
        const movie = data.movie || data.data?.item;
        const episodes = data.episodes || data.data?.episodes || [];
        if (!movie) return;

        const pathImage = data.pathImage || data.data?.pathImage || "";
        
        // Basic normalization
        let thumb_url = movie.thumb_url?.startsWith('http') ? movie.thumb_url : (pathImage + movie.thumb_url);
        let poster_url = movie.poster_url?.startsWith('http') ? movie.poster_url : (pathImage + movie.poster_url);

        // NguonC Swap logic (NguonC specific signature)
        if (data.status === 'success' && data.movie && !data.data) {
             const temp = thumb_url;
             thumb_url = poster_url;
             poster_url = temp;
        }

        const { _id, id: movie_id, ...rest } = movie;
        const finalId = _id || movie_id || movie.slug;

        await MovieModel.findOneAndUpdate(
            { slug },
            { 
                $set: { 
                    ...rest,
                    thumb_url,
                    poster_url,
                    episodes,
                    updatedAt: new Date()
                } 
            },
            { upsert: true, setDefaultsOnInsert: true }
        );
    } catch (error) {
        console.warn(`[MovieCache] Save Error [${slug}]:`, error);
    }
};
