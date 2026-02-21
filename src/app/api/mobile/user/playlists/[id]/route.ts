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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const userPayload = verifyToken(req);
        if (!userPayload) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await params;
        const playlistId = resolvedParams.id;
        const { action, movieData, newName } = await req.json();

        await dbConnect();

        const playlist = await Playlist.findOne({ _id: playlistId, userId: userPayload.id });
        if (!playlist) {
            return NextResponse.json({ message: "Không tìm thấy danh sách" }, { status: 404 });
        }

        if (action === "rename" && newName) {
            playlist.name = newName.trim();
            await playlist.save();
            return NextResponse.json({ data: playlist });
        }

        if (action === "add_movie" && movieData) {
            const isExist = playlist.movies.some((m: any) => m.movieSlug === movieData.movieSlug);
            if (!isExist) {
                playlist.movies.push(movieData);
                await playlist.save();
            }
            return NextResponse.json({ data: playlist });
        }

        if (action === "remove_movie" && movieData?.movieSlug) {
            playlist.movies = playlist.movies.filter((m: any) => m.movieSlug !== movieData.movieSlug);
            await playlist.save();
            return NextResponse.json({ data: playlist });
        }

        return NextResponse.json({ message: "Thao tác không hợp lệ" }, { status: 400 });
    } catch (error) {
        console.error("Update Mobile Playlist Error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const userPayload = verifyToken(req);
        if (!userPayload) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await params;
        const playlistId = resolvedParams.id;

        await dbConnect();

        const deleted = await Playlist.findOneAndDelete({ _id: playlistId, userId: userPayload.id });
        if (!deleted) {
            return NextResponse.json({ message: "Không tìm thấy danh sách" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Đã xoá danh sách" });
    } catch (error) {
        console.error("Delete Mobile Playlist Error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
