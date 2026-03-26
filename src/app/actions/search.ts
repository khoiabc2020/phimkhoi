"use server";

import { searchMovies } from "@/services/api";
import { searchTMDBPerson, getTMDBImage } from "@/services/tmdb";
import connectDB from "@/lib/db";
import MovieModel from "@/models/Movie";

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> => {
    let timer: NodeJS.Timeout | undefined;
    try {
        return await Promise.race<T>([
            promise,
            new Promise<T>((resolve) => {
                timer = setTimeout(() => resolve(fallback), timeoutMs);
            }),
        ]);
    } finally {
        if (timer) clearTimeout(timer);
    }
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function getRealtimeSearch(query: string, enrichTMDB: boolean = false) {
    const cleanQuery = query.trim();

    if (!cleanQuery) {
        return { movies: [], actors: [] };
    }

    try {
        await connectDB();
        let movies: any[] = [];
        
        const textResults = await withTimeout(
            MovieModel.find(
                { $text: { $search: cleanQuery } },
                { score: { $meta: "textScore" } }
            )
                .select("_id name origin_name slug thumb_url poster_url year quality")
                .sort({ score: { $meta: "textScore" }, view: -1 })
                .limit(10)
                .lean(),
            900,
            []
        );

        movies = textResults;

        if (movies.length < 5) {
            const regex = new RegExp("^" + escapeRegex(cleanQuery), "i");
            const prefixResults = await withTimeout(
                MovieModel.find({
                    $or: [
                        { name: { $regex: regex } },
                        { origin_name: { $regex: regex } }
                    ]
                })
                    .select("_id name origin_name slug thumb_url poster_url year quality")
                    .sort({ view: -1 })
                    .limit(10)
                    .lean(),
                900,
                []
            );
            
            const seen = new Set(movies.map(m => m.slug));
            for (const m of prefixResults) {
                if (!seen.has(m.slug)) {
                    movies.push(m);
                    seen.add(m.slug);
                }
            }
        }

        if (movies.length < 3) {
            const midRegex = new RegExp(escapeRegex(cleanQuery), "i");
            const midResults = await withTimeout(
                MovieModel.find({
                    $or: [
                        { name: { $regex: midRegex } },
                        { origin_name: { $regex: midRegex } }
                    ]
                })
                    .select("_id name origin_name slug thumb_url poster_url year quality")
                    .sort({ view: -1 })
                    .limit(5)
                    .lean(),
                1200,
                []
            );

            const seen = new Set(movies.map(m => m.slug));
            for (const m of midResults) {
                if (!seen.has(m.slug)) {
                    movies.push(m);
                    seen.add(m.slug);
                }
            }
        }

        if (movies.length < 5) {
            const externalMovies = await withTimeout(
                searchMovies(cleanQuery, { enrichTMDB, limit: 10 }),
                1800,
                []
            );

            const seen = new Set(movies.map((m) => m.slug));
            for (const movie of externalMovies) {
                if (movie?.slug && !seen.has(movie.slug)) {
                    movies.push(movie);
                    seen.add(movie.slug);
                }
            }
        }

        const actors = cleanQuery.length >= 3
            ? await withTimeout(searchTMDBPerson(cleanQuery).catch((): any[] => []), 1500, [])
            : [];

        const formattedActors = (actors || []).map((actor: { id?: number; name?: string; profile_path?: string; }) => ({
            id: actor.id,
            name: actor.name,
            profile_url: actor.profile_path ? getTMDBImage(actor.profile_path, "w500") : null,
        }));

        return {
            movies: movies.slice(0, 5),
            actors: formattedActors.slice(0, 3)
        };
    } catch (error) {
        console.error("Realtime search error:", error);
        return { movies: [], actors: [] };
    }
}
