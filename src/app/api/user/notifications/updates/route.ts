import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getMoviesList } from "@/services/api";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ notifications: [] });
    }

    try {
        // 1. Fetch user's favorites from DB via internal API
        // We use the absolute URL for the server-side fetch
        const favoritesRes = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/user/favorites`, {
            headers: { cookie: req.headers.get("cookie") || "" },
            cache: 'no-store'
        });
        
        if (!favoritesRes.ok) throw new Error("Failed to fetch favorites");
        
        const favoritesData = await favoritesRes.json();
        const favorites = favoritesData.favorites || [];

        if (favorites.length === 0) {
            return NextResponse.json({ notifications: [] });
        }

        // 2. Fetch the latest updated movies using our ELITE service layer
        // This handles merging from KKPhim, OPhim, and NguonC automatically
        const latestData = await getMoviesList("phim-moi-cap-nhat", { limit: 120 });
        const latestMovies = latestData.items || [];

        // 3. Find matches: favorites that have a NEWER episode than what's stored in DB
        const updates = [];
        for (const fav of favorites) {
            const update = latestMovies.find((m: any) => m.slug === fav.movieSlug);
            if (update) {
                // If current episode from API is different from last recorded episode in DB
                const currentEp = update.episode_current || "";
                if (currentEp && currentEp !== fav.lastEpisode) {
                    updates.push({
                        id: update._id || update.slug,
                        movieName: update.name || fav.movieName,
                        movieSlug: update.slug,
                        moviePoster: update.thumb_url || update.poster_url || fav.moviePoster,
                        newEpisode: currentEp,
                        updatedAt: "Vừa mới xong",
                        isRead: false
                    });
                }
            }
        }

        return NextResponse.json({ 
            success: true, 
            notifications: updates.slice(0, 15) 
        });

    } catch (error) {
        console.error("Notification API Error:", error);
        return NextResponse.json({ 
            success: false, 
            notifications: [],
            error: "Failed to sync updates" 
        }, { status: 500 });
    }
}
