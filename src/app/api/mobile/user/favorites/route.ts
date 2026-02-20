import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Favorite from "@/models/Favorite";
import jwt from "jsonwebtoken";

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

        await dbConnect();

        const favorites = await Favorite.find({ userId: userPayload.id })
            .sort({ addedAt: -1 })
            .lean();

        return NextResponse.json({ favorites });
    } catch (error) {
        console.error("Get Favorites Error:", error);
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

        // Validate required field
        if (!movieData.movieSlug) {
            return NextResponse.json(
                { message: "movieSlug is required" },
                { status: 400 }
            );
        }

        // movieName is required by schema - provide fallback
        if (!movieData.movieName) {
            return NextResponse.json(
                { message: "movieName is required" },
                { status: 400 }
            );
        }

        // moviePoster fallback
        if (!movieData.moviePoster) {
            movieData.moviePoster = "";
        }

        // movieYear fallback
        if (!movieData.movieYear) {
            movieData.movieYear = new Date().getFullYear();
        }

        await dbConnect();

        try {
            await Favorite.create({
                userId: userPayload.id,
                ...movieData,
            });
        } catch (e: any) {
            // Ignore duplicate key error (11000) - already favorited
            if (e.code !== 11000) {
                console.error("Favorite create error:", e);
                throw e;
            }
        }

        // Return populated list
        const favorites = await Favorite.find({ userId: userPayload.id })
            .sort({ addedAt: -1 })
            .lean();

        return NextResponse.json({ favorites });
    } catch (error) {
        console.error("Post Favorites Error:", error);
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

        await dbConnect();

        await Favorite.findOneAndDelete({
            userId: userPayload.id,
            movieSlug: slug,
        });

        // Return populated list
        const favorites = await Favorite.find({ userId: userPayload.id })
            .sort({ addedAt: -1 })
            .lean();

        return NextResponse.json({ favorites });
    } catch (error) {
        console.error("Delete Favorites Error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
