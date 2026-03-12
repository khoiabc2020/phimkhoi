"use server";

import { searchTMDBMovie, getTMDBDetails, getTMDBPersonDetails, getTMDBSeasonDetails } from "@/services/tmdb";

export type TMDBEpisodeMeta = {
    image?: string;
    title?: string;
    overview?: string;
    airDate?: string;
    runtime?: number;
    voteAverage?: number;
};

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

export async function getMovieTrailer(
    query: string,
    year?: number,
    type: 'movie' | 'tv' = 'movie',
    verification?: { originalName?: string; countrySlug?: string }
) {
    try {
        const movie = await searchTMDBMovie(query, year, type, verification);
        if (movie) {
            const details = await getTMDBDetails(movie.id, type);
            if (details?.videos?.results?.length > 0) {
                // Find a trailer on YouTube
                const trailer = details.videos.results.find((v: any) => v.site === 'YouTube' && v.type === 'Trailer')
                    || details.videos.results.find((v: any) => v.site === 'YouTube');
                if (trailer) {
                    return trailer.key;
                }
            }
        }
        return null;
    } catch (error) {
        console.error("Fetch Trailer Error:", error);
        return null;
    }
}

export async function getMovieCast(
    query: string,
    year?: number,
    type: 'movie' | 'tv' = 'movie',
    localizedActors?: string[],
    verification?: { originalName?: string; countrySlug?: string }
) {
    try {
        const movie = await searchTMDBMovie(query, year, type, verification);
        if (movie) {
            const details = await getTMDBDetails(movie.id, type);
            if (details && details.credits && details.credits.cast) {
                return details.credits.cast.slice(0, 10).map((actor: any, index: number) => {
                    let displayName = actor.name;
                    // If we have localized (Hán Việt) names from Ophim API, use them!
                    // This fixes Chinese actors showing up as Pinyin (e.g. Wang Churan instead of Vương Sở Nhiên)
                    if (localizedActors && localizedActors[index] && localizedActors[index].trim().length > 1) {
                        displayName = localizedActors[index];
                    }
                    return {
                        id: actor.id,
                        name: displayName,
                        original_name: actor.original_name,
                        character: actor.character,
                        profile_path: actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : null
                    };
                });
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
        const apiUrl = process.env.TMDB_API_URL || "https://api.themoviedb.org/3";
        const apiKey = process.env.TMDB_API_KEY;
        if (!apiKey || !actorName?.trim()) return null;

        const normalize = (value: string) =>
            String(value || "")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, " ")
                .replace(/\s+/g, " ")
                .trim();

        const actorNorm = normalize(actorName);

        const fetchSearch = async (lang: "vi-VN" | "en-US") => {
            const searchUrl = `${apiUrl}/search/person?api_key=${apiKey}&query=${encodeURIComponent(actorName)}&language=${lang}`;
            const res = await fetch(searchUrl, { next: { revalidate: 86400 } });
            const data = await res.json();
            return Array.isArray(data?.results) ? data.results : [];
        };

        const [viResults, enResults] = await Promise.all([
            fetchSearch("vi-VN"),
            fetchSearch("en-US"),
        ]);

        const merged = [...viResults, ...enResults];
        const unique = Array.from(new Map(merged.map((p: any) => [p.id, p])).values());
        if (unique.length === 0) return null;

        const scorePerson = (person: any) => {
            const names = [
                person?.name,
                person?.original_name,
                ...(Array.isArray(person?.also_known_as) ? person.also_known_as : []),
            ]
                .map((n: string) => normalize(n))
                .filter(Boolean);

            let score = 0;
            for (const n of names) {
                if (n === actorNorm) score = Math.max(score, 120);
                else if (n.includes(actorNorm) || actorNorm.includes(n)) score = Math.max(score, 95);
            }

            if (person?.known_for_department === "Acting") score += 20;
            if (person?.profile_path) score += 10;
            score += Math.min(Number(person?.popularity || 0), 25);
            return score;
        };

        const bestPerson = unique
            .map((p: any) => ({ person: p, score: scorePerson(p) }))
            .sort((a, b) => b.score - a.score)[0]?.person;

        if (bestPerson?.id) {
            return await getTMDBPersonDetails(bestPerson.id);
        }

        return null;
    } catch (error) {
        console.error("Fetch Actor Details Error:", error);
        return null;
    }
}

export async function getTMDBEpisodeImages(
    query: string,
    year?: number,
    verification?: { originalName?: string; countrySlug?: string }
) {
    try {
        const tv = await searchTMDBMovie(query, year, "tv", verification);
        if (!tv?.id) return {};

        const details = await getTMDBDetails(tv.id, "tv");
        const seasons = (details?.seasons || [])
            .filter((s: any) => Number(s?.season_number) > 0)
            .sort((a: any, b: any) => Number(a.season_number) - Number(b.season_number));

        // Keep it safe on latency/rate limit: fetch up to first 5 seasons
        const seasonList = seasons.slice(0, 5);
        const seasonDetails = await Promise.all(
            seasonList.map((s: any) => getTMDBSeasonDetails(tv.id, Number(s.season_number)))
        );

        const episodeDataByNumber: Record<string, TMDBEpisodeMeta> = {};
        seasonDetails.forEach((season: any) => {
            if (!season?.episodes) return;
            season.episodes.forEach((ep: any) => {
                const epNo = String(ep?.episode_number || "");
                if (!epNo) return;
                const existing = episodeDataByNumber[epNo] || {};
                episodeDataByNumber[epNo] = {
                    image: existing.image || (ep?.still_path ? `https://image.tmdb.org/t/p/w780${ep.still_path}` : undefined),
                    title: existing.title || ep?.name || undefined,
                    overview: existing.overview || ep?.overview || undefined,
                    airDate: existing.airDate || ep?.air_date || undefined,
                    runtime: existing.runtime || ep?.runtime || undefined,
                    voteAverage: existing.voteAverage || ep?.vote_average || undefined,
                };
            });
        });

        return episodeDataByNumber;
    } catch (error) {
        console.error("TMDB Episode Images Error:", error);
        return {};
    }
}
