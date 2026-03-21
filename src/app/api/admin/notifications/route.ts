import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Notification } from "@/models/Notification";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        
        const notifications = await Notification.find({})
            .sort({ createdAt: -1 })
            .limit(100);

        return NextResponse.json(notifications);
    } catch (error) {
        console.error("Fetch notifications error:", error);
        return NextResponse.json({ error: "Lỗi Server" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { title, message, link, type, isGlobal } = body;

        if (!title || !message) {
            return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
        }

        await dbConnect();

        const newNotification = await Notification.create({
            title,
            message,
            link: link || "",
            type: type || "info",
            isGlobal: isGlobal !== undefined ? isGlobal : true,
        });

        return NextResponse.json(newNotification, { status: 201 });
    } catch (error) {
        console.error("Create notification error:", error);
        return NextResponse.json({ error: "Lỗi Server" }, { status: 500 });
    }
}
