"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import Favorite from "@/models/Favorite";
import { revalidatePath } from "next/cache";

export async function addFavorite(movieData: {
    movieId: string;
    movieSlug: string;
    movieName: string;
    movieOriginName: string;
    moviePoster: string;
    movieYear: number;
    movieQuality: string;
    movieCategories: string[];
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        await dbConnect();

        const favorite = await Favorite.create({
            userId: session.user.id,
            ...movieData,
        });

        revalidatePath("/phim-yeu-thich");
        revalidatePath(`/phim/${movieData.movieSlug}`);
        return { success: true, data: favorite };
    } catch (error: any) {
        // Handle duplicate key error
        if (error.code === 11000) {
            return { success: false, error: "Already in favorites" };
        }
        console.error("Add favorite error:", error);
        return { success: false, error: "Failed to add to favorites" };
    }
}

export async function removeFavorite(movieId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        await dbConnect();

        const deleted = await Favorite.findOneAndDelete({
            userId: session.user.id,
            movieId,
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
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        await dbConnect();

        const favorites = await Favorite.find({ userId: session.user.id })
            .sort({ addedAt: -1 })
            .lean();

        return { success: true, data: favorites };
    } catch (error) {
        console.error("Get favorites error:", error);
        return { success: false, error: "Failed to fetch favorites" };
    }
}

export async function isFavorite(movieId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: true, isFavorite: false };
        }

        await dbConnect();

        const favorite = await Favorite.findOne({
            userId: session.user.id,
            movieId,
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
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        await dbConnect();

        const favorites = await Favorite.find({
            userId: session.user.id,
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
