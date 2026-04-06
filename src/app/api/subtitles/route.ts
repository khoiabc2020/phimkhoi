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

/** Try to extract season/episode number from episode slug */
function extractEpInfo(episodeSlug: string): { season?: number; episode?: number } {
    if (!episodeSlug || episodeSlug === "full" || episodeSlug === "vietsub") return {};

    // s1e5 / S01E05
    const sXeY = episodeSlug.match(/s(\d+)e(\d+)/i);
    if (sXeY) return { season: +sXeY[1], episode: +sXeY[2] };

    // tap-1 / tap1 / ep-2 / episode-3
    const tap = episodeSlug.match(/(?:tap|ep(?:isode)?)[- _]?(\d+)/i);
    if (tap) return { episode: +tap[1] };

    // plain number e.g. "1", "12"
    const plain = episodeSlug.match(/^(\d+)$/);
    if (plain) return { episode: +plain[1] };

    return {};
}

function langLabel(lang: string): string {
    const map: Record<string, string> = {
        vi: "Tiếng Việt", en: "English", zh: "中文",
        ko: "한국어", ja: "日本語", fr: "Français",
        es: "Español", th: "ภาษาไทย",
    };
    return map[lang] || lang.toUpperCase();
}

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const sp = req.nextUrl.searchParams;
        const movieSlug  = String(sp.get("movieSlug")  || "").trim();
        const episodeSlug = String(sp.get("episodeSlug") || "").trim();
        const movieName  = String(sp.get("movieName")  || "").trim();
        const originName = String(sp.get("originName") || "").trim();

        if (!movieSlug || !episodeSlug) {
            return NextResponse.json({ error: "Missing movieSlug or episodeSlug" }, { status: 400 });
        }

        // ── 1. Check DB first ─────────────────────────────────────────────
        const dbItems = await SubtitleModel.find({ movieSlug, episodeSlug })
            .sort({ isDefault: -1, language: 1, updatedAt: -1 })
            .select("-content")
            .lean();

        if (dbItems.length > 0) {
            return NextResponse.json({ success: true, items: dbItems, source: "db" });
        }

        // ── 2. Auto-search OpenSubtitles ──────────────────────────────────
        const searchName = originName || movieName;
        if (!searchName) {
            return NextResponse.json({ success: true, items: [], source: "db" });
        }

        try {
            const params = new URLSearchParams({ query: searchName, languages: "vi,en" });
            const { season, episode } = extractEpInfo(episodeSlug);
            if (season)  params.set("season_number",  String(season));
            if (episode) params.set("episode_number", String(episode));

            const osRes = await fetch(`${OS_API_BASE}/subtitles?${params}`, {
                headers: OS_HEADERS,
                next: { revalidate: 300 },  // 5-min server cache
            });

            if (!osRes.ok) {
                return NextResponse.json({ success: true, items: [], source: "db" });
            }

            const osData = await osRes.json();
            const rawItems = (osData.data || []) as any[];

            // Map to synthetic subtitle objects (not stored in DB yet)
            const mapped = rawItems
                .filter((item: any) => item.attributes?.files?.length > 0)
                .map((item: any) => {
                    const attr = item.attributes || {};
                    const file = attr.files[0];
                    const lang = (attr.language || "en") as string;
                    const ext  = ((file.file_name || "") as string).split(".").pop()?.toLowerCase() || "srt";
                    const fmt  = ["srt", "vtt", "ass", "ssa"].includes(ext) ? ext : "srt";

                    return {
                        // Synthetic _id — not a real DB id
                        _id: `os:${file.file_id}`,
                        movieSlug,
                        movieName,    // needed by content API for DB caching
                        episodeSlug,
                        language: lang,
                        label: `${langLabel(lang)} (Tự động)`,
                        format: fmt,
                        sourceType: "opensubtitles",
                        // Extra fields needed to download + cache
                        fileId: file.file_id,
                        fileName: file.file_name || "",
                        isDefault: lang === "vi",
                        downloadCount: attr.download_count || 0,
                    };
                });

            // Sort: vi > en > others; within same lang sort by downloads
            mapped.sort((a, b) => {
                if (a.language === "vi" && b.language !== "vi") return -1;
                if (b.language === "vi" && a.language !== "vi") return  1;
                if (a.language === "en" && b.language !== "en") return -1;
                if (b.language === "en" && a.language !== "en") return  1;
                return b.downloadCount - a.downloadCount;
            });

            // Deduplicate: keep top result per language
            const seen = new Set<string>();
            const deduped = mapped.filter(item => {
                if (seen.has(item.language)) return false;
                seen.add(item.language);
                return true;
            });

            return NextResponse.json({ success: true, items: deduped, source: "opensubtitles" });
        } catch {
            return NextResponse.json({ success: true, items: [], source: "db" });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}
