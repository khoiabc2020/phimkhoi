import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";

// Lightweight — chỉ trả về số unread, dùng cho badge trên header bell
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ count: 0 });

    try {
        await dbConnect();
        const Notification = (await import("@/models/Notification")).Notification;
        const { resolveLibraryUser } = await import("@/lib/user-library");

        const { userObjectId } = await resolveLibraryUser(session.user);
        const userId = String(userObjectId || session.user.id || "").trim();

        const count = await (Notification as any).countDocuments({
            isGlobal: false,
            userId,
            isRead: false,
        });

        return NextResponse.json({ count }, {
            headers: { "Cache-Control": "no-store" }
        });
    } catch {
        return NextResponse.json({ count: 0 });
    }
}
