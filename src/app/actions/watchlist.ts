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

async function resolveSessionUser(session: any) {
    if (!session?.user) return null;
    await dbConnect();

    const sessionId = session.user.id as string | undefined;
    if (isValidId(sessionId)) {
        const byId = await User.findById(sessionId);
        if (byId) return byId;
    }

    // OAuth sessions can carry provider IDs instead of Mongo ObjectId.
    // Fallback to email to keep watchlist/favorite actions working.
    const email = session.user.email as string | undefined;
    if (email) {
        const byEmail = await User.findOne({ email });
        if (byEmail) return byEmail;
    }

    return null;
}

export async function addToWatchlist(slug: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return { success: false, error: "Unauthorized" };
        }

        const user = await resolveSessionUser(session);
        if (!user) return { success: false, error: "User not found" };

        if (!user.watchlist.includes(slug)) {
            user.watchlist.push(slug);
            await user.save();
        }

        revalidatePath(`/phim/${slug}`);
        revalidatePath("/xem-sau");
        revalidatePath("/thu-vien");
        return { success: true };
    } catch (error) {
        console.error("Add watchlist error:", error);
        return { success: false, error: "Failed to add to watchlist" };
    }
}

export async function removeFromWatchlist(slug: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return { success: false, error: "Unauthorized" };
        }

        const user = await resolveSessionUser(session);
        if (!user) return { success: false, error: "User not found" };

        user.watchlist = user.watchlist.filter((s: string) => s !== slug);
        await user.save();

        revalidatePath(`/phim/${slug}`);
        revalidatePath("/xem-sau");
        revalidatePath("/thu-vien");
        return { success: true };
    } catch (error) {
        console.error("Remove watchlist error:", error);
        return { success: false, error: "Failed to remove from watchlist" };
    }
}

export async function isInWatchlist(slug: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return { success: true, isInWatchlist: false };
        }

        const user = await resolveSessionUser(session);
        const exists = user && user.watchlist ? user.watchlist.includes(slug) : false;

        return { success: true, isInWatchlist: exists };
    } catch (error) {
        console.error("Check watchlist error:", error);
        return { success: true, isInWatchlist: false };
    }
}
