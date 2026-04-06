import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import WatchHistory from "@/models/WatchHistory";
import Favorite from "@/models/Favorite";
import Watchlist from "@/models/Watchlist";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createAuditLog } from "@/lib/audit";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        await dbConnect();

        const user = await User.findById(id)
            .select("-password -resetPasswordToken -resetPasswordExpires")
            .lean();
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get counts and watch history from dedicated collections
        const [watchHistory, favoritesCount, watchlistCount] = await Promise.all([
            WatchHistory.find({ userId: id }).sort({ lastWatched: -1 }).limit(30).lean(),
            Favorite.countDocuments({ userId: id }),
            Watchlist.countDocuments({ userId: id }),
        ]);

        return NextResponse.json({ user: { ...user, favoritesCount, watchlistCount }, watchHistory });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        await dbConnect();

        // Prevent admin from changing their own role
        if (id === session.user.id) {
            return NextResponse.json({ error: "Không thể thay đổi vai trò của chính bạn" }, { status: 400 });
        }

        const body = await req.json();
        const allowedFields: Record<string, unknown> = {};

        if (body.role && (body.role === "admin" || body.role === "user")) {
            allowedFields.role = body.role;
        }
        if (body.name && typeof body.name === "string") {
            allowedFields.name = body.name.trim();
        }

        if (Object.keys(allowedFields).length === 0) {
            return NextResponse.json({ error: "Không có trường nào được cập nhật" }, { status: 400 });
        }

        const user = await User.findByIdAndUpdate(id, { $set: allowedFields }, { new: true })
            .select("-password -resetPasswordToken -resetPasswordExpires")
            .lean();

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        await createAuditLog({
            action: body.role ? "CHANGE_USER_ROLE" : "UPDATE_USER",
            entity: "user",
            entityId: id,
            entityName: (user as any).name,
            adminId: session.user.id,
            adminName: session.user.name ?? "",
            adminEmail: session.user.email ?? "",
            details: allowedFields,
        });

        return NextResponse.json({ user });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        if (id === session.user.id) {
            return NextResponse.json({ error: "Không thể xóa tài khoản của chính bạn" }, { status: 400 });
        }

        await dbConnect();

        const user = await User.findById(id).select("name email").lean();
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        await Promise.all([
            User.findByIdAndDelete(id),
            WatchHistory.deleteMany({ userId: id }),
        ]);

        await createAuditLog({
            action: "DELETE_USER",
            entity: "user",
            entityId: id,
            entityName: (user as any).name,
            adminId: session.user.id,
            adminName: session.user.name ?? "",
            adminEmail: session.user.email ?? "",
            details: { email: (user as any).email },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
