import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { slug, episode, progress } = await req.json();

        if (!slug) {
            return NextResponse.json({ error: "Slug is required" }, { status: 400 });
        }

        await dbConnect();
        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if item exists in history
        const existingIndex = user.history.findIndex((item) => item.slug === slug);

        if (existingIndex > -1) {
            // Remove existing item to push to top
            user.history.splice(existingIndex, 1);
        }

        // Add to top of history
        user.history.unshift({
            slug,
            episode: episode || "full",
            progress: progress || 0,
            timestamp: Date.now(),
        });

        // Limit history length (e.g., keep last 100 items)
        if (user.history.length > 100) {
            user.history = user.history.slice(0, 100);
        }

        await user.save();

        return NextResponse.json({ success: true, history: user.history });
    } catch (error) {
        console.error("History Error:", error);
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
            return NextResponse.json({ history: [] });
        }

        return NextResponse.json({ history: user.history });
    } catch (error) {
        console.error("History Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
