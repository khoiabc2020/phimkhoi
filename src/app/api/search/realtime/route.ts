import { NextResponse } from "next/server";
import { getRealtimeSearchData } from "@/services/realtime-search";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = String(searchParams.get("q") || "").trim();

        if (query.length < 2) {
            return NextResponse.json(
                { movies: [], actors: [] },
                {
                    headers: {
                        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300",
                    },
                }
            );
        }

        const results = await getRealtimeSearchData(query);
        return NextResponse.json(results, {
            headers: {
                "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
            },
        });
    } catch (error) {
        console.error("Realtime search route error:", error);
        return NextResponse.json({ movies: [], actors: [] }, { status: 200 });
    }
}
