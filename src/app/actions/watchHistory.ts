"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import WatchHistory from "@/models/WatchHistory";
import { revalidatePath } from "next/cache";
import { resolveLibraryUser } from "@/lib/user-library";

export async function addWatchHistory(movieData: {
    movieId: string;
    movieSlug: string;
    movieName: string;
    movieOriginName: string;
    moviePoster: string;
    movieThumb?: string;
    episodeSlug: string;
    episodeName: string;
    duration: number;
    currentTime: number;
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return { success: false, error: "Unauthorized" };
        }

        const { userObjectId } = await resolveLibraryUser(session.user);
        const historyUserId = userObjectId || String(session.user.id || "").trim();
        if (!historyUserId) {
            return { success: false, error: "User not found" };
        }

        const progress = movieData.duration > 0
            ? Math.min(100, Math.round((movieData.currentTime / movieData.duration) * 100))
            : 0;

        // Normalize episode name: add "Tập " prefix for numeric/unnamed episodes
        const normalizeEpisodeName = (name: string) => {
            if (!name) return name;
            const lower = name.toLowerCase().trim();
            if (lower === "full" || lower === "full hd" || lower === "movie" || lower === "phim lẻ") return name;
            if (/^(tập|episode|ep\.?\s*)/i.test(name)) return name;
            return `Tập ${name}`;
        };
        movieData.episodeName = normalizeEpisodeName(movieData.episodeName);

        const watchHistory = await WatchHistory.findOneAndUpdate(
            {
                userId: historyUserId,
                movieId: movieData.movieId,
                episodeSlug: movieData.episodeSlug,
            },
            {
                $set: {
                    userId: historyUserId,
                    ...movieData,
                    progress,
                    lastWatched: new Date(),
                },
            },
            {
                upsert: true,
                new: false, // Không cần trả doc — giảm tải DB khi traffic lớn
            }
        );

        return { success: true, data: watchHistory ?? undefined };
    } catch (error) {
        console.error("Add watch history error:", error);
        return { success: false, error: "Failed to save watch history" };
    }
}

export async function getWatchHistory(page: number = 1, limit: number = 30) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return { success: false, error: "Unauthorized" };
        }

        const { userIdCandidates } = await resolveLibraryUser(session.user);
        if (!userIdCandidates.length) {
            return { success: false, error: "User not found" };
        }

        const query = { userId: { $in: userIdCandidates } };
        const skip = (page - 1) * limit;
        const [history, total] = await Promise.all([
            WatchHistory.find(query).sort({ lastWatched: -1 }).skip(skip).limit(limit).lean(),
            WatchHistory.countDocuments(query),
        ]);

        return { success: true, data: history, total, totalPages: Math.ceil(total / limit) };
    } catch (error) {
        console.error("Get watch history error:", error);
        return { success: false, error: "Failed to fetch watch history" };
    }
}

export async function getContinueWatching() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return { success: false, error: "Unauthorized" };
        }

        const { userIdCandidates } = await resolveLibraryUser(session.user);
        if (!userIdCandidates.length) {
            return { success: false, error: "User not found" };
        }

        // Dùng aggregation để chỉ lấy TẬP MỚI NHẤT mỗi phim (group by movieId)
        // Không lọc progress < 99 nữa để đảm bảo hiển thị đúng tập xem gần nhất (kể cả khi đã xem gần hết/100%)
        const continueWatching = await WatchHistory.aggregate([
            {
                $match: {
                    userId: { $in: userIdCandidates },
                }
            },
            { $sort: { lastWatched: -1 } },
            {
                // Nhóm theo movieId, lấy record đầu tiên (mới nhất)
                $group: {
                    _id: "$movieId",
                    doc: { $first: "$$ROOT" }
                }
            },
            { $replaceRoot: { newRoot: "$doc" } },
            { $sort: { lastWatched: -1 } },
            { $limit: 10 }
        ]);

        return { success: true, data: continueWatching };
    } catch (error) {
        console.error("Get continue watching error:", error);
        return { success: false, error: "Failed to fetch continue watching" };
    }
}

export async function removeWatchHistory(historyId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return { success: false, error: "Unauthorized" };
        }

        const { userIdCandidates } = await resolveLibraryUser(session.user);
        if (!userIdCandidates.length) {
            return { success: false, error: "User not found" };
        }

        await WatchHistory.findOneAndDelete({
            _id: historyId,
            userId: { $in: userIdCandidates },
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
        if (!session?.user) {
            return { success: false, error: "Unauthorized" };
        }

        const { userIdCandidates } = await resolveLibraryUser(session.user);
        if (!userIdCandidates.length) {
            return { success: false, error: "User not found" };
        }

        await WatchHistory.deleteMany({ userId: { $in: userIdCandidates } });

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
        if (!session?.user) {
            return { success: false, error: "Unauthorized", data: null as any };
        }

        const { userIdCandidates } = await resolveLibraryUser(session.user);
        if (!userIdCandidates.length) {
            return { success: false, error: "User not found", data: null };
        }

        const history = await WatchHistory.findOne({
            userId: { $in: userIdCandidates },
            movieId,
            episodeSlug,
        }).lean();

        return { success: true, data: history };
    } catch (error) {
        console.error("Get episode watch history error:", error);
        return { success: false, error: "Failed to get watch history", data: null };
    }
}
