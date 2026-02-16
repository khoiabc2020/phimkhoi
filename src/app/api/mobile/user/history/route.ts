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

        // Get slugs from history
        const historySlugs = user.history.map((h: any) => h.slug);

        // Fetch movies
        const movies = await Movie.find({ slug: { $in: historySlugs } })
            .select("name slug thumb_url poster_url _id");

        // Map history to include movie details
        // We want to keep the order/details of history (timestamp, episode, progress)
        // but add movie info.
        const enrichedHistory = user.history.map((h: any) => {
            const movie = movies.find((m: any) => m.slug === h.slug);
            if (!movie) return null;
            return {
                ...h.toObject(), // Convert mongoose subdocument to object
                movie: {
                    name: movie.name,
                    thumb_url: movie.thumb_url,
                    poster_url: movie.poster_url,
                    _id: movie._id
                }
            };
        }).filter(Boolean).sort((a: any, b: any) => b.timestamp - a.timestamp); // Sort by newest

        return NextResponse.json({ history: enrichedHistory });
    } catch (error) {
        console.error("Get History Error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const userPayload = verifyToken(req);
        if (!userPayload) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { slug, episode, progress } = await req.json();
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

        // Check if entry exists in history
        const existingIndex = user.history.findIndex((h: any) => h.slug === slug);

        if (existingIndex > -1) {
            // Update existing
            user.history[existingIndex].episode = episode || user.history[existingIndex].episode;
            user.history[existingIndex].progress = progress || user.history[existingIndex].progress;
            user.history[existingIndex].timestamp = Date.now();
        } else {
            // Add new
            user.history.push({
                slug,
                episode: episode || "",
                progress: progress || 0,
                timestamp: Date.now(),
            });
        }

        // Keep history limited
        if (user.history.length > 100) {
            user.history.sort((a: any, b: any) => b.timestamp - a.timestamp);
            user.history = user.history.slice(0, 100);
        }

        await user.save();

        return NextResponse.json({ history: user.history });
    } catch (error) {
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
