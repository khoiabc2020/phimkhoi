import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Notification } from "@/models/Notification";

export async function GET(req: Request) {
    try {
        await dbConnect();
        
        // Fetch all global notifications
        const notifications = await Notification.find({ isGlobal: true })
            .sort({ createdAt: -1 })
            .limit(50); // Just fetch the 50 most recent notifications for users

        return NextResponse.json(notifications);
    } catch (error) {
        console.error("Fetch notifications error:", error);
        return NextResponse.json({ error: "Lỗi Server" }, { status: 500 });
    }
}
