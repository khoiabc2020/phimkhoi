import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import Favorite from "@/models/Favorite";
import mongoose from "mongoose";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ movies: [] });
        }
        if (!mongoose.isValidObjectId(session.user.id)) {
            return NextResponse.json({ movies: [] });
        }

        await dbConnect();

        const favorites = await Favorite.find({ userId: session.user.id })
            .sort({ createdAt: -1 })
            .limit(200)
            .lean();

        const movies = favorites.map((f: any) => ({
            slug: f.movieSlug,
            name: f.movieName,
            poster: f.moviePoster,
            year: f.movieYear,
            quality: f.movieQuality,
        }));

        return NextResponse.json({ movies });
    } catch (error) {
        console.error("GET /api/user/favorites error:", error);
        return NextResponse.json({ movies: [] });
    }
}
