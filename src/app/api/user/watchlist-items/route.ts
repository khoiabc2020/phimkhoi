import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import mongoose from "mongoose";
import { getMovieDetail } from "@/services/api";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ items: [] });
        }
        if (!mongoose.isValidObjectId(session.user.id)) {
            return NextResponse.json({ items: [] });
        }

        await dbConnect();
        const user = await User.findById(session.user.id).select("watchlist").lean();
        const slugs: string[] = Array.isArray((user as any)?.watchlist) ? (user as any).watchlist : [];
        if (!slugs.length) return NextResponse.json({ items: [] });

        const detailResults = await Promise.all(
            slugs.slice(0, 12).map(async (slug): Promise<any | null> => {
                try {
                    const detail = await getMovieDetail(slug);
                    return detail?.movie || null;
                } catch {
                    return null;
                }
            })
        );

        const items = detailResults.filter(Boolean);
        return NextResponse.json(
            { items },
            {
                headers: {
                    "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
                },
            }
        );
    } catch (error) {
        console.error("GET /api/user/watchlist-items error:", error);
        return NextResponse.json({ items: [] });
    }
}

