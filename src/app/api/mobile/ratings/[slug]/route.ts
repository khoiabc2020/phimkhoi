import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Rating from "@/models/Rating";
import jwt from "jsonwebtoken";

const verifyToken = (req: Request) => {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.split(" ")[1];
    try {
        return jwt.verify(
            token,
            process.env.NEXTAUTH_SECRET!
        ) as { id: string };
    } catch {
        return null;
    }
};

// GET — public: lấy rating trung bình + rating của user (nếu có token)
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await params;
        await dbConnect();

        const ratings = await Rating.find({ movieSlug: slug }).lean();
        const total = ratings.reduce((acc: number, r: any) => acc + r.value, 0);
        const average = ratings.length > 0 ? parseFloat((total / ratings.length).toFixed(1)) : 0;

        // Lấy rating của user nếu có token
        let userRating: number | null = null;
        const userPayload = verifyToken(req as any);
        if (userPayload) {
            const myRating = ratings.find((r: any) => String(r.userId) === userPayload.id);
            if (myRating) userRating = (myRating as any).value;
        }

        return NextResponse.json({ average, count: ratings.length, userRating });
    } catch (error) {
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}

// POST — đánh giá phim (JWT auth)
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const userPayload = verifyToken(req as any);
    if (!userPayload) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { slug } = await params;
        const { value } = await req.json();

        if (!value || value < 1 || value > 10) {
            return NextResponse.json({ error: "Giá trị không hợp lệ (1-10)" }, { status: 400 });
        }

        await dbConnect();

        await Rating.findOneAndUpdate(
            { userId: userPayload.id, movieSlug: slug },
            { value },
            { upsert: true, new: true }
        );

        // Trả về rating mới nhất
        const ratings = await Rating.find({ movieSlug: slug }).lean();
        const total = ratings.reduce((acc: number, r: any) => acc + r.value, 0);
        const average = ratings.length > 0 ? parseFloat((total / ratings.length).toFixed(1)) : 0;

        return NextResponse.json({ success: true, average, count: ratings.length, userRating: value });
    } catch (error) {
        console.error("Mobile Rating POST Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
