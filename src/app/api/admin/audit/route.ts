import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import AuditLog from "@/models/AuditLog";
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
        const action = searchParams.get("action");
        const entity = searchParams.get("entity");
        const adminId = searchParams.get("adminId");
        const skip = (page - 1) * limit;

        const filter: Record<string, unknown> = {};
        if (action) filter.action = { $regex: action, $options: "i" };
        if (entity) filter.entity = entity;
        if (adminId) filter.adminId = adminId;

        const [logs, total] = await Promise.all([
            AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            AuditLog.countDocuments(filter),
        ]);

        return NextResponse.json({
            logs,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error("Audit Log GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const body = await req.json();

        const log = await AuditLog.create({
            ...body,
            adminId: session.user.id,
            adminName: session.user.name,
            adminEmail: session.user.email,
        });

        return NextResponse.json({ log });
    } catch (error) {
        console.error("Audit Log POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
