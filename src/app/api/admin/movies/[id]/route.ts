import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import MovieModel from "@/models/Movie";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { normalizeMovieImages } from "@/lib/movie-media";

function slugifyText(value: string): string {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function normalizeStringList(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.map((item) => String(item || "").trim()).filter(Boolean);
    }

    return String(value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

function normalizeNamedList(value: unknown): { name: string; slug: string }[] {
    if (Array.isArray(value)) {
        return value
            .map((item) => {
                if (!item) return null;
                if (typeof item === "string") {
                    const name = item.trim();
                    return name ? { name, slug: slugifyText(name) } : null;
                }

                const name = String((item as any).name || "").trim();
                const slug = String((item as any).slug || slugifyText(name)).trim();
                return name ? { name, slug: slug || slugifyText(name) } : null;
            })
            .filter(Boolean) as { name: string; slug: string }[];
    }

    return String(value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((name) => ({ name, slug: slugifyText(name) }));
}

function normalizeMoviePayload(payload: any, existingMovie: any) {
    const name = String(payload?.name || existingMovie?.name || "").trim();
    const slug = String(payload?.slug || existingMovie?.slug || slugifyText(name)).trim();
    const images = normalizeMovieImages({
        poster_url: payload?.poster_url || existingMovie?.poster_url || "",
        thumb_url: payload?.thumb_url || existingMovie?.thumb_url || "",
    });

    return {
        _id: String(existingMovie?._id),
        name,
        slug,
        origin_name: String(payload?.origin_name || existingMovie?.origin_name || "").trim(),
        content: String(payload?.content || existingMovie?.content || "").trim(),
        type: String(payload?.type || existingMovie?.type || "series").trim(),
        status: String(payload?.status || existingMovie?.status || "").trim(),
        thumb_url: images.thumb_url,
        poster_url: images.poster_url,
        is_copyright: Boolean(payload?.is_copyright ?? existingMovie?.is_copyright ?? false),
        sub_docquyen: Boolean(payload?.sub_docquyen ?? existingMovie?.sub_docquyen ?? false),
        chieurap: Boolean(payload?.chieurap ?? existingMovie?.chieurap ?? false),
        trailer_url: String(payload?.trailer_url || existingMovie?.trailer_url || "").trim(),
        time: String(payload?.time || existingMovie?.time || "").trim(),
        episode_current: String(payload?.episode_current || existingMovie?.episode_current || "").trim(),
        episode_total: String(payload?.episode_total || existingMovie?.episode_total || "").trim(),
        quality: String(payload?.quality || existingMovie?.quality || "").trim(),
        lang: String(payload?.lang || existingMovie?.lang || "").trim(),
        notify: String(payload?.notify || existingMovie?.notify || "").trim(),
        showtimes: String(payload?.showtimes || existingMovie?.showtimes || "").trim(),
        year: Number(payload?.year || existingMovie?.year || 0) || 0,
        view: Number(payload?.view || existingMovie?.view || 0) || 0,
        actor: normalizeStringList(payload?.actor ?? existingMovie?.actor ?? []),
        director: normalizeStringList(payload?.director ?? existingMovie?.director ?? []),
        category: normalizeNamedList(payload?.category ?? existingMovie?.category ?? []),
        country: normalizeNamedList(payload?.country ?? existingMovie?.country ?? []),
        episodes: Array.isArray(payload?.episodes) ? payload.episodes : existingMovie?.episodes || [],
        tmdbData: payload?.tmdbData ?? existingMovie?.tmdbData ?? null,
        updatedAt: new Date(),
    };
}

async function requireAdmin() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
        return null;
    }
    return session;
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await requireAdmin();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const { id } = await context.params;

        const item = await MovieModel.findById(id).lean();
        if (!item) {
            return NextResponse.json({ error: "Movie not found" }, { status: 404 });
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

        const existingMovie = await MovieModel.findById(id).lean();
        if (!existingMovie) {
            return NextResponse.json({ error: "Movie not found" }, { status: 404 });
        }

        const nextSlug = String(body?.slug || existingMovie.slug || "").trim();
        if (nextSlug && nextSlug !== existingMovie.slug) {
            const duplicatedSlug = await MovieModel.findOne({ slug: nextSlug, _id: { $ne: id } }).lean();
            if (duplicatedSlug) {
                return NextResponse.json({ error: "Slug đã tồn tại." }, { status: 409 });
            }
        }

        const item = await MovieModel.findOneAndUpdate(
            { _id: id },
            { $set: normalizeMoviePayload(body, existingMovie) },
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

        const deleted = await MovieModel.findByIdAndDelete(id).lean();
        if (!deleted) {
            return NextResponse.json({ error: "Movie not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}
