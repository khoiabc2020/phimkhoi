/**
 * [Server-Only] Movie Cache Service
 * Uses MongoDB/Mongoose to retrieve pre-synced movie lists.
 * MUST only be imported from Server Components or Route Handlers.
 */
import dbConnect from "@/lib/db";
import TrendingCache from "@/models/TrendingCache";
import MovieModel, { LIST_PROJECTION } from "@/models/Movie";
import type { Movie } from "@/services/api";
import { cache } from "react";
import { normalizeMovieImages } from "@/lib/movie-media";
import { sanitizeMovieList } from "@/lib/movie-list";
import { matchesCountryForDisplay } from "@/lib/movie-country";

const COUNTRY_CACHE_TYPES = new Set(["han-quoc", "trung-quoc", "nhat-ban", "thai-lan", "viet-nam", "dai-loan"]);

// Pages shown in pagination UI for lists sourced from TrendingCache (in-memory slice)
const TRENDING_VIRTUAL_PAGES = 50;
// Pages shown for direct MongoDB paginated queries (server handles real pagination)
const FILTER_VIRTUAL_PAGES = 200;

const hasPlayableEpisodes = (episodes: any[] = []) =>
    Array.isArray(episodes) &&
    episodes.some(
        (server) =>
            Array.isArray(server?.server_data) &&
            server.server_data.some((episode: any) => episode?.link_m3u8 || episode?.link_embed)
    );

export const getMoviesFromCache = async (
    type: string,
    page: number = 1,
    limit: number = 49
): Promise<{ items: Movie[]; pagination: any } | null> => {
    try {
        await dbConnect();
        const trendingCache = await TrendingCache.findOne({ type }).lean();
        if (!trendingCache || !trendingCache.movies || trendingCache.movies.length === 0) return null;

        const allMovies = trendingCache.movies as Movie[];
        const normalizedItems = allMovies.map((movie) => normalizeMovieImages(movie));
        const filteredItems = COUNTRY_CACHE_TYPES.has(type)
            ? normalizedItems.filter((movie) => matchesCountryForDisplay(movie, type))
            : normalizedItems;
        const cleanItems = sanitizeMovieList(filteredItems, { limit: filteredItems.length || 1 });
        const totalItems = cleanItems.length;

        const totalPages = Math.max(Math.ceil(totalItems / limit), TRENDING_VIRTUAL_PAGES);
        const startIndex = (page - 1) * limit;
        const paginatedItems = cleanItems.slice(startIndex, startIndex + limit);
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
 * [Elite Retrieval] Query movies by category/country with proper DB pagination.
 * Uses LIST_PROJECTION to exclude heavy fields (episodes, content, tmdbData)
 * — reduces per-document transfer by ~90% for list views.
 */
export const getMoviesByFilterFromCache = async (
    filterType: 'category' | 'country',
    slug: string,
    page: number = 1,
    limit: number = 49,
    options: { year?: string | number; category?: string; country?: string; sort?: string } = {}
): Promise<{ items: Movie[]; pagination: any } | null> => {
    try {
        await dbConnect();
        const skip = (page - 1) * limit;

        const query: any = {};
        if (filterType === 'category') query["category.slug"] = slug;
        if (filterType === 'country') query["country.slug"] = slug;

        if (options.year && options.year !== 'all') query.year = Number(options.year);
        if (options.category && options.category !== 'all') query["category.slug"] = options.category;
        if (options.country && options.country !== 'all') query["country.slug"] = options.country;

        const sortMap: Record<string, Record<string, 1 | -1>> = {
            newest:      { updatedAt: -1 },
            oldest:      { updatedAt: 1 },
            "year-desc": { year: -1, updatedAt: -1 },
            "year-asc":  { year: 1,  updatedAt: -1 },
            popular:     { view: -1, updatedAt: -1 },
        };
        const sortOrder = sortMap[options.sort || "newest"] || sortMap.newest;

        // Fetch count and page in parallel; use LIST_PROJECTION to skip heavy fields
        const [totalDocCount, movies] = await Promise.all([
            MovieModel.countDocuments(query),
            MovieModel.find(query)
                .select(LIST_PROJECTION)
                .sort(sortOrder)
                .skip(skip)
                .limit(limit)
                .lean(),
        ]);

        if (movies.length === 0) return null;

        const normalizedMovies = (movies as unknown as Movie[]).map((movie) => normalizeMovieImages(movie));
        const filteredMovies = filterType === "country"
            ? normalizedMovies.filter((movie) => matchesCountryForDisplay(movie, slug))
            : normalizedMovies;
        const cleanMovies = sanitizeMovieList(filteredMovies, { limit });
        const totalItems = Math.max(cleanMovies.length, totalDocCount);

        const totalPages = Math.max(Math.ceil(totalItems / limit), FILTER_VIRTUAL_PAGES);

        return {
            items: cleanMovies,
            pagination: { totalItems, totalPages, currentPage: page, totalItemsPerPage: limit },
        };
    } catch (error) {
        console.error(`[MovieCache] Filter Error [${slug}]:`, error);
        return null;
    }
};

/**
 * [Elite Persistence] Retrieve full movie details from MongoDB.
 * No projection — detail pages need everything including episodes.
 */
export const getMovieDetailFromCache = cache(async (slug: string): Promise<any | null> => {
    try {
        await dbConnect();
        const movie = await MovieModel.findOne({ slug }).lean();
        if (!movie) return null;
        const episodes = Array.isArray((movie as any).episodes) ? (movie as any).episodes : [];
        if (!hasPlayableEpisodes(episodes)) return null;

        return { movie, episodes };
    } catch (error) {
        console.error("Cache retrieval error:", error);
        return null;
    }
});

/**
 * [Elite Persistence] Save movie details to MongoDB on-demand (JIT).
 */
export const saveMovieToCache = async (slug: string, data: any) => {
    try {
        await dbConnect();
        const movie = data.movie || data.data?.item;
        const incomingEpisodes = data.episodes || data.data?.episodes || [];
        if (!movie) return;

        const existingMovie = await MovieModel.findOne({ slug }).select("episodes thumb_url poster_url").lean();
        const episodes = hasPlayableEpisodes(incomingEpisodes)
            ? incomingEpisodes
            : (existingMovie?.episodes || []);

        const pathImage = data.pathImage || data.data?.pathImage || "";

        const rawMovieMedia = normalizeMovieImages({
            poster_url: movie.poster_url?.startsWith("http") ? movie.poster_url : `${pathImage || ""}${movie.poster_url || ""}`,
            thumb_url: movie.thumb_url?.startsWith("http") ? movie.thumb_url : `${pathImage || ""}${movie.thumb_url || ""}`,
        });

        const existingMedia = normalizeMovieImages({
            poster_url: existingMovie?.poster_url || "",
            thumb_url: existingMovie?.thumb_url || "",
        });

        const poster_url = rawMovieMedia.poster_url || existingMedia.poster_url || "";
        const thumb_url = rawMovieMedia.thumb_url || existingMedia.thumb_url || "";

        const { _id, id: movie_id, ...rest } = movie;

        await MovieModel.findOneAndUpdate(
            { slug },
            {
                $set: {
                    ...rest,
                    thumb_url,
                    poster_url,
                    episodes,
                    lastSynced: new Date(),
                }
            },
            { upsert: true, setDefaultsOnInsert: true }
        );
    } catch (error) {
        console.warn(`[MovieCache] Save Error [${slug}]:`, error);
    }
};
