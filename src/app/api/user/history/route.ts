import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import WatchHistory from "@/models/WatchHistory";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { slug, episode, progress } = await req.json();

        if (!slug) {
            return NextResponse.json({ error: "Slug is required" }, { status: 400 });
        }

        await dbConnect();

        // Cập nhật collection WatchHistory toàn cục thay vì User Array
        await WatchHistory.findOneAndUpdate(
            {
                userId: session.user.id,
                movieSlug: slug,
                episodeSlug: episode || "full",
            },
            {
                $set: {
                    userId: session.user.id,
                    movieSlug: slug,
                    progress: progress || 0,
                    lastWatched: new Date(),
                }
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("History Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const histories = await WatchHistory.find({ userId: session.user.id })
            .sort({ lastWatched: -1 })
            .limit(100)
            .lean();

        // Return full metadata to render movie cards without refetching
        const formattedHistory = histories.map(h => ({
            slug: h.movieSlug,
            name: h.movieName || h.movieSlug,
            poster: h.moviePoster,
            origin_name: h.movieOriginName || h.movieName,
            episodeSlug: h.episodeSlug,
            episodeName: h.episodeName,
            progress: h.progress,
            timestamp: new Date(h.lastWatched).getTime()
        }));

        return NextResponse.json({ history: formattedHistory });
    } catch (error) {
        console.error("History Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
