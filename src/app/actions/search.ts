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
        // [Elite Performance] Try Local MongoDB Search First (Sub-50ms)
        await connectDB();
        
        let movies = [];
        const cleanQuery = query.trim();
        
        // 1. Try Text Search for whole-word relevance (Fastest)
        const textResults = await MovieModel.find(
            { $text: { $search: cleanQuery } },
            { score: { $meta: "textScore" } }
        )
        .select('_id name origin_name slug thumb_url poster_url year quality')
        .sort({ score: { $meta: "textScore" }, view: -1 })
        .limit(10)
        .lean();

        movies = textResults;

        // 2. If text search has few results, use prefix regex for partial matches (Still fast with index)
        if (movies.length < 5) {
            const regex = new RegExp('^' + cleanQuery, 'i'); // Prefix match is index-friendly
            const prefixResults = await MovieModel.find({
                $or: [
                    { name: { $regex: regex } },
                    { origin_name: { $regex: regex } }
                ]
            })
            .select('_id name origin_name slug thumb_url poster_url year quality')
            .sort({ view: -1 })
            .limit(10)
            .lean();
            
            // Merge unique
            const seen = new Set(movies.map(m => m.slug));
            for (const m of prefixResults) {
                if (!seen.has(m.slug)) {
                    movies.push(m);
                    seen.add(m.slug);
                }
            }
        }

        // 3. Last resort: Mid-string regex (Slower but accurate for partials)
        if (movies.length < 3) {
            const midRegex = new RegExp(cleanQuery, 'i');
            const midResults = await MovieModel.find({
                $or: [
                    { name: { $regex: midRegex } },
                    { origin_name: { $regex: midRegex } }
                ]
            })
            .select('_id name origin_name slug thumb_url poster_url year quality')
            .sort({ view: -1 })
            .limit(5)
            .lean();

            const seen = new Set(movies.map(m => m.slug));
            for (const m of midResults) {
                if (!seen.has(m.slug)) {
                    movies.push(m);
                    seen.add(m.slug);
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
