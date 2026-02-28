"use server";

import { searchTMDBMovie, getTMDBDetails, getTMDBPersonDetails } from "@/services/tmdb";

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

export async function getActorDetailsFromTMDB(actorName: string) {
    try {
        // We need to search for the person first to get their ID
        const searchUrl = `${process.env.TMDB_API_URL || "https://api.themoviedb.org/3"}/search/person?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(actorName)}&language=vi-VN`;
        const searchRes = await fetch(searchUrl, { next: { revalidate: 86400 } });
        const searchData = await searchRes.json();

        if (searchData.results && searchData.results.length > 0) {
            const personId = searchData.results[0].id;
            return await getTMDBPersonDetails(personId);
        }
        return null;
    } catch (error) {
        console.error("Fetch Actor Details Error:", error);
        return null;
    }
}
