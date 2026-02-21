import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import Playlist from "@/models/Playlist";
import { authOptions } from "../../auth/[...nextauth]/route";

// Lấy danh sách Playlist của User
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const playlists = await Playlist.find({ userId: session.user.id })
            .sort({ updatedAt: -1 })
            .lean();

        return NextResponse.json({ success: true, data: playlists });
    } catch (error) {
        console.error("Fetch Playlists Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// Tạo Playlist mới
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name } = await req.json();

        if (!name || typeof name !== "string") {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        await dbConnect();

        const duplicate = await Playlist.findOne({ userId: session.user.id, name: name.trim() });
        if (duplicate) {
            return NextResponse.json({ error: "Playlist already exists" }, { status: 400 });
        }

        const newPlaylist = await Playlist.create({
            userId: session.user.id,
            name: name.trim(),
            movies: [],
        });

        return NextResponse.json({ success: true, data: newPlaylist });
    } catch (error) {
        console.error("Create Playlist Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
