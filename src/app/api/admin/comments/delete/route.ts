import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import Comment from "@/models/Comment";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { ids } = await req.json();

        if (!ids || !Array.isArray(ids)) {
            return NextResponse.json({ error: "Invalid comment IDs" }, { status: 400 });
        }

        await dbConnect();
        await Comment.deleteMany({ _id: { $in: ids } });

        return NextResponse.json({ success: true, message: `Deleted ${ids.length} comments` });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
