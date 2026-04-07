import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import Movie from "@/models/Movie";
import { isTrailerMovie, sanitizeTmdbDataForMovie } from "@/lib/movie-list";
import { normalizeMovieImages } from "@/lib/movie-media";
import { createAuditLog } from "@/lib/audit";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const API_URL = "https://phimapi.com";   // KKPhim (source A)
const OPHIM_URL = "https://ophim1.com";  // OPhim  (source B)
const NGUONC_URL = "https://phim.nguonc.com/api"; // NguonC (source C)

// Normalize NguonC episode items to match our schema
function normalizeNguonCItems(items: any[]): any[] {
    return items.map(ep => ({
        name: ep.name || "",
        slug: ep.slug || "",
        filename: ep.filename || "",
        link_embed: ep.embed || ep.link_embed || "",
        link_m3u8: ep.m3u8 || ep.link_m3u8 || "",
    }));
}

// Fetch episodes from OPhim for a given slug, return server_data array or []
async function fetchOPhimEpisodes(slug: string): Promise<any[]> {
    try {
        const res = await fetch(`${OPHIM_URL}/phim/${slug}`, { signal: AbortSignal.timeout(6000) });
        if (!res.ok) return [];
        const data = await res.json();
        return (data.episodes || []).map((s: any) => ({
            server_name: `OPhim ${s.server_name || ""}`.trim(),
            server_data: s.server_data || [],
        }));
    } catch { return []; }
}

// Fetch episodes from NguonC for a given slug, return server_data array or []
async function fetchNguonCEpisodes(slug: string): Promise<any[]> {
    try {
        const res = await fetch(`${NGUONC_URL}/film/${slug}`, { signal: AbortSignal.timeout(6000) });
        if (!res.ok) return [];
        const data = await res.json();
        const movie = data.movie || data;
        const episodes = movie.episodes || data.episodes || [];
        return episodes.map((s: any) => ({
            server_name: `NguonC ${s.server_name || s.name || ""}`.trim(),
            server_data: normalizeNguonCItems(s.server_data || s.items || []),
        }));
    } catch { return []; }
}

const slugifyText = (value: string) =>
    String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

const normalizeNamedList = (value: unknown): { name: string; slug: string }[] => {
    if (Array.isArray(value)) {
        return value
            .map((item) => {
                if (!item) return null;
                if (typeof item === "string") {
                    const name = item.trim();
                    return name ? { name, slug: slugifyText(name) } : null;
                }

                const name = String((item as any).name || "").trim();
                const slug = String((item as any).slug || slugifyText(name)).trim();
                return name ? { name, slug: slug || slugifyText(name) } : null;
            })
            .filter(Boolean) as { name: string; slug: string }[];
    }

    return String(value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((name) => ({ name, slug: slugifyText(name) }));
};

const normalizeBoolean = (value: unknown) => value === true || value === "true" || value === 1 || value === "1";

const pickLongerText = (nextValue: unknown, currentValue: unknown) => {
    const nextText = String(nextValue || "").trim();
    const currentText = String(currentValue || "").trim();
    return nextText.length >= currentText.length ? nextText : currentText;
};

const pickNonEmptyArray = (nextValue: unknown, currentValue: unknown) => {
    const nextArray = Array.isArray(nextValue) ? nextValue.filter(Boolean) : [];
    const currentArray = Array.isArray(currentValue) ? currentValue.filter(Boolean) : [];
    return nextArray.length >= currentArray.length ? nextArray : currentArray;
};

// Helper to normalize movie data from API to our schema
const normalizeMovieData = (item: any, existingMovie?: any) => {
    const images = normalizeMovieImages({
        poster_url: item.poster_url,
        thumb_url: item.thumb_url,
    });
    const sanitized = sanitizeTmdbDataForMovie({
        ...existingMovie,
        ...item,
        ...images,
        tmdbData: item?.tmdbData ?? existingMovie?.tmdbData ?? null,
    });

    const nextCategory = normalizeNamedList(item.category || []);
    const nextCountry = normalizeNamedList(item.country || []);
    const nextEpisodes = Array.isArray(item.episodes) ? item.episodes : [];
    const existingEpisodes = Array.isArray(existingMovie?.episodes) ? existingMovie.episodes : [];
    const existingCategory = Array.isArray(existingMovie?.category) ? existingMovie.category : [];
    const existingCountry = Array.isArray(existingMovie?.country) ? existingMovie.country : [];
    const existingActors = Array.isArray(existingMovie?.actor) ? existingMovie.actor : [];
    const existingDirectors = Array.isArray(existingMovie?.director) ? existingMovie.director : [];
    const resolvedPoster = sanitized.poster_url || images.poster_url || existingMovie?.poster_url || "";
    const resolvedThumb = sanitized.thumb_url || images.thumb_url || existingMovie?.thumb_url || "";

    return {
        name: String(item.name || existingMovie?.name || "").trim(),
        slug: item.slug,
        origin_name: pickLongerText(item.origin_name, existingMovie?.origin_name),
        content: pickLongerText(item.content, existingMovie?.content),
        type: item.type || existingMovie?.type || "",
        status: item.status || existingMovie?.status || "",
        thumb_url: resolvedThumb,
        poster_url: resolvedPoster,
        is_copyright: normalizeBoolean(item.is_copyright),
        sub_docquyen: normalizeBoolean(item.sub_docquyen),
        chieurap: normalizeBoolean(item.chieurap),
        trailer_url: item.trailer_url || existingMovie?.trailer_url || "",
        time: item.time || existingMovie?.time || "",
        episode_current: item.episode_current || existingMovie?.episode_current || "",
        episode_total: item.episode_total || existingMovie?.episode_total || "",
        quality: item.quality || existingMovie?.quality || "",
        lang: item.lang || existingMovie?.lang || "",
        notify: item.notify || existingMovie?.notify || "",
        showtimes: item.showtimes || existingMovie?.showtimes || "",
        year: item.year || existingMovie?.year || 0,
        view: item.view || existingMovie?.view || 0,
        actor: pickNonEmptyArray(item.actor, existingActors),
        director: pickNonEmptyArray(item.director, existingDirectors),
        category: nextCategory.length > 0 ? nextCategory : existingCategory,
        country: nextCountry.length > 0 ? nextCountry : existingCountry,
        episodes: nextEpisodes.length > 0 ? nextEpisodes : existingEpisodes,
        tmdbData: sanitized.tmdbData ?? null,
        updatedAt: new Date(item.modified?.time || Date.now()),
        lastSynced: new Date(),
    };
};

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const { searchParams } = new URL(req.url);
        const pageStart = parseInt(searchParams.get("start") || "1");
        const pageEnd = parseInt(searchParams.get("end") || "1"); // Default sync 1 page

        let totalSynced = 0;
        const errors: unknown[] = [];

        for (let page = pageStart; page <= pageEnd; page++) {
            try {
                // Fetch list of new updates (this endpoint usually has the latest movies)
                const res = await fetch(`${API_URL}/danh-sach/phim-moi-cap-nhat?page=${page}`);
                if (!res.ok) throw new Error(`Failed to fetch page ${page}`);

                const data = await res.json();
                const items = data.items || [];

                for (const item of items) {
                    // For each item, we might want to fetch detail if list info is insufficient,
                    // but for speed, let's try to sync what we have first.
                    // IMPORTANT: PhimApi list items often lack 'content' or full 'category'.
                    // To be robust, we should probably fetch the detail for each movie, 
                    // OR just sync basic info and fetch detail lazily?
                    // Let's do a fast sync first: Fetch detail for better data quality.

                    try {
                        const detailRes = await fetch(`${API_URL}/phim/${item.slug}`);
                        let movieData = item;

                        if (detailRes.ok) {
                            const detailData = await detailRes.json();
                            if (detailData.movie) {
                                // episodes nằm ở detailData.episodes (top-level), KHÔNG phải detailData.movie.episodes
                                const phimApiEps: any[] = detailData.episodes || [];

                                // Fetch thêm từ OPhim + NguonC song song
                                const [ophimEps, nguoncEps] = await Promise.all([
                                    fetchOPhimEpisodes(item.slug),
                                    fetchNguonCEpisodes(item.slug),
                                ]);

                                // Merge: phimapi (KKPhim) + OPhim + NguonC
                                const mergedEpisodes = [
                                    ...phimApiEps,
                                    ...ophimEps,
                                    ...nguoncEps,
                                ].filter(s => s.server_data && s.server_data.length > 0);

                                movieData = {
                                    ...item,
                                    ...detailData.movie,
                                    episodes: mergedEpisodes.length > 0 ? mergedEpisodes : (item.episodes || []),
                                };
                            }
                        }

                        if (isTrailerMovie(movieData)) {
                            continue;
                        }

                        const existingMovie = await Movie.findOne({ slug: movieData.slug }).lean();
                        const normalized = normalizeMovieData(movieData, existingMovie);

                        // Upsert: Update if exists, Insert if new
                        await Movie.findOneAndUpdate(
                            { slug: normalized.slug } as any,
                            { $set: normalized },
                            { upsert: true, new: true, setDefaultsOnInsert: true }
                        );
                        totalSynced++;

                    } catch (err: any) {
                        console.error(`Error syncing movie ${item.slug}:`, err.message);
                        // Continue to next item
                    }
                }

            } catch (err: any) {
                console.error(`Error syncing page ${page}:`, err.message);
                errors.push({ page, error: err.message });
            }
        }

        await createAuditLog({
            action: "SYNC_MOVIES",
            entity: "movie",
            adminId: session.user.id,
            adminName: session.user.name ?? "",
            adminEmail: session.user.email ?? "",
            details: { pageStart, pageEnd, totalSynced, errorCount: errors.length },
        });

        return NextResponse.json({
            success: true,
            message: `Synced ${totalSynced} movies from page ${pageStart} to ${pageEnd}`,
            errors
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
