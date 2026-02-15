"use server";

import { searchTMDBMovie, getTMDBDetails } from "@/services/tmdb";

export async function getTMDBDataForCard(
    query: string,
    year?: number,
    type: 'movie' | 'tv' = 'movie',
    verification?: { originalName?: string; countrySlug?: string }
) {
    try {
        const movie = await searchTMDBMovie(query, year, type, verification);
        if (movie) {
            return {
                poster_path: movie.poster_path,
                vote_average: movie.vote_average,
                backdrop_path: movie.backdrop_path,
            };
        }
        return null;
    } catch (error) {
        console.error("TMDB Action Error:", error);
        return null;
    }
}

export async function getMovieCast(query: string, year?: number, type: 'movie' | 'tv' = 'movie') {
    try {
        const movie = await searchTMDBMovie(query, year, type);
        if (movie) {
            const details = await getTMDBDetails(movie.id, type);
            if (details && details.credits && details.credits.cast) {
                return details.credits.cast.slice(0, 10).map((actor: any) => ({
                    id: actor.id,
                    name: actor.name,
                    original_name: actor.original_name,
                    character: actor.character,
                    profile_path: actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : null
                }));
            }
        }
        return [];
    } catch (error) {
        console.error("TMDB Cast Action Error:", error);
        return [];
    }
}
