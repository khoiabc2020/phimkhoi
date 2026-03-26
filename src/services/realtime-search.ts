import connectDB from "@/lib/db";
import MovieModel from "@/models/Movie";
import { searchTMDBPerson, getTMDBImage } from "@/services/tmdb";

type SearchMovie = {
    _id: string;
    name: string;
    origin_name?: string;
    slug: string;
    thumb_url?: string;
    poster_url?: string;
    year?: number;
    quality?: string;
    view?: number;
};

export type RealtimeSearchResult = {
    movies: SearchMovie[];
    actors: { id?: number; name?: string; profile_url: string | null }[];
};

const RESULT_TTL_MS = 5 * 60 * 1000;

declare global {
    var realtimeSearchCache:
        | Map<string, { expiresAt: number; value: RealtimeSearchResult }>
        | undefined;
    var realtimeSearchInflight:
        | Map<string, Promise<RealtimeSearchResult>>
        | undefined;
}

const memoryCache = global.realtimeSearchCache || (global.realtimeSearchCache = new Map());
const inflight = global.realtimeSearchInflight || (global.realtimeSearchInflight = new Map());

const emptyResult = (): RealtimeSearchResult => ({ movies: [], actors: [] });

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

const normalizeCacheKey = (value: string) =>
    value
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

const movieScore = (movie: SearchMovie, query: string) => {
    const normalizedName = String(movie.name || "").toLowerCase();
    const normalizedOrigin = String(movie.origin_name || "").toLowerCase();
    let score = Number(movie.view || 0) / 1000;

    if (normalizedName === query) score += 300;
    else if (normalizedName.startsWith(query)) score += 220;
    else if (normalizedName.includes(query)) score += 120;

    if (normalizedOrigin === query) score += 180;
    else if (normalizedOrigin.startsWith(query)) score += 130;
    else if (normalizedOrigin.includes(query)) score += 70;

    if (movie.year) score += Math.min(20, Math.max(0, Number(movie.year) - 2000) / 2);
    return score;
};

export async function getRealtimeSearchData(query: string): Promise<RealtimeSearchResult> {
    const cleanQuery = String(query || "").trim();
    if (cleanQuery.length < 2) return emptyResult();

    const cacheKey = normalizeCacheKey(cleanQuery);
    const now = Date.now();
    const cached = memoryCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
        return cached.value;
    }

    const pending = inflight.get(cacheKey);
    if (pending) return pending;

    const searchPromise = (async () => {
        try {
            await connectDB();

            const prefixRegex = new RegExp(`^${escapeRegex(cleanQuery)}`, "i");
            const midRegex = new RegExp(escapeRegex(cleanQuery), "i");

            const [textResults, prefixResults, midResults, actors] = await Promise.all([
                withTimeout(
                    MovieModel.find(
                        { $text: { $search: cleanQuery } },
                        { score: { $meta: "textScore" } }
                    )
                        .select("_id name origin_name slug thumb_url poster_url year quality view")
                        .sort({ score: { $meta: "textScore" }, view: -1, updatedAt: -1 })
                        .limit(8)
                        .lean(),
                    450,
                    []
                ),
                withTimeout(
                    MovieModel.find({
                        $or: [{ name: { $regex: prefixRegex } }, { origin_name: { $regex: prefixRegex } }],
                    })
                        .select("_id name origin_name slug thumb_url poster_url year quality view")
                        .sort({ view: -1, updatedAt: -1 })
                        .limit(8)
                        .lean(),
                    450,
                    []
                ),
                cleanQuery.length >= 3
                    ? withTimeout(
                          MovieModel.find({
                              $or: [{ name: { $regex: midRegex } }, { origin_name: { $regex: midRegex } }],
                          })
                              .select("_id name origin_name slug thumb_url poster_url year quality view")
                              .sort({ view: -1, updatedAt: -1 })
                              .limit(6)
                              .lean(),
                          650,
                          []
                      )
                    : Promise.resolve([]),
                cleanQuery.length >= 3
                    ? withTimeout(searchTMDBPerson(cleanQuery).catch((): any[] => []), 800, [])
                    : Promise.resolve([]),
            ]);

            const merged = new Map<string, SearchMovie>();
            for (const movie of [...textResults, ...prefixResults, ...midResults] as SearchMovie[]) {
                if (!movie?.slug || merged.has(movie.slug)) continue;
                merged.set(movie.slug, movie);
            }

            const movies = Array.from(merged.values())
                .sort((a, b) => movieScore(b, cleanQuery.toLowerCase()) - movieScore(a, cleanQuery.toLowerCase()))
                .slice(0, 5);

            const formattedActors = (actors || [])
                .map((actor: { id?: number; name?: string; profile_path?: string }) => ({
                    id: actor.id,
                    name: actor.name,
                    profile_url: actor.profile_path ? getTMDBImage(actor.profile_path, "w500") : null,
                }))
                .slice(0, 3);

            const result = { movies, actors: formattedActors };
            memoryCache.set(cacheKey, { expiresAt: Date.now() + RESULT_TTL_MS, value: result });
            return result;
        } catch (error) {
            console.error("Realtime search error:", error);
            return emptyResult();
        } finally {
            inflight.delete(cacheKey);
        }
    })();

    inflight.set(cacheKey, searchPromise);
    return searchPromise;
}
