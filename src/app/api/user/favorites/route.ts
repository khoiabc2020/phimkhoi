import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Favorite from "@/models/Favorite";
import { resolveLibraryUser } from "@/lib/user-library";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: true, favorites: [], movies: [] });
        }

        const { userIdCandidates } = await resolveLibraryUser(session.user);
        if (!userIdCandidates.length) {
            return NextResponse.json({ success: true, favorites: [], movies: [] });
        }

        const favorites = await Favorite.find({ userId: { $in: userIdCandidates } })
            .sort({ addedAt: -1 })
            .limit(200)
            .lean();

        const movies = favorites.map((f: any) => ({
            slug: f.movieSlug,
            name: f.movieName,
            poster: f.moviePoster,
            year: f.movieYear,
            quality: f.movieQuality,
            movieSlug: f.movieSlug,
            movieName: f.movieName,
            moviePoster: f.moviePoster,
            movieYear: f.movieYear,
            movieQuality: f.movieQuality,
            lastEpisode: f.lastEpisode,
        }));

        return NextResponse.json({ success: true, favorites: movies, movies });
    } catch (error) {
        console.error("GET /api/user/favorites error:", error);
        return NextResponse.json({ success: true, favorites: [], movies: [] });
    }
}
