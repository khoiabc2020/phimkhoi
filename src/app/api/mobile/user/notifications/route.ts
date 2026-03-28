import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import jwt from "jsonwebtoken";

const verifyToken = (req: Request) => {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.split(" ")[1];
    try {
        return jwt.verify(
            token,
            process.env.NEXTAUTH_SECRET || "fallback_secret"
        ) as { id: string };
    } catch {
        return null;
    }
};

// GET — lấy thông báo của user (phim yêu thích có tập mới)
export async function GET(req: NextRequest) {
    const userPayload = verifyToken(req as any);
    if (!userPayload) {
        return NextResponse.json({ notifications: [] }, { status: 401 });
    }

    try {
        await dbConnect();
        const { Notification } = await import("@/models/Notification");

        const notifications = await (Notification as any)
            .find({ isGlobal: false, userId: userPayload.id })
            .sort({ createdAt: -1 })
            .limit(30)
            .lean();

        const formatted = notifications.map((n: any) => ({
            id: String(n._id),
            title: n.title || "",
            movieName: n.title?.replace(" có tập mới!", "") || "",
            movieSlug: n.movieSlug || n.link?.replace("/phim/", "") || "",
            moviePoster: n.moviePoster || "",
            newEpisode: n.newEpisode || "",
            message: n.message || "",
            isRead: n.isRead || false,
            createdAt: n.createdAt ? new Date(n.createdAt).toISOString() : "",
            updatedAt: n.createdAt
                ? new Date(n.createdAt).toLocaleDateString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "2-digit",
                  })
                : "",
        }));

        return NextResponse.json({ success: true, notifications: formatted });
    } catch (error) {
        console.error("Mobile Notification GET Error:", error);
        return NextResponse.json({ success: false, notifications: [] }, { status: 500 });
    }
}

// PATCH — đánh dấu tất cả là đã đọc
export async function PATCH(req: NextRequest) {
    const userPayload = verifyToken(req as any);
    if (!userPayload) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await dbConnect();
        const { Notification } = await import("@/models/Notification");

        await (Notification as any).updateMany(
            { isGlobal: false, userId: userPayload.id, isRead: false },
            { $set: { isRead: true } }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Mobile Notification PATCH Error:", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
