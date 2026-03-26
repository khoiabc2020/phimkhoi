import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getMergedWatchlist, mapWatchlistMovieToApi } from "@/lib/user-library";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ items: [] });
        }

        const watchlist = await getMergedWatchlist(session.user);
        const items = watchlist.movies.slice(0, 12).map(mapWatchlistMovieToApi);
        return NextResponse.json(
            { items },
            {
                headers: {
                    "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
                },
            }
        );
    } catch (error) {
        console.error("GET /api/user/watchlist-items error:", error);
        return NextResponse.json({ items: [] });
    }
}
