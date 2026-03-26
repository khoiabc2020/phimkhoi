import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import SubtitleModel from "@/models/Subtitle";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function normalizeId(value: string): string {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
}

async function requireAdmin() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
        return null;
    }
    return session;
}

function normalizeSubtitlePayload(body: any, existing?: any) {
    const movieSlug = String(body?.movieSlug || existing?.movieSlug || "").trim();
    const episodeSlug = String(body?.episodeSlug || existing?.episodeSlug || "").trim();
    const language = String(body?.language || existing?.language || "").trim().toLowerCase();

    return {
        _id: String(existing?._id || `${normalizeId(movieSlug)}:${normalizeId(episodeSlug)}:${normalizeId(language || "sub")}`),
        movieId: String(body?.movieId || existing?.movieId || "").trim(),
        movieSlug,
        movieName: String(body?.movieName || existing?.movieName || "").trim(),
        episodeSlug,
        episodeName: String(body?.episodeName || existing?.episodeName || "").trim(),
        language,
        label: String(body?.label || existing?.label || language.toUpperCase()).trim(),
        format: String(body?.format || existing?.format || "srt").trim().toLowerCase(),
        sourceType: String(body?.sourceType || existing?.sourceType || "url").trim().toLowerCase(),
        sourceName: String(body?.sourceName || existing?.sourceName || "").trim(),
        url: String(body?.url || existing?.url || "").trim(),
        content: String(body?.content || existing?.content || "").trim(),
        isDefault: Boolean(body?.isDefault ?? existing?.isDefault ?? false),
        notes: String(body?.notes || existing?.notes || "").trim(),
    };
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
                    { movieName: { $regex: q, $options: "i" } },
                    { movieSlug: { $regex: q, $options: "i" } },
                    { episodeSlug: { $regex: q, $options: "i" } },
                    { language: { $regex: q, $options: "i" } },
                    { label: { $regex: q, $options: "i" } },
                ],
            }
            : {};

        const [totalItems, items] = await Promise.all([
            SubtitleModel.countDocuments(query),
            SubtitleModel.find(query)
                .sort({ updatedAt: -1, createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .select("-content")
                .lean(),
        ]);

        return NextResponse.json({
            success: true,
            items,
            pagination: {
                currentPage: page,
                totalPages: Math.max(1, Math.ceil(totalItems / limit)),
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
        const normalized = normalizeSubtitlePayload(body);

        if (!normalized.movieSlug || !normalized.movieName || !normalized.episodeSlug || !normalized.language) {
            return NextResponse.json({ error: "Thiếu movieSlug, movieName, episodeSlug hoặc language." }, { status: 400 });
        }

        if (!normalized.url && !normalized.content) {
            return NextResponse.json({ error: "Cần có URL subtitle hoặc nội dung subtitle." }, { status: 400 });
        }

        const item = await SubtitleModel.findOneAndUpdate(
            { _id: normalized._id },
            { $set: normalized },
            { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
        ).lean();

        return NextResponse.json({ success: true, item });
    } catch (error: any) {
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}
