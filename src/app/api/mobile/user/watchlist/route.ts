import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getMergedWatchlist, mapWatchlistMovieToApi, setWatchlistMembership } from "@/lib/user-library";

const verifyToken = (req: Request) => {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.split(" ")[1];
    try {
        return jwt.verify(
            token,
            process.env.NEXTAUTH_SECRET || "fallback_secret"
        ) as { id: string };
    } catch (error) {
        return null;
    }
};

export async function GET(req: Request) {
    try {
        const userPayload = verifyToken(req);
        if (!userPayload) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const watchlist = await getMergedWatchlist({ id: userPayload.id });
        return NextResponse.json({ watchlist: watchlist.movies.map(mapWatchlistMovieToApi) });
    } catch (error) {
        console.error("Get Watchlist Error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const userPayload = verifyToken(req);
        if (!userPayload) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const movieData = await req.json();
        if (!movieData.movieSlug) {
            return NextResponse.json(
                { message: "movieSlug is required" },
                { status: 400 }
            );
        }

        const result = await setWatchlistMembership(
            { id: userPayload.id },
            movieData.movieSlug,
            "add",
            {
                movieId: movieData.movieId,
                name: movieData.movieName,
                origin_name: movieData.movieOriginName,
                poster: movieData.moviePoster,
                year: movieData.movieYear,
                quality: movieData.movieQuality,
                categories: movieData.movieCategories,
            }
        );

        if (!result.success) {
            return NextResponse.json({ message: result.error || "Failed to save watchlist" }, { status: 400 });
        }

        return NextResponse.json({ watchlist: (result.movies || []).map(mapWatchlistMovieToApi) });
    } catch (error) {
        console.error("Post Watchlist Error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const userPayload = verifyToken(req);
        if (!userPayload) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { slug } = await req.json();
        if (!slug) {
            return NextResponse.json(
                { message: "Slug is required" },
                { status: 400 }
            );
        }

        const result = await setWatchlistMembership({ id: userPayload.id }, slug, "remove");
        if (!result.success) {
            return NextResponse.json({ message: result.error || "Failed to update watchlist" }, { status: 400 });
        }

        return NextResponse.json({ watchlist: (result.movies || []).map(mapWatchlistMovieToApi) });
    } catch (error) {
        console.error("Delete Watchlist Error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
