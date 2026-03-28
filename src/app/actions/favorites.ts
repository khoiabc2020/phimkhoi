"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Favorite from "@/models/Favorite";
import { revalidatePath } from "next/cache";
import { resolveLibraryUser } from "@/lib/user-library";

export async function addFavorite(movieData: {
    movieId?: string;
    movieSlug: string;
    movieName: string;
    movieOriginName: string;
    moviePoster: string;
    movieYear: number;
    movieQuality: string;
    movieCategories: string[];
    lastEpisode?: string;
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return { success: false, error: "Unauthorized" };
        }

        const { userObjectId } = await resolveLibraryUser(session.user);
        const favoriteUserId = userObjectId || String(session.user.id || "").trim();
        if (!favoriteUserId) {
            return { success: false, error: "User not found" };
        }

        // Lấy episode_current hiện tại từ Movie DB để làm baseline
        // → tránh notify ngay lần đầu (phim đã có sẵn tập X)
        let currentEpisode = movieData.lastEpisode || "";
        if (!currentEpisode) {
            try {
                const MovieModel = (await import("@/models/Movie")).default;
                const movieDoc = await MovieModel.findOne({ slug: movieData.movieSlug }, "episode_current").lean() as any;
                currentEpisode = String(movieDoc?.episode_current || "").trim();
            } catch { /* ignore */ }
        }

        const favorite = await Favorite.create({
            userId: favoriteUserId,
            ...movieData,
            lastEpisode: currentEpisode,
        });

        revalidatePath("/phim-yeu-thich");
        revalidatePath(`/phim/${movieData.movieSlug}`);
        return { success: true, data: favorite };
    } catch (error: any) {
        // Handle duplicate key error
        if (error.code === 11000) {
            return { success: true, error: "Already in favorites", data: movieData };
        }
        console.error("Add favorite error:", error);
        return { success: false, error: "Failed to add to favorites" };
    }
}

export async function removeFavorite(movieSlug: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return { success: false, error: "Unauthorized" };
        }

        const { userIdCandidates } = await resolveLibraryUser(session.user);
        if (!userIdCandidates.length) {
            return { success: false, error: "User not found" };
        }

        const deleted = await Favorite.findOneAndDelete({
            userId: { $in: userIdCandidates },
            movieSlug,
        });

        if (deleted) {
            revalidatePath("/phim-yeu-thich");
            revalidatePath(`/phim/${deleted.movieSlug}`);
        }

        return { success: true };
    } catch (error) {
        console.error("Remove favorite error:", error);
        return { success: false, error: "Failed to remove from favorites" };
    }
}

export async function getFavorites() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return { success: false, error: "Unauthorized" };
        }

        const { userIdCandidates } = await resolveLibraryUser(session.user);
        if (!userIdCandidates.length) {
            return { success: false, error: "User not found" };
        }

        const favorites = await Favorite.find({ userId: { $in: userIdCandidates } })
            .sort({ addedAt: -1 })
            .lean();

        return { success: true, data: favorites };
    } catch (error) {
        console.error("Get favorites error:", error);
        return { success: false, error: "Failed to fetch favorites" };
    }
}

export async function isFavorite(movieSlug: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return { success: true, isFavorite: false };
        }

        const { userIdCandidates } = await resolveLibraryUser(session.user);
        if (!userIdCandidates.length) {
            return { success: true, isFavorite: false };
        }

        const favorite = await Favorite.findOne({
            userId: { $in: userIdCandidates },
            movieSlug,
        });

        return { success: true, isFavorite: !!favorite };
    } catch (error) {
        console.error("Check favorite error:", error);
        return { success: true, isFavorite: false };
    }
}

export async function getFavoritesByCategory(category: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return { success: false, error: "Unauthorized" };
        }

        const { userIdCandidates } = await resolveLibraryUser(session.user);
        if (!userIdCandidates.length) {
            return { success: false, error: "User not found" };
        }

        const favorites = await Favorite.find({
            userId: { $in: userIdCandidates },
            movieCategories: category,
        })
            .sort({ addedAt: -1 })
            .lean();

        return { success: true, data: favorites };
    } catch (error) {
        console.error("Get favorites by category error:", error);
        return { success: false, error: "Failed to fetch favorites" };
    }
}
