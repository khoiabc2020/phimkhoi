import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));
        const search = searchParams.get("search") || "";
        const role = searchParams.get("role") || "";
        const skip = (page - 1) * limit;

        const filter: Record<string, unknown> = {};
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }
        if (role && (role === "admin" || role === "user")) {
            filter.role = role;
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .select("-password -resetPasswordToken -resetPasswordExpires -history -favorites -watchlist -favoriteActors")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments(filter),
        ]);

        return NextResponse.json({
            users,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
