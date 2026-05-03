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
    episode_current?: string;
    episode_total?: string;
    type?: string;
    status?: string;
    category?: any[];
    country?: any[];
    updatedAt?: Date;
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
    var fullSearchCache:
        | Map<string, { expiresAt: number; value: SearchMovie[] }>
        | undefined;
}

const memoryCache = global.realtimeSearchCache || (global.realtimeSearchCache = new Map());
const inflight = global.realtimeSearchInflight || (global.realtimeSearchInflight = new Map());
const fullCache = global.fullSearchCache || (global.fullSearchCache = new Map());

const emptyResult = (): RealtimeSearchResult => ({ movies: [], actors: [] });

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> => {
    let timer: NodeJS.Timeout | undefined;
    try {
        return await Promise.race<T>([
            promise,
            new Promise<T>((resolve) => { timer = setTimeout(() => resolve(fallback), timeoutMs); }),
        ]);
    } finally {
        if (timer) clearTimeout(timer);
    }
};

const escapeRegex = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Strip diacritics for normalization (e.g., "Hoài" → "Hoai", "đêm" → "dem")
const stripDiacritics = (v: string) =>
    v.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");

const normalizeCacheKey = (v: string) => stripDiacritics(v.trim().toLowerCase());

// Project fields for card display
const SEARCH_SELECT = "_id name origin_name slug thumb_url poster_url year quality view type status episode_current episode_total category country updatedAt";

/**
 * Score a movie by relevance to the query.
 * Higher = more relevant. View/year are secondary signals only.
 */
const scoreMovie = (movie: SearchMovie, query: string, queryNorm: string): number => {
    const name = String(movie.name || "").toLowerCase();
    const nameNorm = stripDiacritics(name);
    const origin = String(movie.origin_name || "").toLowerCase();
    const originNorm = stripDiacritics(origin);
    const slug = String(movie.slug || "").replace(/-/g, " ");

    let score = 0;

    // ── Tier 1: Exact full match ─────────────────────────────────────────────
    if (nameNorm === queryNorm || name === query) score += 1000;
    else if (originNorm === queryNorm || origin === query) score += 900;

    // ── Tier 2: Prefix match ─────────────────────────────────────────────────
    else if (nameNorm.startsWith(queryNorm)) score += 700;
    else if (name.startsWith(query)) score += 680;
    else if (originNorm.startsWith(queryNorm)) score += 600;
    else if (origin.startsWith(query)) score += 580;

    // ── Tier 3: Word-boundary prefix (query matches start of any word) ────────
    else if (new RegExp(`(^|\\s)${escapeRegex(queryNorm)}`).test(nameNorm)) score += 450;
    else if (new RegExp(`(^|\\s)${escapeRegex(query)}`).test(name)) score += 430;
    else if (new RegExp(`(^|\\s)${escapeRegex(queryNorm)}`).test(originNorm)) score += 380;

    // ── Tier 4: Contains anywhere ─────────────────────────────────────────────
    else if (nameNorm.includes(queryNorm)) score += 250;
    else if (name.includes(query)) score += 230;
    else if (originNorm.includes(queryNorm)) score += 180;
    else if (origin.includes(query)) score += 160;
    else if (slug.includes(queryNorm)) score += 80;

    // ── Secondary: recency boost ──────────────────────────────────────────────
    const year = Number(movie.year || 0);
    if (year >= 2024) score += 20;
    else if (year >= 2022) score += 12;
    else if (year >= 2020) score += 6;

    // ── Secondary: view/popularity (log scale so it doesn't dominate) ─────────
    score += Math.log10(Math.max(1, Number(movie.view) || 0)) * 8;

    return score;
};

// ── Full-page DB search (up to 48 results) ───────────────────────────────────
export async function searchMoviesFromDB(query: string, limit = 48): Promise<SearchMovie[]> {
    const cleanQuery = String(query || "").trim();
    if (cleanQuery.length < 2) return [];

    const cacheKey = `full_${normalizeCacheKey(cleanQuery)}_${limit}`;
    const now = Date.now();
    const cached = fullCache.get(cacheKey);
    if (cached && cached.expiresAt > now) return cached.value;

    await connectDB();

    const queryNorm = stripDiacritics(cleanQuery.toLowerCase());
    const escapedQ = escapeRegex(cleanQuery);
    const escapedNorm = escapeRegex(queryNorm);

    // Build regex patterns (case-insensitive)
    const prefixRx = new RegExp(`^${escapedQ}`, "i");
    const prefixNormRx = new RegExp(`^${escapedNorm}`, "i");
    const wordBoundRx = new RegExp(`(^|\\s)${escapedQ}`, "i");
    const wordBoundNormRx = new RegExp(`(^|\\s)${escapedNorm}`, "i");
    const midRx = new RegExp(escapedQ, "i");
    const midNormRx = new RegExp(escapedNorm, "i");
    const slugRx = new RegExp(escapedNorm.replace(/\s+/g, "-?"), "i");

    const fetchLimit = Math.ceil(limit * 2.5); // fetch extra, rank & trim

    const [textResults, prefixResults, normPrefixResults, midResults, midNormResults] = await Promise.all([
        // 1. Full-text index search (handles exact words well)
        withTimeout(
            MovieModel.find({ $text: { $search: cleanQuery } }, { score: { $meta: "textScore" } })
                .select(SEARCH_SELECT)
                .sort({ score: { $meta: "textScore" }, view: -1, updatedAt: -1 })
                .limit(fetchLimit)
                .lean(),
            600, []
        ),
        // 2. Prefix on original name/origin_name
        withTimeout(
            MovieModel.find({ $or: [{ name: prefixRx }, { origin_name: prefixRx }] })
                .select(SEARCH_SELECT)
                .sort({ view: -1, updatedAt: -1 })
                .limit(fetchLimit)
                .lean(),
            500, []
        ),
        // 3. Prefix on diacritic-stripped — helps "the boys" find Vietnamese-titled movies
        cleanQuery.length >= 3 ? withTimeout(
            MovieModel.find({ $or: [{ name: prefixNormRx }, { origin_name: prefixNormRx }] })
                .select(SEARCH_SELECT)
                .sort({ view: -1, updatedAt: -1 })
                .limit(fetchLimit)
                .lean(),
            500, []
        ) : Promise.resolve([]),
        // 4. Mid-word match (original) — chỉ chạy khi >= 4 ký tự vì unanchored regex tốn index scan
        cleanQuery.length >= 4 ? withTimeout(
            MovieModel.find({ $or: [{ name: midRx }, { origin_name: midRx }, { slug: slugRx }] })
                .select(SEARCH_SELECT)
                .sort({ view: -1, updatedAt: -1 })
                .limit(fetchLimit)
                .lean(),
            700, []
        ) : Promise.resolve([]),
        // 5. Mid-word match (normalized) — chỉ chạy khi >= 4 ký tự
        cleanQuery.length >= 4 ? withTimeout(
            MovieModel.find({ $or: [{ name: midNormRx }, { origin_name: midNormRx }] })
                .select(SEARCH_SELECT)
                .sort({ view: -1, updatedAt: -1 })
                .limit(fetchLimit)
                .lean(),
            700, []
        ) : Promise.resolve([]),
    ]);

    // Merge, deduplicate by slug
    const merged = new Map<string, SearchMovie>();
    for (const movie of [...textResults, ...prefixResults, ...normPrefixResults, ...midResults, ...midNormResults] as SearchMovie[]) {
        if (!movie?.slug || merged.has(movie.slug)) continue;
        merged.set(movie.slug, movie);
    }

    const results = Array.from(merged.values())
        .map(m => ({ movie: m, score: scoreMovie(m, cleanQuery.toLowerCase(), queryNorm) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ movie }) => movie);

    fullCache.set(cacheKey, { expiresAt: Date.now() + RESULT_TTL_MS, value: results });
    return results;
}

// ── Dropdown search (7 results, with actors) ─────────────────────────────────
export async function getRealtimeSearchData(query: string): Promise<RealtimeSearchResult> {
    const cleanQuery = String(query || "").trim();
    if (cleanQuery.length < 2) return emptyResult();

    const cacheKey = normalizeCacheKey(cleanQuery);
    const now = Date.now();
    const cached = memoryCache.get(cacheKey);
    if (cached && cached.expiresAt > now) return cached.value;

    const pending = inflight.get(cacheKey);
    if (pending) return pending;

    const searchPromise = (async () => {
        try {
            // Reuse the full search, just take top 7
            const [movies, actors] = await Promise.all([
                searchMoviesFromDB(cleanQuery, 7),
                cleanQuery.length >= 3
                    ? withTimeout(searchTMDBPerson(cleanQuery).catch((): any[] => []), 800, [])
                    : Promise.resolve([]),
            ]);

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
