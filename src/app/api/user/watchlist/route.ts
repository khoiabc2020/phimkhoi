import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getMergedWatchlist, mapWatchlistMovieToApi, setWatchlistMembership } from "@/lib/user-library";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ slugs: [], movies: [] });
        }

        const watchlist = await getMergedWatchlist(session.user);
        return NextResponse.json({
            slugs: watchlist.slugs,
            movies: watchlist.movies.map(mapWatchlistMovieToApi),
        });
    } catch (error) {
        console.error("GET /api/user/watchlist error:", error);
        return NextResponse.json({ slugs: [], movies: [] });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { slug, action } = await req.json();
        if (!slug) {
            return NextResponse.json({ error: "Missing slug" }, { status: 400 });
        }

        const result = await setWatchlistMembership(
            session.user,
            slug,
            action === "add" ? "add" : "remove"
        );

        if (!result.success) {
            return NextResponse.json({ error: result.error || "Failed to update watchlist" }, { status: 400 });
        }

        return NextResponse.json({
            slugs: result.slugs || [],
            movies: (result.movies || []).map(mapWatchlistMovieToApi),
        });
    } catch (error) {
        console.error("POST /api/user/watchlist error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
