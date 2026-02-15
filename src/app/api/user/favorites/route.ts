import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { authOptions } from "../../auth/[...nextauth]/route"; // We need to export authOptions from route.ts

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions); // Need to extract authOptions
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { slug } = await req.json();
        if (!slug) {
            return NextResponse.json({ error: "Slug is required" }, { status: 400 });
        }

        await dbConnect();
        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const isFavorite = user.favorites.includes(slug);

        if (isFavorite) {
            // Remove
            user.favorites = user.favorites.filter((s) => s !== slug);
        } else {
            // Add
            user.favorites.push(slug);
        }

        await user.save();

        return NextResponse.json({
            favorites: user.favorites,
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
        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ favorites: [] });
        }

        return NextResponse.json({ favorites: user.favorites });

    } catch (error) {
        console.error("Favorites Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
