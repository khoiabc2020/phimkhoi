/**
 * [Server-Only] TMDB Enrichment Cache
 * Stores TMDB enrichment data per movie slug in MongoDB with 7-day TTL.
 * Eliminates repeated external TMDB API calls on every page revalidation.
 */
import dbConnect from "@/lib/db";
import TmdbCache from "@/models/TmdbCache";

export interface TmdbCacheEntry {
    data: any;           // tmdbDetails (getTMDBDetails result)
    epImages: any;       // episode images map (getTMDBEpisodeImages result)
    trailerKey: string | null;
}

/**
 * Get cached TMDB enrichment for a movie slug.
 * Returns null on cache miss or error (caller should fetch from TMDB).
 */
export async function getTmdbCacheEntry(slug: string): Promise<TmdbCacheEntry | null> {
    try {
        await dbConnect();
        const doc = await TmdbCache.findOne({ slug }).lean();
        if (!doc) return null;
        return {
            data:       doc.data ?? null,
            epImages:   doc.epImages ?? null,
            trailerKey: doc.trailerKey ?? null,
        };
    } catch {
        return null;
    }
}

/**
 * Save TMDB enrichment to MongoDB cache (fire-and-forget safe).
 * Upserts so repeated calls are idempotent.
 */
export async function saveTmdbCacheEntry(slug: string, entry: TmdbCacheEntry): Promise<void> {
    try {
        await dbConnect();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await TmdbCache.findOneAndUpdate(
            { slug },
            { $set: { ...entry, cachedAt: new Date(), expiresAt } },
            { upsert: true }
        );
    } catch {
        // Non-blocking — cache failure should never break the page
    }
}
