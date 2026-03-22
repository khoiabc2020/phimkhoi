import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Persistent Disk Cache Configuration
const CACHE_DIR = path.join(process.cwd(), '.next', 'cache', 'proxy-images');

async function ensureCacheDir() {
    try {
        await fs.access(CACHE_DIR);
    } catch {
        await fs.mkdir(CACHE_DIR, { recursive: true });
    }
}

// Memory fallback to avoid hitting disk too often for the same session
const memoryCache = new Map<string, { contentType: string; buffer: Buffer }>();

const ALLOWED_DOMAINS = [
    'phimimg.com', 'ophim17.cc', 'ophim1.com', 'kkphim.vip',
    'img.phimapi.com', 'image.tmdb.org', 'phim.nguonc.com',
    'cdn.kkphim.vip', 'i.imgur.com', 'static.phimapi.com'
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

    // 1. Generate unique hash for the URL
    const hash = crypto.createHash('md5').update(url).digest('hex');
    const ext = path.extname(new URL(url).pathname) || '.jpg';
    const cachePath = path.join(CACHE_DIR, `${hash}${ext}`);

    // 2. Check Memory Cache First (Fastest)
    if (memoryCache.has(url)) {
        const { contentType, buffer } = memoryCache.get(url)!;
        return new Response(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
                'X-Cache-Status': 'MEMORY-HIT',
            },
        });
    }

    // 3. Check Disk Cache
    try {
        await ensureCacheDir();
        const stats = await fs.stat(cachePath);
        // Only use disk cache if it's less than 7 days old
        if (Date.now() - stats.mtimeMs < 7 * 24 * 60 * 60 * 1000) {
            const buffer = await fs.readFile(cachePath);
            const contentType = buffer[0] === 0xff && buffer[1] === 0xd8 ? 'image/jpeg' : 'image/webp';
            
            memoryCache.set(url, { contentType, buffer });
            return new Response(buffer, {
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=31536000, immutable',
                    'X-Cache-Status': 'DISK-HIT',
                },
            });
        }
    } catch {
        // Not in disk cache, proceed to fetch
    }

    // 4. Fetch from Upstream
    try {
        const upstream = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; PhimKhoi/1.0)',
                'Referer': 'https://phimapi.com/',
                'Accept': 'image/webp,image/avif,image/*,*/*',
            },
            signal: AbortSignal.timeout(10000),
        });

        if (!upstream.ok) return NextResponse.redirect(url, 302);

        const contentType = upstream.headers.get('content-type') || 'image/jpeg';
        const arrayBuffer = await upstream.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 5. Save to Disk & Memory for future requests
        try {
            await fs.writeFile(cachePath, buffer);
            memoryCache.set(url, { contentType, buffer });
        } catch (e) {
            console.error("Failed to write image cache:", e);
        }

        return new Response(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
                'X-Cache-Status': 'MISS',
            },
        });
    } catch {
        return NextResponse.redirect(url, 302);
    }
}
