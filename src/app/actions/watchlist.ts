"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { getMergedWatchlist, setWatchlistMembership } from "@/lib/user-library";

export async function addToWatchlist(slug: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return { success: false, error: "Unauthorized" };
        }

        const result = await setWatchlistMembership(session.user, slug, "add");
        if (!result.success) return result;

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

        const result = await setWatchlistMembership(session.user, slug, "remove");
        if (!result.success) return result;

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

        const watchlist = await getMergedWatchlist(session.user);
        const exists = watchlist.slugs.includes(slug);

        return { success: true, isInWatchlist: exists };
    } catch (error) {
        console.error("Check watchlist error:", error);
        return { success: true, isInWatchlist: false };
    }
}
