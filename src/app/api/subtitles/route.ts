import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import SubtitleModel from "@/models/Subtitle";

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const sp = req.nextUrl.searchParams;
        const movieSlug   = String(sp.get("movieSlug")   || "").trim();
        const episodeSlug = String(sp.get("episodeSlug") || "").trim();

        if (!movieSlug || !episodeSlug) {
            return NextResponse.json({ error: "Missing movieSlug or episodeSlug" }, { status: 400 });
        }

        // Only return subtitles stored in DB (admin-uploaded or cached)
        // Auto-search OpenSubtitles was removed — too many wrong matches.
        // Users can upload .srt/.vtt files directly in the player.
        const dbItems = await SubtitleModel.find({ movieSlug, episodeSlug })
            .sort({ isDefault: -1, language: 1, updatedAt: -1 })
            .select("-content")
            .lean();

        return NextResponse.json({ success: true, items: dbItems, source: "db" });
    } catch (error: any) {
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}
