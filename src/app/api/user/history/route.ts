import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import WatchHistory from "@/models/WatchHistory";
import { authOptions } from "../../auth/[...nextauth]/route";
import { resolveLibraryUser } from "@/lib/user-library";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { slug, episode, progress } = await req.json();
        if (!slug) {
            return NextResponse.json({ error: "Slug is required" }, { status: 400 });
        }

        const { userObjectId } = await resolveLibraryUser(session.user);
        const historyUserId = userObjectId || String(session.user.id || "").trim();
        if (!historyUserId) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        await WatchHistory.findOneAndUpdate(
            {
                userId: historyUserId,
                movieSlug: slug,
                episodeSlug: episode || "full",
            },
            {
                $set: {
                    userId: historyUserId,
                    movieSlug: slug,
                    progress: progress || 0,
                    lastWatched: new Date(),
                },
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true,
            }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("History Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { userIdCandidates } = await resolveLibraryUser(session.user);
        if (!userIdCandidates.length) {
            return NextResponse.json({ history: [] });
        }

        const histories = await WatchHistory.find({ userId: { $in: userIdCandidates } })
            .sort({ lastWatched: -1 })
            .limit(100)
            .lean();

        const formattedHistory = histories.map((history: any) => ({
            slug: history.movieSlug,
            name: history.movieName || history.movieSlug,
            poster: history.moviePoster,
            origin_name: history.movieOriginName || history.movieName,
            episodeSlug: history.episodeSlug,
            episodeName: history.episodeName,
            progress: history.progress,
            timestamp: new Date(history.lastWatched).getTime(),
        }));

        return NextResponse.json({ history: formattedHistory });
    } catch (error) {
        console.error("History Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
