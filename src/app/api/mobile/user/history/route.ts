import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Movie from "@/models/Movie";
import WatchHistory from "@/models/WatchHistory";
import jwt from "jsonwebtoken";

const verifyToken = (req: Request) => {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.split(" ")[1];
    try {
        return jwt.verify(
            token,
            process.env.NEXTAUTH_SECRET || "fallback_secret"
        ) as { id: string };
    } catch (error) {
        return null;
    }
};

export async function GET(req: Request) {
    try {
        const userPayload = verifyToken(req);
        if (!userPayload) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        // Fetch from WatchHistory model (Source of Truth)
        const history = await WatchHistory.find({ userId: userPayload.id })
            .sort({ lastWatched: -1 })
            .limit(50)
            .lean();

        // Format to match mobile expectation (if needed) or just return
        // Mobile expects: { history: [ { slug, episode, progress, movie: {...} } ] }
        // WatchHistory has flat structure with movieName, etc.
        const formattedHistory = history.map(h => ({
            _id: h._id,
            slug: h.movieSlug,
            episode: h.episodeSlug,
            episode_name: h.episodeName,
            progress: h.progress, // percentage 0-100
            currentTime: h.currentTime || 0, // exact time in seconds
            duration: h.duration || 0,
            timestamp: new Date(h.lastWatched).getTime(),
            movie: {
                _id: h.movieId,
                name: h.movieName,
                thumb_url: h.moviePoster, // WatchHistory uses moviePoster for thumb
                poster_url: h.moviePoster,
                original_name: h.movieOriginName
            }
        }));

        return NextResponse.json({ history: formattedHistory });
    } catch (error) {
        console.error("Get History Error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const userPayload = verifyToken(req);
        if (!userPayload) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { slug, episode, progress, duration } = await req.json(); // progress/duration in seconds
        if (!slug) {
            return NextResponse.json(
                { message: "Slug is required" },
                { status: 400 }
            );
        }

        await dbConnect();

        // 1. Get Movie Details (needed for WatchHistory)
        const movie = await Movie.findOne({ slug }) as any;
        if (!movie) {
            return NextResponse.json({ message: "Movie not found" }, { status: 404 });
        }

        // 2. Find Episode Name
        let episodeName = episode;
        let episodeData = null;
        if (movie.episodes) {
            movie.episodes.forEach((server: any) => {
                const found = server.server_data.find((e: any) => e.slug == episode);
                if (found) {
                    episodeData = found;
                    episodeName = found.name;
                }
            });
        }

        // 3. Calculate Percentage Progress
        // If duration is provided (from mobile), use it. Else try to find from movie? (Movie time is string usually).
        // If duration is 0 or null, progress is 0.
        const safeDuration = duration || 0;
        const safeCurrentTime = progress || 0;
        const percentage = safeDuration > 0
            ? Math.min(100, Math.round((safeCurrentTime / safeDuration) * 100))
            : 0;

        // 4. Update/Upsert WatchHistory
        const watchHistory = await WatchHistory.findOneAndUpdate(
            {
                userId: userPayload.id,
                movieId: movie._id.toString(), // Store as string ID usually
                episodeSlug: episode,
            },
            {
                $set: {
                    userId: userPayload.id,
                    movieId: movie._id.toString(),
                    movieSlug: movie.slug,
                    movieName: movie.name,
                    movieOriginName: movie.origin_name,
                    moviePoster: movie.thumb_url || movie.poster_url,
                    episodeSlug: episode,
                    episodeName: episodeName,
                    progress: percentage,
                    duration: safeDuration,
                    currentTime: safeCurrentTime,
                    lastWatched: new Date(),
                }
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }
        );

        // Optional: Also Sync to legacy user.history for backward compatibility if needed?
        // skipping for now to rely on single source of truth. 
        // We updated GET to read from WatchHistory, so we are good.

        return NextResponse.json({ success: true, historyId: watchHistory._id });
    } catch (error) {
        console.error("Save History Error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
