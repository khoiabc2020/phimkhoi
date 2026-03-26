import "server-only";

import dbConnect from "@/lib/db";
import MovieModel from "@/models/Movie";
import { getMoviesByCategory, getMoviesByCountry, type Movie } from "@/services/api";

export async function syncMoviesToLocalCache(movies: Movie[]) {
    if (!Array.isArray(movies) || movies.length === 0) return;

    try {
        await dbConnect();

        const ops = movies
            .filter((movie) => movie?.slug)
            .slice(0, 120)
            .map((movie) => ({
                updateOne: {
                    filter: { slug: movie.slug },
                    update: {
                        $set: {
                            _id: String(movie._id || movie.slug),
                            name: movie.name || "",
                            origin_name: movie.origin_name || "",
                            slug: movie.slug,
                            type: movie.type || "",
                            status: movie.status || "",
                            thumb_url: movie.thumb_url || "",
                            poster_url: movie.poster_url || "",
                            quality: movie.quality || "",
                            lang: movie.lang || "",
                            year: Number(movie.year) || 0,
                            episode_current: movie.episode_current || "",
                            episode_total: movie.episode_total || "",
                            category: Array.isArray(movie.category) ? movie.category : [],
                            country: Array.isArray(movie.country) ? movie.country : [],
                            tmdbData: movie.tmdbData || null,
                            updatedAt: new Date(),
                        },
                        $setOnInsert: { episodes: [] as Movie["episodes"] },
                    },
                    upsert: true,
                },
            }));

        if (ops.length === 0) return;
        await MovieModel.bulkWrite(ops, { ordered: false });
    } catch (error) {
        console.warn("[MovieSync] Failed to sync list movies into local cache:", error);
    }
}

export async function getRelatedMoviesForMovie({
    categorySlug,
    currentMovieSlug,
    countrySlug,
    limit = 10,
}: {
    categorySlug?: string;
    currentMovieSlug: string;
    countrySlug?: string;
    limit?: number;
}): Promise<Movie[]> {
    const safeLimit = Math.max(1, Math.min(limit, 24));
    const merged = new Map<string, Movie>();

    const pushMovies = (movies: Movie[]) => {
        movies.forEach((movie) => {
            if (!movie?.slug || movie.slug === currentMovieSlug || merged.has(movie.slug)) return;
            merged.set(movie.slug, movie);
        });
    };

    try {
        if (categorySlug || countrySlug) {
            await dbConnect();

            const dbQuery: Record<string, unknown> = {
                slug: { $ne: currentMovieSlug },
            };

            if (categorySlug) dbQuery["category.slug"] = categorySlug;
            if (countrySlug) dbQuery["country.slug"] = countrySlug;

            const dbMovies = await MovieModel.find(dbQuery)
                .sort({ updatedAt: -1, lastSynced: -1 })
                .limit(safeLimit * 2)
                .lean();

            pushMovies(dbMovies as unknown as Movie[]);
        }
    } catch (error) {
        console.warn("[RelatedMovies] Local cache lookup failed:", error);
    }

    if (merged.size < safeLimit && categorySlug) {
        const categoryData = await getMoviesByCategory(categorySlug, 1, Math.max(24, safeLimit * 2)).catch(() => ({ items: [] as Movie[] }));
        const categoryMovies = (categoryData.items || []).filter((movie: Movie) => movie.slug !== currentMovieSlug);
        pushMovies(categoryMovies);
        syncMoviesToLocalCache(categoryMovies).catch(() => {});
    }

    if (merged.size < safeLimit && countrySlug) {
        const countryData = await getMoviesByCountry(countrySlug, 1, Math.max(24, safeLimit * 2), categorySlug ? { category: categorySlug } : undefined)
            .catch(() => ({ items: [] as Movie[] }));
        const countryMovies = (countryData.items || []).filter((movie: Movie) => movie.slug !== currentMovieSlug);
        pushMovies(countryMovies);
        syncMoviesToLocalCache(countryMovies).catch(() => {});
    }

    return Array.from(merged.values()).slice(0, safeLimit);
}
