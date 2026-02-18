import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Movie from "@/models/Movie";
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
        const user = await User.findById(userPayload.id);
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        const watchlist = await Movie.find({ slug: { $in: user.watchlist } })
            .select("name slug thumb_url poster_url _id");

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

        const { slug } = await req.json();
        if (!slug) {
            return NextResponse.json(
                { message: "Slug is required" },
                { status: 400 }
            );
        }

        await dbConnect();
        const user = await User.findById(userPayload.id);
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        if (!user.watchlist) user.watchlist = [];

        if (!user.watchlist.includes(slug)) {
            user.watchlist.push(slug);
            await user.save();
        }

        // Return populated list
        const watchlist = await Movie.find({ slug: { $in: user.watchlist } })
            .select("name slug thumb_url poster_url _id");

        return NextResponse.json({ watchlist });
    } catch (error) {
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
        const user = await User.findById(userPayload.id);
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        if (user.watchlist) {
            user.watchlist = user.watchlist.filter((s: string) => s !== slug);
            await user.save();
        }

        // Return populated list
        const watchlist = await Movie.find({ slug: { $in: user.watchlist } })
            .select("name slug thumb_url poster_url _id");

        return NextResponse.json({ watchlist });
    } catch (error) {
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
