"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { revalidatePath } from "next/cache";

export async function addToWatchlist(slug: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        await dbConnect();

        const user = await User.findById(session.user.id);
        if (!user) return { success: false, error: "User not found" };

        if (!user.watchlist.includes(slug)) {
            user.watchlist.push(slug);
            await user.save();
        }

        revalidatePath(`/phim/${slug}`);
        return { success: true };
    } catch (error) {
        console.error("Add watchlist error:", error);
        return { success: false, error: "Failed to add to watchlist" };
    }
}

export async function removeFromWatchlist(slug: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        await dbConnect();

        const user = await User.findById(session.user.id);
        if (!user) return { success: false, error: "User not found" };

        user.watchlist = user.watchlist.filter((s: string) => s !== slug);
        await user.save();

        revalidatePath(`/phim/${slug}`);
        return { success: true };
    } catch (error) {
        console.error("Remove watchlist error:", error);
        return { success: false, error: "Failed to remove from watchlist" };
    }
}

export async function isInWatchlist(slug: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: true, isInWatchlist: false };
        }

        await dbConnect();

        const user = await User.findById(session.user.id);
        const exists = user && user.watchlist ? user.watchlist.includes(slug) : false;

        return { success: true, isInWatchlist: exists };
    } catch (error) {
        console.error("Check watchlist error:", error);
        return { success: true, isInWatchlist: false };
    }
}
