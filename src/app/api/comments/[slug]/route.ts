import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import dbConnect from "@/lib/db";
import Comment from "@/models/Comment";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await params;
        await dbConnect();
        const comments = await Comment.find({ movieSlug: slug })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();
        return NextResponse.json({ comments });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await params;

        // 1. Try session (Web)
        const session = await getServerSession(authOptions);
        let user = session?.user;

        // 2. Try JWT Bearer flow (Mobile)
        if (!user) {
            const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
            if (token) {
                user = {
                    id: token.id as string,
                    name: token.name as string,
                    image: token.picture as string,
                    email: token.email as string
                };
            }
        }

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { content } = await req.json();
        if (!content || !content.trim()) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        await dbConnect();
        const comment = await Comment.create({
            userId: user.id || user.email, // fallback if id is somehow missing
            userName: user.name,
            userImage: user.image,
            movieSlug: slug,
            content,
        });

        return NextResponse.json({ comment });
    } catch (error) {
        console.error("Comment Post Error", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
