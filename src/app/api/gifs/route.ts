import { NextRequest, NextResponse } from "next/server";

const TENOR_KEY = process.env.TENOR_API_KEY || "AIzaSyDkAW3YFU0eWuU4SkRkF5GhJBm5I7vD5us";
const TENOR_BASE = "https://tenor.googleapis.com/v2";

// Curated fallback GIFs by category when no search term
const CURATED_GIFS: Record<string, { url: string; preview: string; title: string }[]> = {
    reaction: [
        { url: "https://media.tenor.com/ZfK4uHpByVAhhXfSTaAAAAC/clapping.gif", preview: "https://media.tenor.com/ZfK4uHpByVAhhXfSTaAAAAe/clapping.gif", title: "Clapping" },
        { url: "https://media.tenor.com/1pZqBpOGfcEAAAAC/wow-surprised.gif", preview: "https://media.tenor.com/1pZqBpOGfcEAAAAe/wow-surprised.gif", title: "Wow" },
        { url: "https://media.tenor.com/TdfyKrN7HGTIAAAAd/haha-laughing.gif", preview: "https://media.tenor.com/TdfyKrN7HGTIAAAAe/haha-laughing.gif", title: "Haha" },
        { url: "https://media.tenor.com/F_1c-fGOJT8AAAAC/cry.gif", preview: "https://media.tenor.com/F_1c-fGOJT8AAAAe/cry.gif", title: "Cry" },
        { url: "https://media.tenor.com/x0FTqOk0DZoAAAAC/popcorn.gif", preview: "https://media.tenor.com/x0FTqOk0DZoAAAAe/popcorn.gif", title: "Popcorn" },
        { url: "https://media.tenor.com/Zp_e5K3vXQEAAAAC/mind-blown.gif", preview: "https://media.tenor.com/Zp_e5K3vXQEAAAAe/mind-blown.gif", title: "Mind Blown" },
    ],
};

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const limit = Math.min(Number(searchParams.get("limit") || 20), 30);

    try {
        const url = q
            ? `${TENOR_BASE}/search?q=${encodeURIComponent(q)}&key=${TENOR_KEY}&limit=${limit}&media_filter=gif,tinygif`
            : `${TENOR_BASE}/featured?key=${TENOR_KEY}&limit=${limit}&media_filter=gif,tinygif`;

        const res = await fetch(url, { next: { revalidate: 300 } });
        if (!res.ok) throw new Error("Tenor API error");

        const data = await res.json();
        const results = (data.results || []).map((item: any) => {
            const gif = item.media_formats?.gif || item.media_formats?.tinygif;
            const tiny = item.media_formats?.tinygif || item.media_formats?.gif;
            return {
                id: item.id,
                title: item.title || "GIF",
                url: gif?.url || "",
                preview: tiny?.url || gif?.url || "",
                dims: gif?.dims || [200, 150],
            };
        }).filter((g: any) => g.url);

        return NextResponse.json({ results });
    } catch {
        // Return curated fallback
        return NextResponse.json({ results: CURATED_GIFS.reaction });
    }
}
