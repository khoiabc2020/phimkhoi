import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import Playlist from "@/models/Playlist";
import { authOptions } from "../../../auth/[...nextauth]/route";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await params;
        const playlistId = resolvedParams.id;
        const { action, movieData, newName } = await req.json();

        await dbConnect();

        const playlist = await Playlist.findOne({ _id: playlistId, userId: session.user.id });
        if (!playlist) {
            return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
        }

        // Logic 1: Đổi tên danh sách
        if (action === "rename" && newName) {
            playlist.name = newName.trim();
            await playlist.save();
            return NextResponse.json({ success: true, data: playlist });
        }

        // Logic 2: Thêm phim
        if (action === "add_movie" && movieData) {
            const isExist = playlist.movies.some((m: any) => m.movieSlug === movieData.movieSlug);
            if (!isExist) {
                playlist.movies.push(movieData);
                await playlist.save();
            }
            return NextResponse.json({ success: true, data: playlist });
        }

        // Logic 3: Xoá phim
        if (action === "remove_movie" && movieData?.movieSlug) {
            playlist.movies = playlist.movies.filter((m: any) => m.movieSlug !== movieData.movieSlug);
            await playlist.save();
            return NextResponse.json({ success: true, data: playlist });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
        console.error("Update Playlist Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await params;
        const playlistId = resolvedParams.id;

        await dbConnect();

        const deleted = await Playlist.findOneAndDelete({ _id: playlistId, userId: session.user.id });
        if (!deleted) {
            return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Playlist deleted" });
    } catch (error) {
        console.error("Delete Playlist Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
