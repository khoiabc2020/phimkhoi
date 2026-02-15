import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import Rating from "@/models/Rating";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request, { params }: { params: { slug: string } }) {
    try {
        const { slug } = params;
        await dbConnect();

        // Calculate average rating
        const ratings = await Rating.find({ movieSlug: slug }).sort({ createdAt: -1 }).lean();
        const total = ratings.reduce((acc, r) => acc + r.value, 0);
        const average = ratings.length > 0 ? (total / ratings.length).toFixed(1) : 0;

        return NextResponse.json({ average, count: ratings.length });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: { slug: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { value } = await req.json();
        if (!value || value < 1 || value > 10) {
            return NextResponse.json({ error: "Invalid rating value" }, { status: 400 });
        }

        await dbConnect();

        // Upsert rating (update if exists, insert if new)
        const rating = await Rating.findOneAndUpdate(
            { userId: session.user.id, movieSlug: params.slug },
            { value },
            { upsert: true, new: true }
        );

        return NextResponse.json({ rating });
    } catch (error) {
        console.error("Rating Post Error", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
