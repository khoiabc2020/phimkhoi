"use server";

import { searchMovies } from "@/services/api";
import { searchTMDBPerson, getTMDBImage } from "@/services/tmdb";
import connectDB from "@/lib/db";
import MovieModel from "@/models/Movie";

export async function getRealtimeSearch(query: string, enrichTMDB: boolean = false) {
    if (!query || query.trim().length === 0) {
        return { movies: [], actors: [] };
    }

    try {
        // [Elite Performance] Try Local MongoDB Search First (Sub-100ms)
        await connectDB();
        const regex = new RegExp(query.trim(), 'i');
        const dbMovies = await MovieModel.find({
            $or: [
                { name: { $regex: regex } },
                { origin_name: { $regex: regex } }
            ]
        })
        .select('_id name origin_name slug thumb_url poster_url year quality')
        .sort({ view: -1, updatedAt: -1 })
        .limit(8)
        .lean();

        let movies = dbMovies;

        // Fallback to API search if DB has too few results (e.g. fresh DB)
        if (movies.length < 5) {
            const apiMovies = await searchMovies(query, { enrichTMDB, limit: 8 });
            // Merge results, prioritize DB ones
            const seenSlugs = new Set(movies.map(m => m.slug));
            for (const am of apiMovies) {
                if (!seenSlugs.has(am.slug)) {
                    movies.push(am as any);
                    seenSlugs.add(am.slug);
                }
            }
        }

        const actors = await searchTMDBPerson(query).catch((): any[] => []);

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
