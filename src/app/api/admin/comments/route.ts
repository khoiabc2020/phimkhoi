import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import Comment from "@/models/Comment";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        // Fetch latest 100 comments
        const comments = await Comment.find()
            .sort({ createdAt: -1 })
            .limit(100)
            .populate("userId", "name email image") // Populate user details
            .lean();

        return NextResponse.json({ comments });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
