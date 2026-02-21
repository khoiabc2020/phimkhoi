import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Playlist from "@/models/Playlist";
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
    } catch (error) {
        return null;
    }
};

export async function GET(req: Request) {
    try {
        const userPayload = verifyToken(req);
        if (!userPayload) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const playlists = await Playlist.find({ userId: userPayload.id })
            .sort({ updatedAt: -1 })
            .lean();

        return NextResponse.json({ data: playlists });
    } catch (error) {
        console.error("Get Mobile Playlists Error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const userPayload = verifyToken(req);
        if (!userPayload) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { name } = await req.json();

        if (!name || typeof name !== "string") {
            return NextResponse.json(
                { message: "Tên danh sách không hợp lệ" },
                { status: 400 }
            );
        }

        await dbConnect();

        const duplicate = await Playlist.findOne({ userId: userPayload.id, name: name.trim() });
        if (duplicate) {
            return NextResponse.json({ message: "Tên danh sách đã tồn tại" }, { status: 400 });
        }

        const newPlaylist = await Playlist.create({
            userId: userPayload.id,
            name: name.trim(),
            movies: [],
        });

        return NextResponse.json({ data: newPlaylist });
    } catch (error) {
        console.error("Post Mobile Playlist Error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
