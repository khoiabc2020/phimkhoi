import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import mongoose from "mongoose";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ slugs: [] });
        }
        // Guard against non-ObjectId mock IDs (e.g. admin accounts)
        if (!mongoose.isValidObjectId(session.user.id)) {
            return NextResponse.json({ slugs: [] });
        }

        await dbConnect();
        const user = await User.findById(session.user.id).select("watchlist").lean();
        const slugs = (user as any)?.watchlist || [];
        return NextResponse.json({ slugs });
    } catch (error) {
        console.error("GET /api/user/watchlist error:", error);
        return NextResponse.json({ slugs: [] });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || !mongoose.isValidObjectId(session.user.id)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { slug, action } = await req.json();
        if (!slug) {
            return NextResponse.json({ error: "Missing slug" }, { status: 400 });
        }

        await dbConnect();

        const update = action === "add" 
            ? { $addToSet: { watchlist: slug } } 
            : { $pull: { watchlist: slug } };

        const user = await User.findByIdAndUpdate(
            session.user.id,
            update,
            { new: true, select: "watchlist" }
        );

        return NextResponse.json({ slugs: (user as any)?.watchlist || [] });
    } catch (error) {
        console.error("POST /api/user/watchlist error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
