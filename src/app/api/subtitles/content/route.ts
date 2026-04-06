import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import SubtitleModel from "@/models/Subtitle";

const MIME_MAP: Record<string, string> = {
    vtt: "text/vtt",
    srt: "text/vtt",      // we convert SRT → VTT below
    ass: "text/x-ssa",
    ssa: "text/x-ssa",
};

/** Convert SRT text to WebVTT format */
function srtToVtt(srt: string): string {
    return "WEBVTT\n\n" +
        srt
            .trim()
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            // remove sequence numbers (lines that are purely digits)
            .replace(/^\d+\s*\n/gm, "")
            // convert SRT timestamps (00:00:00,000) → VTT (00:00:00.000)
            .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2")
            // normalise extra blank lines
            .replace(/\n{3,}/g, "\n\n")
            .trim();
}

export async function GET(req: NextRequest) {
    const sp = req.nextUrl.searchParams;
    const id = sp.get("id");
    const proxyUrl = sp.get("url");   // proxy mode for external subtitle URLs

    // ── Proxy mode ──────────────────────────────────────────────────────────
    if (proxyUrl) {
        try {
            const res = await fetch(proxyUrl, {
                headers: { "User-Agent": "Mozilla/5.0 (compatible; PhimKhoi/1.0)" },
                next: { revalidate: 3600 },
            });
            if (!res.ok) return NextResponse.json({ error: "Fetch failed" }, { status: 502 });

            const raw = await res.text();
            const ext = proxyUrl.split("?")[0].split(".").pop()?.toLowerCase() || "srt";
            const format = ["srt", "vtt", "ass", "ssa"].includes(ext) ? ext : "srt";

            const content = format === "srt" ? srtToVtt(raw) : raw;
            const mime = MIME_MAP[format] || "text/vtt";

            return new NextResponse(content, {
                headers: {
                    "Content-Type": `${mime}; charset=utf-8`,
                    "Cache-Control": "public, max-age=86400",
                    "Access-Control-Allow-Origin": "*",
                },
            });
        } catch {
            return NextResponse.json({ error: "Proxy error" }, { status: 500 });
        }
    }

    // ── DB content mode ──────────────────────────────────────────────────────
    if (!id) return NextResponse.json({ error: "Missing id or url param" }, { status: 400 });

    await dbConnect();
    const sub = await SubtitleModel.findById(id).select("content format").lean();

    if (!sub?.content) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const format = (sub.format as string) || "srt";
    const content = format === "srt" ? srtToVtt(sub.content) : sub.content;
    const mime = MIME_MAP[format] || "text/vtt";

    return new NextResponse(content, {
        headers: {
            "Content-Type": `${mime}; charset=utf-8`,
            "Cache-Control": "public, max-age=86400",
            "Access-Control-Allow-Origin": "*",
        },
    });
}
