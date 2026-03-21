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

// PUT: Update a Custom Hero item
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const isAdmin = await checkAdmin();
        if (!isAdmin) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        await connectDB();
        const { id } = await params;
        const body = await req.json();

        const updatedHero = await CustomHero.findByIdAndUpdate(id, body, { new: true, runValidators: true });
        if (!updatedHero) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

        return NextResponse.json({ success: true, item: updatedHero }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE: Remove a Custom Hero item
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const isAdmin = await checkAdmin();
        if (!isAdmin) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        await connectDB();
        const { id } = await params;

        const deleted = await CustomHero.findByIdAndDelete(id);
        if (!deleted) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
