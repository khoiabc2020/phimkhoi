import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { API_URL, OPHIM_API, NGUONC_API, fetchWithFastTimeout } from "@/services/api";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ notifications: [] });
    }

    try {
        // 1. Fetch user's favorites from DB (simulated here for demonstration)
        // In reality, this would query your DB for the user's movie IDs/slugs
        const favoritesRes = await fetch(`${process.env.NEXTAUTH_URL}/api/user/favorites`, {
            headers: { cookie: req.headers.get("cookie") || "" }
        });
        const favoritesData = await favoritesRes.json();
        const favorites = favoritesData.favorites || [];

        if (favorites.length === 0) {
            return NextResponse.json({ notifications: [] });
        }

        // 2. Fetch the latest updated movies to compare (from OPhim/KKPhim)
        const latestRes = await fetch(`${API_URL}/v1/api/danh-sach/phim-moi-cap-nhat?limit=30`);
        const latestData = await latestRes.json();
        const latestMovies = latestData.data?.items || [];

        // 3. Find matches: favorites that have a NEWER episode than what's stored in DB
        const updates = [];
        for (const fav of favorites) {
            const update = latestMovies.find((m: any) => m.slug === fav.movieSlug);
            if (update) {
                // If current episode from API is different from last recorded episode
                const currentEp = update.episode_current || "";
                if (currentEp !== fav.lastEpisode) {
                    updates.push({
                        id: update._id || update.id,
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

        return NextResponse.json({ notifications: updates.slice(0, 10) });

    } catch (error) {
        console.error("Notification API Error:", error);
        return NextResponse.json({ notifications: [] }, { status: 500 });
    }
}
