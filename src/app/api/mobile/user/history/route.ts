import { NextRequest, NextResponse } from "next/server";
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

export async function GET(req: NextRequest) {
    try {
        const userPayload = verifyToken(req as any);
        if (!userPayload) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const searchParams = req.nextUrl.searchParams;
        const movieSlug = searchParams.get("movieSlug");
        const episodeSlug = searchParams.get("episodeSlug");

        if (movieSlug && episodeSlug) {
            // Fetch history for a specific episode to auto-resume
            const history = await WatchHistory.findOne({
                userId: userPayload.id,
                movieSlug: movieSlug,
                episodeSlug: episodeSlug,
            }).lean();

            return NextResponse.json(
                {
                    history: history ? {
                        progress: history.progress,
                        currentTime: history.currentTime || 0,
                        duration: history.duration || 0,
                    } : null
                },
                {
                    headers: {
                        "Cache-Control": "private, max-age=10",
                    },
                }
            );
        }

        // Dùng aggregation để dedupe: chỉ lấy tập mới nhất mỗi phim (giống web getContinueWatching)
        const history = await WatchHistory.aggregate([
            { $match: { userId: userPayload.id } },
            { $sort: { lastWatched: -1 } },
            {
                $group: {
                    _id: "$movieId",
                    doc: { $first: "$$ROOT" }
                }
            },
            { $replaceRoot: { newRoot: "$doc" } },
            { $sort: { lastWatched: -1 } },
            { $limit: 50 }
        ]);

        const formattedHistory = history.map((h: any) => ({
            _id: h._id,
            slug: h.movieSlug,
            episode: h.episodeSlug,
            episodeName: h.episodeName,
            progress: h.progress,
            currentTime: h.currentTime || 0,
            duration: h.duration || 0,
            timestamp: new Date(h.lastWatched).getTime(),
            movieName: h.movieName,
            moviePoster: h.moviePoster,
            movieOriginName: h.movieOriginName,
            movie: {
                _id: h.movieId,
                name: h.movieName,
                thumb_url: h.moviePoster,
                poster_url: h.moviePoster,
                original_name: h.movieOriginName
            }
        }));

        return NextResponse.json(
            { history: formattedHistory },
            {
                headers: {
                    "Cache-Control": "private, max-age=15, stale-while-revalidate=20",
                },
            }
        );
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

        const {
            slug, episode, progress, duration,
            // Client can provide these so history saves even for movies not yet in our DB
            movieName: clientMovieName,
            moviePoster: clientMoviePoster,
            movieOriginName: clientMovieOriginName,
            episodeName: clientEpisodeName,
        } = await req.json();

        if (!slug) {
            return NextResponse.json(
                { message: "Slug is required" },
                { status: 400 }
            );
        }

        await dbConnect();

        // Try to get metadata from DB first; fall back to client-supplied data
        const movie = await Movie.findOne({ slug }).lean() as any;

        const resolvedMovieName = movie?.name || clientMovieName || slug;
        const resolvedMovieOriginName = movie?.origin_name || clientMovieOriginName || slug;
        const resolvedMoviePoster = movie?.thumb_url || movie?.poster_url || clientMoviePoster || '';
        const resolvedMovieId = movie?._id?.toString() || slug; // Use slug as ID fallback

        // Find episode name from DB if available, else use client-supplied
        let episodeName = clientEpisodeName || episode;
        if (movie?.episodes) {
            movie.episodes.forEach((server: { server_name: string; server_data: { slug: string; name: string }[] }) => {
                const found = server.server_data.find((e: { slug: string }) => e.slug == episode);
                if (found) episodeName = found.name;
            });
        }

        // Calculate Percentage Progress
        const safeDuration = duration || 0;
        const safeCurrentTime = progress || 0;
        const percentage = safeDuration > 0
            ? Math.min(100, Math.round((safeCurrentTime / safeDuration) * 100))
            : 0;

        // Update/Upsert WatchHistory
        const watchHistory = await WatchHistory.findOneAndUpdate(
            {
                userId: userPayload.id,
                movieSlug: slug,
                episodeSlug: episode,
            },
            {
                $set: {
                    userId: userPayload.id,
                    movieId: resolvedMovieId,
                    movieSlug: slug,
                    movieName: resolvedMovieName,
                    movieOriginName: resolvedMovieOriginName,
                    moviePoster: resolvedMoviePoster,
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

        return NextResponse.json({ success: true, historyId: watchHistory._id });
    } catch (error) {
        console.error("Save History Error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
