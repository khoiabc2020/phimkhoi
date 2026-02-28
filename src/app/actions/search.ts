"use server";

import { searchMovies } from "@/services/api";
import { searchTMDBPerson, getTMDBImage } from "@/services/tmdb";

export async function getRealtimeSearch(query: string) {
    if (!query || query.trim().length === 0) {
        return { movies: [], actors: [] };
    }

    try {
        const [movies, actors] = await Promise.all([
            searchMovies(query),
            searchTMDBPerson(query),
        ]);

        const formattedActors = (actors || []).map((actor: any) => ({
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
