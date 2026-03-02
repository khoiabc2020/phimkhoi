import { NextRequest, NextResponse } from 'next/server';

// In-memory image URL → data cache (server-side, 4h TTL)
// Giúp VPS cache ảnh và serve nhanh hơn CDN nước ngoài
const cache = new Map<string, { blob: Blob; contentType: string; cachedAt: number }>();
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4h
const MAX_CACHE_SIZE = 300;

function cleanCache() {
    if (cache.size <= MAX_CACHE_SIZE) return;
    const now = Date.now();
    for (const [key, val] of cache.entries()) {
        if (now - val.cachedAt > CACHE_TTL) cache.delete(key);
    }
    if (cache.size > MAX_CACHE_SIZE) {
        const oldest = [...cache.keys()].slice(0, 100);
        oldest.forEach(k => cache.delete(k));
    }
}

const ALLOWED_DOMAINS = [
    'phimimg.com', 'ophim17.cc', 'ophim1.com', 'kkphim.vip',
    'img.phimapi.com', 'image.tmdb.org', 'phim.nguonc.com',
    'cdn.kkphim.vip', 'i.imgur.com',
];

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get('url');

    if (!url || !url.startsWith('http')) {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    const hostname = (() => { try { return new URL(url).hostname; } catch { return ''; } })();
    if (!ALLOWED_DOMAINS.some(d => hostname.includes(d))) {
        return NextResponse.redirect(url, 302);
    }

    // Serve từ cache nếu còn mới
    const cached = cache.get(url);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
        const text = await cached.blob.arrayBuffer();
        return new Response(text, {
            headers: {
                'Content-Type': cached.contentType,
                'Cache-Control': 'public, max-age=14400, stale-while-revalidate=86400',
                'X-Cache': 'HIT',
            },
        });
    }

    try {
        const upstream = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; PhimKhoi/1.0)',
                'Referer': 'https://phimapi.com/',
                'Accept': 'image/webp,image/avif,image/*,*/*',
            },
            signal: AbortSignal.timeout(7000),
        });

        if (!upstream.ok) {
            return NextResponse.redirect(url, 302);
        }

        const contentType = upstream.headers.get('content-type') || 'image/jpeg';
        const blob = await upstream.blob();
        const arrayBuffer = await blob.arrayBuffer();

        cleanCache();
        cache.set(url, { blob, contentType, cachedAt: Date.now() });

        return new Response(arrayBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=14400, stale-while-revalidate=86400',
                'X-Cache': 'MISS',
            },
        });
    } catch {
        return NextResponse.redirect(url, 302);
    }
}
