import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Watchlist from "@/models/Watchlist";
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

        const watchlist = await Watchlist.find({ userId: userPayload.id })
            .sort({ addedAt: -1 })
            .lean();

        return NextResponse.json({ watchlist });
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

        await dbConnect();

        try {
            await Watchlist.create({
                userId: userPayload.id,
                ...movieData,
            });
        } catch (e: any) {
            // Ignore duplicate key error (11000)
            if (e.code !== 11000) throw e;
        }

        const watchlist = await Watchlist.find({ userId: userPayload.id })
            .sort({ addedAt: -1 })
            .lean();

        return NextResponse.json({ watchlist });
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

        await dbConnect();

        await Watchlist.findOneAndDelete({
            userId: userPayload.id,
            movieSlug: slug,
        });

        const watchlist = await Watchlist.find({ userId: userPayload.id })
            .sort({ addedAt: -1 })
            .lean();

        return NextResponse.json({ watchlist });
    } catch (error) {
        console.error("Delete Watchlist Error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
