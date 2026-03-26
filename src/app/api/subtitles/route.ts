import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import SubtitleModel from "@/models/Subtitle";

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const searchParams = req.nextUrl.searchParams;
        const movieSlug = String(searchParams.get("movieSlug") || "").trim();
        const episodeSlug = String(searchParams.get("episodeSlug") || "").trim();

        if (!movieSlug || !episodeSlug) {
            return NextResponse.json({ error: "Missing movieSlug or episodeSlug" }, { status: 400 });
        }

        const items = await SubtitleModel.find({ movieSlug, episodeSlug })
            .sort({ isDefault: -1, language: 1, updatedAt: -1 })
            .select("-content")
            .lean();

        return NextResponse.json({ success: true, items });
    } catch (error: any) {
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}
