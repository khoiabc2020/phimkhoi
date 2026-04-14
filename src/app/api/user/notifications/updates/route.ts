import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ notifications: [] });
    }

    try {
        await dbConnect();
        const Notification = (await import("@/models/Notification")).Notification;
        const { resolveLibraryUser } = await import("@/lib/user-library");

        const { userObjectId } = await resolveLibraryUser(session.user);
        const userId = String(userObjectId || session.user.id || "").trim();

        // Đọc từ DB — được tạo bởi scripts/notify-favorites.mjs
        const notifications = await (Notification as any).find({
            isGlobal: false,
            userId,
        })
            .sort({ createdAt: -1 })
            .limit(100) // fetch more, then deduplicate
            .lean();

        // Deduplicate: keep only the most recent notification per movieSlug
        const seenSlugs = new Set<string>();
        const deduped = notifications.filter((n: any) => {
            const slug = n.movieSlug || n.link?.replace("/phim/", "") || String(n._id);
            if (seenSlugs.has(slug)) return false;
            seenSlugs.add(slug);
            return true;
        }).slice(0, 30);

        const formatted = deduped.map((n: any) => ({
            id: String(n._id),
            movieName: n.title?.replace(" có tập mới!", "").replace(" có tập mới", "") || "",
            movieSlug: n.movieSlug || n.link?.replace("/phim/", "") || "",
            moviePoster: n.moviePoster || "",
            newEpisode: n.newEpisode || "",
            updatedAt: n.createdAt ? new Date(n.createdAt).toLocaleDateString("vi-VN", {
                hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit"
            }) : "",
            isRead: n.isRead || false,
        }));

        return NextResponse.json({ success: true, notifications: formatted });

    } catch (error) {
        console.error("Notification API Error:", error);
        return NextResponse.json({ success: false, notifications: [] }, { status: 500 });
    }
}

// PATCH — đánh dấu tất cả đã đọc
export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        await dbConnect();
        const Notification = (await import("@/models/Notification")).Notification;
        const { resolveLibraryUser } = await import("@/lib/user-library");

        const { userObjectId } = await resolveLibraryUser(session.user);
        const userId = String(userObjectId || session.user.id || "").trim();

        await (Notification as any).updateMany(
            { isGlobal: false, userId, isRead: false },
            { $set: { isRead: true } }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
