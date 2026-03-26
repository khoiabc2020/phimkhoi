import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import MovieModel from "@/models/Movie";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getMovieDetail } from "@/services/api";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

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
        return value
            .map((item) => String(item || "").trim())
            .filter(Boolean);
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

function normalizeMoviePayload(payload: any, existingMovie?: any) {
    const name = String(payload?.name || existingMovie?.name || "").trim();
    const slug = String(payload?.slug || existingMovie?.slug || slugifyText(name)).trim();
    const now = new Date();

    return {
        _id: String(payload?._id || existingMovie?._id || slug),
        name,
        slug,
        origin_name: String(payload?.origin_name || existingMovie?.origin_name || "").trim(),
        content: String(payload?.content || existingMovie?.content || "").trim(),
        type: String(payload?.type || existingMovie?.type || "series").trim(),
        status: String(payload?.status || existingMovie?.status || "").trim(),
        thumb_url: String(payload?.thumb_url || existingMovie?.thumb_url || "").trim(),
        poster_url: String(payload?.poster_url || existingMovie?.poster_url || "").trim(),
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
        episodes: Array.isArray(payload?.episodes)
            ? payload.episodes
            : Array.isArray(existingMovie?.episodes)
                ? existingMovie.episodes
                : [],
        tmdbData: payload?.tmdbData ?? existingMovie?.tmdbData ?? null,
        updatedAt: now,
    };
}

async function requireAdmin() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
        return null;
    }
    return session;
}

async function importMovieBySlug(slug: string) {
    const detail = await getMovieDetail(slug);
    if (!detail?.movie) {
        return null;
    }

    const movie = detail.movie as any;

    return normalizeMoviePayload({
        ...movie,
        _id: movie._id || movie.slug,
        episodes: detail.episodes || movie.episodes || [],
    });
}

export async function GET(req: NextRequest) {
    try {
        const session = await requireAdmin();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const searchParams = req.nextUrl.searchParams;
        const page = Math.max(DEFAULT_PAGE, Number(searchParams.get("page") || DEFAULT_PAGE));
        const limit = Math.min(MAX_LIMIT, Math.max(1, Number(searchParams.get("limit") || DEFAULT_LIMIT)));
        const q = String(searchParams.get("q") || "").trim();

        const query = q
            ? {
                $or: [
                    { name: { $regex: q, $options: "i" } },
                    { origin_name: { $regex: q, $options: "i" } },
                    { slug: { $regex: q, $options: "i" } },
                ],
            }
            : {};

        const [totalItems, items] = await Promise.all([
            MovieModel.countDocuments(query),
            MovieModel.find(query)
                .sort({ updatedAt: -1, createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
        ]);

        const totalPages = Math.max(1, Math.ceil(totalItems / limit));

        return NextResponse.json({
            success: true,
            items,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems,
                limit,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await requireAdmin();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const body = await req.json();
        const importSlug = String(body?.slug || "").trim();

        let normalized: any = null;

        if (importSlug) {
            normalized = await importMovieBySlug(importSlug);
            if (!normalized) {
                return NextResponse.json({ error: "Không lấy được dữ liệu phim từ nguồn." }, { status: 404 });
            }
        } else {
            normalized = normalizeMoviePayload(body?.movie || body);
        }

        if (!normalized?.name || !normalized?.slug) {
            return NextResponse.json({ error: "Thiếu tên phim hoặc slug." }, { status: 400 });
        }

        const existingMovie = await MovieModel.findOne({
            $or: [{ slug: normalized.slug }, { _id: normalized._id }],
        }).lean();

        const saved = await MovieModel.findOneAndUpdate(
            existingMovie ? { _id: existingMovie._id } : { _id: normalized._id },
            { $set: normalizeMoviePayload(normalized, existingMovie) },
            { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
        ).lean();

        return NextResponse.json({
            success: true,
            item: saved,
            mode: existingMovie ? "updated" : "created",
        });
    } catch (error: any) {
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}
