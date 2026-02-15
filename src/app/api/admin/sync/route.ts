import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Movie from "@/models/Movie";

const API_URL = "https://phimapi.com";

// Helper to normalized movie data from API to our Schema
const normalizeMovieData = (item: any) => {
    return {
        name: item.name,
        slug: item.slug,
        origin_name: item.origin_name,
        content: item.content || "", // Content might be empty in list view, need detail fetch for full content usually
        type: item.type,
        status: item.status,
        thumb_url: item.thumb_url,
        poster_url: item.poster_url,
        is_copyright: item.is_copyright === true || item.is_copyright === 'true',
        sub_docquyen: item.sub_docquyen === true || item.sub_docquyen === 'true',
        chieurap: item.chieurap === true || item.chieurap === 'true',
        trailer_url: item.trailer_url || "",
        time: item.time,
        episode_current: item.episode_current,
        episode_total: item.episode_total,
        quality: item.quality,
        lang: item.lang,
        notify: item.notify || "",
        showtimes: item.showtimes || "",
        year: item.year,
        view: item.view || 0,
        actor: item.actor || [],
        director: item.director || [],
        category: item.category || [],
        country: item.country || [],
        updatedAt: new Date(item.modified?.time || Date.now())
    };
};

export async function GET(req: Request) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const pageStart = parseInt(searchParams.get("start") || "1");
        const pageEnd = parseInt(searchParams.get("end") || "1"); // Default sync 1 page

        let totalSynced = 0;
        const errors: any[] = [];

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
                                movieData = { ...item, ...detailData.movie }; // Merge list info with detail info
                            }
                        }

                        const normalized = normalizeMovieData(movieData);

                        // Upsert: Update if exists, Insert if new
                        await Movie.findOneAndUpdate(
                            { slug: normalized.slug },
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

        return NextResponse.json({
            success: true,
            message: `Synced ${totalSynced} movies from page ${pageStart} to ${pageEnd}`,
            errors
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
