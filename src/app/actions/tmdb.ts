"use server";

import { searchTMDBMovie, getTMDBDetails, getTMDBPersonDetails, getTMDBSeasonDetails } from "@/services/tmdb";

const isBuildPhase = () => process.env.NEXT_PHASE === 'phase-production-build';

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
    verification?: { originalName?: string; localName?: string; countrySlug?: string }
) {
    if (isBuildPhase()) return null;
    try {
        const movie = await searchTMDBMovie(query, year, type, verification);
        if (movie) {
            return {
                adult: movie.adult,
                original_language: movie.original_language,
                original_title: movie.original_title,
                original_name: movie.original_name,
                title: movie.title,
                name: movie.name,
                origin_country: movie.origin_country,
                release_date: movie.release_date,
                first_air_date: movie.first_air_date,
                poster_path: movie.poster_path,
                vote_average: movie.vote_average,
                backdrop_path: movie.backdrop_path,
                overview: movie.overview,
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
    verification?: { originalName?: string; localName?: string; countrySlug?: string }
) {
    if (isBuildPhase()) return null;
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
    verification?: { originalName?: string; localName?: string; countrySlug?: string }
) {
    if (isBuildPhase()) return [];
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
        const { getActorDetailsFromTMDB: getActorService } = await import("@/services/tmdb");
        return await getActorService(actorName);
    } catch (error) {
        console.error("Fetch Actor Details Error:", error);
        return null;
    }
}

export async function getTMDBEpisodeImages(
    query: string,
    year?: number,
    verification?: { originalName?: string; localName?: string; countrySlug?: string }
) {
    if (isBuildPhase()) return {};
    try {
        const toNumberOrUndefined = (value: unknown): number | undefined => {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : undefined;
        };

        const detectPreferredSeason = (...values: Array<string | undefined>) => {
            const text = values.filter(Boolean).join(" ").toLowerCase();
            const match = text.match(/(?:phần|phan|season|ss)\s*(\d{1,2})/i);
            if (!match) return undefined;
            const n = Number(match[1]);
            return Number.isFinite(n) && n > 0 ? n : undefined;
        };

        const stripSeasonSuffix = (value: string) =>
            String(value || "")
                .replace(/(?:phần|phan|season|ss)\s*\d{1,2}/gi, "")
                .replace(/\s+/g, " ")
                .trim();

        const normalizedYear = toNumberOrUndefined(year);
        const preferredSeason = detectPreferredSeason(query, verification?.originalName);

        let tv =
            await searchTMDBMovie(query, normalizedYear, "tv", verification) ||
            await searchTMDBMovie(query, undefined, "tv", verification);

        // Extra fallback for titles containing "phần X / season X"
        if (!tv?.id) {
            const baseQuery = stripSeasonSuffix(verification?.originalName || query);
            if (baseQuery) {
                tv = await searchTMDBMovie(
                    baseQuery,
                    undefined,
                    "tv",
                    { originalName: stripSeasonSuffix(verification?.originalName || ""), localName: stripSeasonSuffix(verification?.localName || ""), countrySlug: verification?.countrySlug }
                );
            }
        }

        if (!tv?.id) return {};

        const details = await getTMDBDetails(tv.id, "tv");
        const seasons: Array<{ season_number: number }> = (details?.seasons || [])
            .filter((s: any) => Number(s?.season_number) > 0)
            .sort((a: any, b: any) => Number(a.season_number) - Number(b.season_number));

        const seasonNumbers = seasons.map((s) => Number(s.season_number)).filter((n) => Number.isFinite(n));
        const prioritizedSeasons = preferredSeason && seasonNumbers.includes(preferredSeason)
            ? [preferredSeason, ...seasonNumbers.filter((n) => n !== preferredSeason)]
            : seasonNumbers;

        // Keep latency safe while still covering many titles.
        const seasonList = prioritizedSeasons.slice(0, 8).map((seasonNumber) => ({ season_number: seasonNumber }));
        const seasonDetails = await Promise.all(
            seasonList.map((s: any) => getTMDBSeasonDetails(tv.id, Number(s.season_number)))
        );

        // If query points to a specific season, prefer that season first.
        const preferredSeasonDetails = preferredSeason
            ? seasonDetails.find((s: any) => Number(s?.season_number) === preferredSeason)
            : null;
        const seasonsToUse = preferredSeasonDetails ? [preferredSeasonDetails] : seasonDetails;

        const episodeDataByNumber: Record<string, TMDBEpisodeMeta> = {};
        seasonsToUse.forEach((season: any) => {
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
