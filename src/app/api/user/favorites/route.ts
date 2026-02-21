import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Favorite from "@/models/Favorite";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { slug } = await req.json();
        if (!slug) {
            return NextResponse.json({ error: "Slug is required" }, { status: 400 });
        }

        await dbConnect();

        const existingFav = await Favorite.findOne({
            userId: session.user.id,
            movieSlug: slug
        });

        const isFavorite = !!existingFav;

        if (isFavorite) {
            await Favorite.deleteOne({ _id: existingFav._id });
        } else {
            await Favorite.create({
                userId: session.user.id,
                movieSlug: slug,
                movieName: slug, // Placeholder fallback cho API cũ nếu không có params truyền lên
            });
        }

        const updatedFavorites = await Favorite.find({ userId: session.user.id }).lean();
        const formattedArray = updatedFavorites.map(f => f.movieSlug);

        return NextResponse.json({
            favorites: formattedArray,
            isFavorite: !isFavorite
        });

    } catch (error) {
        console.error("Favorites Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const favorites = await Favorite.find({ userId: session.user.id })
            .sort({ addedAt: -1 })
            .lean();

        const formattedArray = favorites.map(f => f.movieSlug);

        return NextResponse.json({ favorites: formattedArray });

    } catch (error) {
        console.error("Favorites Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
