import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';

// Persistent Disk Cache Configuration - Use absolute path on VPS for stability
const CACHE_DIR = process.env.NODE_ENV === 'production' 
    ? '/home/bitnami/phimkhoi-img-cache' 
    : path.join(process.cwd(), '.next', 'cache', 'proxy-images');

async function ensureCacheDir() {
    try {
        await fs.access(CACHE_DIR);
    } catch {
        await fs.mkdir(CACHE_DIR, { recursive: true });
    }
}

// Memory fallback to avoid hitting disk too often for the same session
const memoryCache = new Map<string, { contentType: string; buffer: Buffer }>();
const MAX_MEM_CACHE = 150; // Balanced limit for 2GB RAM VPS

const ALLOWED_DOMAINS = [
    'phimimg.com', 'ophim17.cc', 'ophim1.com', 'kkphim.vip',
    'img.phimapi.com', 'image.tmdb.org', 'phim.nguonc.com',
    'cdn.kkphim.vip', 'i.imgur.com', 'static.phimapi.com',
    'img.ophim.live'
];

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const url = searchParams.get('url');
    const width = parseInt(searchParams.get('w') || '0');
    const quality = parseInt(searchParams.get('q') || '85');

    if (!url || !url.startsWith('http')) {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    const hostname = (() => { try { return new URL(url).hostname; } catch { return ''; } })();
    if (!ALLOWED_DOMAINS.some(d => hostname === d || hostname.endsWith(`.${d}`))) {
        return NextResponse.redirect(url, 302);
    }

    // 1. Generate unique hash for the URL + Params
    const hash = crypto.createHash('md5').update(`${url}-${width}-${quality}`).digest('hex');
    const ext = '.webp';
    const cachePath = path.join(CACHE_DIR, `${hash}${ext}`);

    // 2. Check Memory Cache First
    const memKey = `${url}-${width}-${quality}`;
    if (memoryCache.has(memKey)) {
        const { contentType, buffer } = memoryCache.get(memKey)!;
        return new Response(new Uint8Array(buffer as any), {
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
        // Only use disk cache if it's less than 30 days old
        if (Date.now() - stats.mtimeMs < 30 * 24 * 60 * 60 * 1000) {
            const buffer = await fs.readFile(cachePath);
            const contentType = 'image/webp';
            
            if (memoryCache.size >= MAX_MEM_CACHE) memoryCache.clear();
            memoryCache.set(memKey, { contentType, buffer });
            return new Response(new Uint8Array(buffer), {
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=31536000, immutable',
                    'X-Cache-Status': 'DISK-HIT',
                },
            });
        }
    } catch {
        // Not in disk cache
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

        const contentType = 'image/webp';
        const arrayBuffer = await upstream.arrayBuffer();
        let buffer = Buffer.from(arrayBuffer);

        // 5. PROCESS IMAGE WITH SHARP
        try {
            let pipeline = sharp(buffer);
            if (width > 0) {
                pipeline = pipeline.resize({ width, withoutEnlargement: true });
            }
            buffer = Buffer.from(await pipeline.webp({ quality }).toBuffer());
        } catch (e) {
            console.error("Sharp processing failed:", e);
        }

        // 6. Save to Disk & Memory
        try {
            await fs.writeFile(cachePath, buffer);
            if (memoryCache.size >= MAX_MEM_CACHE) memoryCache.clear();
            memoryCache.set(memKey, { contentType, buffer });
        } catch (e) {
            console.error("Failed to write image cache:", e);
        }

        return new Response(new Uint8Array(buffer), {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
                'X-Cache-Status': 'MISS',
            },
        });
    } catch {
        return NextResponse.redirect(url, 302);
    }
}
