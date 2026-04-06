import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import SubtitleModel from "@/models/Subtitle";

const OS_API_BASE = "https://api.opensubtitles.com/api/v1";
const OS_API_KEY = process.env.OPENSUBTITLES_API_KEY || "ME0c6DRh6ulFwmlis10eo9ERoUTKwl2K";
const OS_HEADERS = {
    "Api-Key": OS_API_KEY,
    "Content-Type": "application/json",
    "User-Agent": "KHOIPHIM v1.0",
};

async function requireAdmin() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") return null;
    return session;
}

function normalizeId(value: string): string {
    return String(value || "").trim().toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
}

/** GET — Search OpenSubtitles for a movie */
export async function GET(req: NextRequest) {
    if (!await requireAdmin()) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sp = req.nextUrl.searchParams;
    const query  = sp.get("query") || "";
    const lang   = sp.get("lang") || "vi,en";
    const imdbId = sp.get("imdb_id") || "";
    const season = sp.get("season") || "";
    const episode = sp.get("episode") || "";

    if (!query && !imdbId) {
        return NextResponse.json({ error: "Cần nhập tên phim hoặc IMDB ID" }, { status: 400 });
    }

    try {
        const params = new URLSearchParams({ languages: lang });
        if (query)   params.set("query", query);
        if (imdbId)  params.set("imdb_id", imdbId.replace("tt", ""));
        if (season)  params.set("season_number", season);
        if (episode) params.set("episode_number", episode);

        const res = await fetch(`${OS_API_BASE}/subtitles?${params.toString()}`, {
            headers: OS_HEADERS,
            next: { revalidate: 60 },
        });

        if (!res.ok) {
            const err = await res.text();
            return NextResponse.json({ error: `OpenSubtitles: ${err}` }, { status: res.status });
        }

        const data = await res.json();
        const items = (data.data || []).map((item: any) => {
            const attr = item.attributes || {};
            return {
                id: item.id,
                language: attr.language,
                downloadCount: attr.download_count,
                release: attr.release,
                fps: attr.fps,
                ratings: attr.ratings,
                votes: attr.votes,
                fromTrusted: attr.from_trusted,
                moviehashMatch: attr.moviehash_match,
                files: (attr.files || []).map((f: any) => ({
                    fileId: f.file_id,
                    fileName: f.file_name,
                })),
                uploader: attr.uploader?.name,
            };
        });

        return NextResponse.json({ success: true, items, total: data.total_count || items.length });
    } catch (error: any) {
        return NextResponse.json({ error: error?.message || "Lỗi kết nối OpenSubtitles" }, { status: 500 });
    }
}

/** POST — Download + import a subtitle into DB */
export async function POST(req: NextRequest) {
    if (!await requireAdmin()) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { fileId, fileName, language, movieSlug, movieName, episodeSlug, episodeName, isDefault } = body;

    if (!fileId || !movieSlug || !movieName || !episodeSlug || !language) {
        return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    try {
        // Step 1: Get download link from OpenSubtitles
        const dlRes = await fetch(`${OS_API_BASE}/download`, {
            method: "POST",
            headers: OS_HEADERS,
            body: JSON.stringify({ file_id: fileId }),
        });

        if (!dlRes.ok) {
            const err = await dlRes.text();
            return NextResponse.json({ error: `Download link error: ${err}` }, { status: dlRes.status });
        }

        const dlData = await dlRes.json();
        const downloadUrl = dlData.link;

        if (!downloadUrl) {
            return NextResponse.json({ error: "Không lấy được link tải" }, { status: 500 });
        }

        // Step 2: Download subtitle content
        const subRes = await fetch(downloadUrl);
        if (!subRes.ok) {
            return NextResponse.json({ error: "Không tải được file subtitle" }, { status: 500 });
        }
        const content = await subRes.text();

        // Detect format from filename
        const ext = (fileName || "").split(".").pop()?.toLowerCase() || "srt";
        const format = ["srt", "vtt", "ass", "ssa"].includes(ext) ? ext : "srt";

        const label = language === "vi" ? "Tiếng Việt" :
                      language === "en" ? "English" :
                      language.toUpperCase();

        // Step 3: Store in DB
        await dbConnect();
        const id = `${normalizeId(movieSlug)}:${normalizeId(episodeSlug)}:${normalizeId(language)}`;
        const item = await SubtitleModel.findOneAndUpdate(
            { _id: id },
            {
                $set: {
                    _id: id,
                    movieSlug,
                    movieName,
                    episodeSlug,
                    episodeName: episodeName || "",
                    language,
                    label,
                    format,
                    sourceType: "content",
                    sourceName: "opensubtitles",
                    content,
                    isDefault: Boolean(isDefault),
                    notes: `Imported from OpenSubtitles. File: ${fileName}`,
                },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean();

        return NextResponse.json({ success: true, item, remainingDownloads: dlData.remaining });
    } catch (error: any) {
        return NextResponse.json({ error: error?.message || "Lỗi import subtitle" }, { status: 500 });
    }
}
