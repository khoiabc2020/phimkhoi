import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import SubtitleModel from "@/models/Subtitle";

const OS_API_BASE = "https://api.opensubtitles.com/api/v1";
const OS_API_KEY = process.env.OPENSUBTITLES_API_KEY || "ME0c6DRh6ulFwmlis10eo9ERoUTKwl2K";
const OS_HEADERS = {
    "Api-Key": OS_API_KEY,
    "Content-Type": "application/json",
    "User-Agent": "KHOIPHIM v1.0",
};

const MIME_MAP: Record<string, string> = {
    vtt: "text/vtt",
    srt: "text/vtt",
    ass: "text/x-ssa",
    ssa: "text/x-ssa",
};

function normalizeId(v: string): string {
    return String(v).trim().toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
}

function langLabel(lang: string): string {
    const map: Record<string, string> = {
        vi: "Tiếng Việt", en: "English", zh: "中文",
        ko: "한국어", ja: "日本語", fr: "Français",
        es: "Español", th: "ภาษาไทย",
    };
    return map[lang] || lang.toUpperCase();
}

/** Convert SRT text → WebVTT */
function srtToVtt(srt: string): string {
    return "WEBVTT\n\n" +
        srt
            .trim()
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .replace(/^\d+\s*\n/gm, "")
            .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
}

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=86400",
};

export async function GET(req: NextRequest) {
    const sp = req.nextUrl.searchParams;
    const id        = sp.get("id");
    const proxyUrl  = sp.get("url");
    const fileId    = sp.get("fileId");   // OpenSubtitles file_id for auto-download

    // ── A. OpenSubtitles auto-download mode ──────────────────────────────
    if (fileId) {
        const movieSlug   = sp.get("movieSlug")   || "";
        const episodeSlug = sp.get("episodeSlug") || "";
        const language    = sp.get("lang")         || "en";
        const movieName   = sp.get("movieName")   || "";
        const fileName    = sp.get("fileName")    || "";

        // Check DB cache first (previous download may have been saved)
        if (movieSlug && episodeSlug) {
            try {
                await dbConnect();
                const cached = await SubtitleModel.findOne({ movieSlug, episodeSlug, language })
                    .select("content format")
                    .lean();
                if (cached?.content) {
                    const fmt  = (cached.format as string) || "vtt";
                    const body = fmt === "srt" ? srtToVtt(cached.content) : cached.content;
                    return new NextResponse(body, {
                        headers: { "Content-Type": "text/vtt; charset=utf-8", ...CORS_HEADERS },
                    });
                }
            } catch { /* fall through to download */ }
        }

        try {
            // Step 1: get download URL from OS
            const dlRes = await fetch(`${OS_API_BASE}/download`, {
                method: "POST",
                headers: OS_HEADERS,
                body: JSON.stringify({ file_id: Number(fileId) }),
            });
            if (!dlRes.ok) {
                const err = await dlRes.text();
                return NextResponse.json({ error: `OS download error: ${err}` }, { status: 502 });
            }
            const dlData = await dlRes.json();
            const downloadUrl = dlData.link as string;
            if (!downloadUrl) return NextResponse.json({ error: "No download URL from OS" }, { status: 500 });

            // Step 2: fetch subtitle file
            const subRes = await fetch(downloadUrl);
            if (!subRes.ok) return NextResponse.json({ error: "Subtitle download failed" }, { status: 502 });
            const rawContent = await subRes.text();

            // Detect format
            const ext = (fileName || downloadUrl.split("?")[0]).split(".").pop()?.toLowerCase() || "srt";
            const fmt = ["srt", "vtt", "ass", "ssa"].includes(ext) ? ext : "srt";
            const body = fmt === "srt" ? srtToVtt(rawContent) : rawContent;

            // Step 3: auto-save to DB so next request is instant (fire & forget)
            if (movieSlug && episodeSlug && movieName) {
                (async () => {
                    try {
                        await dbConnect();
                        const label = langLabel(language);
                        const dbId = `${normalizeId(movieSlug)}:${normalizeId(episodeSlug)}:${normalizeId(language)}`;
                        await SubtitleModel.findOneAndUpdate(
                            { _id: dbId },
                            {
                                $set: {
                                    _id: dbId, movieSlug, movieName, episodeSlug,
                                    language, label,
                                    format: "vtt",
                                    sourceType: "content",
                                    sourceName: "opensubtitles-auto",
                                    content: body,
                                    isDefault: language === "vi",
                                    notes: `Auto-imported from OpenSubtitles. fileId=${fileId}`,
                                },
                            },
                            { upsert: true, new: true }
                        );
                    } catch { /* silent */ }
                })();
            }

            return new NextResponse(body, {
                headers: { "Content-Type": "text/vtt; charset=utf-8", ...CORS_HEADERS },
            });
        } catch (err: any) {
            return NextResponse.json({ error: err?.message || "OS download failed" }, { status: 500 });
        }
    }

    // ── B. Proxy mode (external URL) ─────────────────────────────────────
    if (proxyUrl) {
        try {
            const res = await fetch(proxyUrl, {
                headers: { "User-Agent": "Mozilla/5.0 (compatible; PhimKhoi/1.0)" },
                next: { revalidate: 3600 },
            });
            if (!res.ok) return NextResponse.json({ error: "Fetch failed" }, { status: 502 });

            const raw = await res.text();
            const ext = proxyUrl.split("?")[0].split(".").pop()?.toLowerCase() || "srt";
            const fmt = ["srt", "vtt", "ass", "ssa"].includes(ext) ? ext : "srt";
            const body = fmt === "srt" ? srtToVtt(raw) : raw;

            return new NextResponse(body, {
                headers: { "Content-Type": `${MIME_MAP[fmt] || "text/vtt"}; charset=utf-8`, ...CORS_HEADERS },
            });
        } catch {
            return NextResponse.json({ error: "Proxy error" }, { status: 500 });
        }
    }

    // ── C. DB content mode ───────────────────────────────────────────────
    if (!id) return NextResponse.json({ error: "Missing id, url, or fileId param" }, { status: 400 });

    await dbConnect();
    const sub = await SubtitleModel.findById(id).select("content format").lean();

    if (!sub?.content) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const fmt  = (sub.format as string) || "srt";
    const body = fmt === "srt" ? srtToVtt(sub.content) : sub.content;

    return new NextResponse(body, {
        headers: { "Content-Type": `${MIME_MAP[fmt] || "text/vtt"}; charset=utf-8`, ...CORS_HEADERS },
    });
}
