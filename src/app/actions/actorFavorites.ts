"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

function isValidId(id: string | undefined | null): boolean {
    return !!id && mongoose.isValidObjectId(id);
}

export async function addFavoriteActor(actorName: string, pathToRevalidate?: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!isValidId(session?.user?.id)) {
            return { success: false, error: "Unauthorized" };
        }

        await dbConnect();

        const user = await User.findById(session!.user.id);
        if (!user) return { success: false, error: "User not found" };

        if (!user.favoriteActors.includes(actorName)) {
            user.favoriteActors.push(actorName);
            await user.save();
        }

        if (pathToRevalidate) {
            revalidatePath(pathToRevalidate);
        }
        return { success: true };
    } catch (error) {
        console.error("Add favorite actor error:", error);
        return { success: false, error: "Failed to add to favorite actors" };
    }
}

export async function removeFavoriteActor(actorName: string, pathToRevalidate?: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!isValidId(session?.user?.id)) {
            return { success: false, error: "Unauthorized" };
        }

        await dbConnect();

        const user = await User.findById(session!.user.id);
        if (!user) return { success: false, error: "User not found" };

        if (user.favoriteActors.includes(actorName)) {
            user.favoriteActors = user.favoriteActors.filter((name) => name !== actorName);
            await user.save();
        }

        if (pathToRevalidate) {
            revalidatePath(pathToRevalidate);
        }
        return { success: true };
    } catch (error) {
        console.error("Remove favorite actor error:", error);
        return { success: false, error: "Failed to remove from favorite actors" };
    }
}

export async function checkFavoriteActor(actorName: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!isValidId(session?.user?.id)) {
            return { isFavorite: false };
        }

        await dbConnect();

        const user = await User.findById(session!.user.id).select("favoriteActors").lean();
        const isFavorite = (user as any)?.favoriteActors?.includes(actorName) || false;

        return { isFavorite };
    } catch (error) {
        return { isFavorite: false };
    }
}
