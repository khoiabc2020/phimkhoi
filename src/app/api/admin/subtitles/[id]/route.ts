import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import SubtitleModel from "@/models/Subtitle";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

async function requireAdmin() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
        return null;
    }
    return session;
}

function normalizeSubtitlePayload(body: any, existing: any) {
    return {
        _id: String(existing._id),
        movieId: String(body?.movieId ?? existing.movieId ?? "").trim(),
        movieSlug: String(body?.movieSlug ?? existing.movieSlug ?? "").trim(),
        movieName: String(body?.movieName ?? existing.movieName ?? "").trim(),
        episodeSlug: String(body?.episodeSlug ?? existing.episodeSlug ?? "").trim(),
        episodeName: String(body?.episodeName ?? existing.episodeName ?? "").trim(),
        language: String(body?.language ?? existing.language ?? "").trim().toLowerCase(),
        label: String(body?.label ?? existing.label ?? "").trim(),
        format: String(body?.format ?? existing.format ?? "srt").trim().toLowerCase(),
        sourceType: String(body?.sourceType ?? existing.sourceType ?? "url").trim().toLowerCase(),
        sourceName: String(body?.sourceName ?? existing.sourceName ?? "").trim(),
        url: String(body?.url ?? existing.url ?? "").trim(),
        content: String(body?.content ?? existing.content ?? "").trim(),
        isDefault: Boolean(body?.isDefault ?? existing.isDefault ?? false),
        notes: String(body?.notes ?? existing.notes ?? "").trim(),
    };
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await requireAdmin();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const { id } = await context.params;
        const item = await SubtitleModel.findById(id).lean();

        if (!item) {
            return NextResponse.json({ error: "Subtitle not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, item });
    } catch (error: any) {
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await requireAdmin();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const { id } = await context.params;
        const body = await req.json();
        const existing = await SubtitleModel.findById(id).lean();

        if (!existing) {
            return NextResponse.json({ error: "Subtitle not found" }, { status: 404 });
        }

        const item = await SubtitleModel.findOneAndUpdate(
            { _id: id },
            { $set: normalizeSubtitlePayload(body, existing) },
            { new: true, runValidators: true },
        ).lean();

        return NextResponse.json({ success: true, item });
    } catch (error: any) {
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await requireAdmin();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const { id } = await context.params;
        const deleted = await SubtitleModel.findByIdAndDelete(id).lean();

        if (!deleted) {
            return NextResponse.json({ error: "Subtitle not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}
