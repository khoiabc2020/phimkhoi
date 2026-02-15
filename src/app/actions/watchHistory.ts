"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import WatchHistory from "@/models/WatchHistory";
import { revalidatePath } from "next/cache";

export async function addWatchHistory(movieData: {
    movieId: string;
    movieSlug: string;
    movieName: string;
    movieOriginName: string;
    moviePoster: string;
    episodeSlug: string;
    episodeName: string;
    duration: number;
    currentTime: number;
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        await dbConnect();

        const progress = movieData.duration > 0
            ? Math.min(100, Math.round((movieData.currentTime / movieData.duration) * 100))
            : 0;

        const watchHistory = await WatchHistory.findOneAndUpdate(
            {
                userId: session.user.id,
                movieId: movieData.movieId,
                episodeSlug: movieData.episodeSlug,
            },
            {
                $set: {
                    ...movieData,
                    progress,
                    lastWatched: new Date(),
                },
            },
            {
                upsert: true,
                new: true,
            }
        );

        revalidatePath("/lich-su-xem");
        return { success: true, data: watchHistory };
    } catch (error) {
        console.error("Add watch history error:", error);
        return { success: false, error: "Failed to save watch history" };
    }
}

export async function getWatchHistory(limit: number = 50) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        await dbConnect();

        const history = await WatchHistory.find({ userId: session.user.id })
            .sort({ lastWatched: -1 })
            .limit(limit)
            .lean();

        return { success: true, data: history };
    } catch (error) {
        console.error("Get watch history error:", error);
        return { success: false, error: "Failed to fetch watch history" };
    }
}

export async function getContinueWatching() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        await dbConnect();

        // Get movies with progress between 5% and 95%
        const continueWatching = await WatchHistory.find({
            userId: session.user.id,
            progress: { $gte: 5, $lte: 95 },
        })
            .sort({ lastWatched: -1 })
            .limit(10)
            .lean();

        return { success: true, data: continueWatching };
    } catch (error) {
        console.error("Get continue watching error:", error);
        return { success: false, error: "Failed to fetch continue watching" };
    }
}

export async function removeWatchHistory(historyId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        await dbConnect();

        await WatchHistory.findOneAndDelete({
            _id: historyId,
            userId: session.user.id,
        });

        revalidatePath("/lich-su-xem");
        return { success: true };
    } catch (error) {
        console.error("Remove watch history error:", error);
        return { success: false, error: "Failed to remove from history" };
    }
}

export async function clearWatchHistory() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        await dbConnect();

        await WatchHistory.deleteMany({ userId: session.user.id });

        revalidatePath("/lich-su-xem");
        return { success: true };
    } catch (error) {
        console.error("Clear watch history error:", error);
        return { success: false, error: "Failed to clear history" };
    }
}

// Get watch history for a specific episode (for auto-resume)
export async function getWatchHistoryForEpisode(movieId: string, episodeSlug: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized", data: null };
        }

        await dbConnect();

        const history = await WatchHistory.findOne({
            userId: session.user.id,
            movieId,
            episodeSlug,
        }).lean();

        return { success: true, data: history };
    } catch (error) {
        console.error("Get episode watch history error:", error);
        return { success: false, error: "Failed to get watch history", data: null };
    }
}
