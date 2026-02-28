import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
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
