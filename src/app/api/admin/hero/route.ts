import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import CustomHero from "@/models/CustomHero";

// Middleware checks
const checkAdmin = async () => {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
        return false;
    }
    return true;
};

// GET: Fetch all Custom Hero items
export async function GET() {
    try {
        await connectDB();
        const heroes = await CustomHero.find().sort({ order: 1, createdAt: -1 }).lean();
        return NextResponse.json({ success: true, items: heroes }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST: Create a new Custom Hero item
export async function POST(req: Request) {
    try {
        const isAdmin = await checkAdmin();
        if (!isAdmin) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        await connectDB();
        const body = await req.json();
        const { movieId, slug, name, layer_bg, layer_character, layer_logo, order, isActive } = body;

        // Basic validation
        if (!slug || !name || !layer_bg || !layer_character || !layer_logo) {
            return NextResponse.json({ success: false, error: "Missing required layer fields" }, { status: 400 });
        }

        const newHero = await CustomHero.create({
            movieId: movieId || slug,
            slug,
            name,
            layer_bg,
            layer_character,
            layer_logo,
            order: order || 0,
            isActive: isActive !== undefined ? isActive : true,
        });

        return NextResponse.json({ success: true, item: newHero }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
