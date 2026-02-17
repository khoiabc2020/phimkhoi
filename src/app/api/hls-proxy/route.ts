import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Prevent static caching

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

function resolveUrl(relativeOrAbsolute: string, base: string): string {
    try {
        const absolute = new URL(relativeOrAbsolute, base).toString();
        // Rewrite to proxy
        return `/api/hls-proxy?url=${encodeURIComponent(absolute)}`;
    } catch (e) {
        console.error("URL Resolution Failed:", relativeOrAbsolute, e);
        return relativeOrAbsolute;
    }
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
        return new NextResponse('Missing URL', { status: 400 });
    }

    try {
        const upstreamOrigin = new URL(url).origin;
        const headers: Record<string, string> = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': upstreamOrigin + '/',
            'Origin': upstreamOrigin,
        };

        const response = await fetch(url, { headers, redirect: 'follow' });

        if (!response.ok) {
            return new NextResponse(`Upstream Error: ${response.status}`, { status: response.status });
        }

        const contentType = response.headers.get('Content-Type');
        const isM3u8 = url.includes('.m3u8') || (contentType && contentType.includes('mpegurl')) || (contentType && contentType.includes('application/x-mpegURL'));

        const responseHeaders = new Headers();
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Cache-Control', 'public, max-age=3600');
        if (contentType) responseHeaders.set('Content-Type', contentType);

        // 1. Binary Stream (Segments, Keys, Images) - Pipe directly
        if (!isM3u8) {
            return new NextResponse(response.body, {
                status: 200,
                headers: responseHeaders,
            });
        }

        // 2. Playlist (Manifest) - Parse & Rewrite
        const buffer = await response.arrayBuffer();
        const decoder = new TextDecoder();
        const m3u8Content = decoder.decode(buffer);

        // Set correct content type for HLS manifest
        responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');

        // Robust Rewrite Logic
        const lines = m3u8Content.split('\n');
        const rewrittenContent = lines.map(line => {
            const trimmed = line.trim();
            if (!trimmed) return line;

            // Case A: Standard Segment (URL on its own line)
            if (!trimmed.startsWith('#')) {
                return resolveUrl(trimmed, response.url);
            }

            // Case B: Key or Map Tags with URI="..."
            // e.g. #EXT-X-KEY:METHOD=AES-128,URI="key.php"
            // e.g. #EXT-X-MAP:URI="main.mp4"
            if (trimmed.startsWith('#EXT-X-KEY') || trimmed.startsWith('#EXT-X-MAP')) {
                return line.replace(/URI="([^"]+)"/g, (match, p1) => {
                    return `URI="${resolveUrl(p1, response.url)}"`;
                });
            }

            return line;
        }).join('\n');

        return new NextResponse(rewrittenContent, {
            status: 200,
            headers: responseHeaders,
        });

    } catch (error) {
        console.error('Proxy Fatal Error:', error);
        return new NextResponse('Internal Proxy Error', { status: 500 });
    }
}
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
        return new NextResponse('Missing URL', { status: 400 });
    }

    console.log(`[Proxy] Requesting: ${url}`);

    try {
        // Spoof Referer to be the origin of the video URL, as many servers block external referers
        // or set it to empty to avoid tracking/blocking
        const upstreamOrigin = new URL(url).origin;

        const headers: Record<string, string> = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': upstreamOrigin + '/',
            'Origin': upstreamOrigin,
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br'
        };

        console.log(`[Proxy] Fetching: ${url}`);
        const response = await fetch(url, { headers });
        console.log(`[Proxy] Response: ${response.status} ${response.statusText} for ${url}`);

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'No body');
            console.error(`[Proxy] Failed: ${response.status} ${response.statusText} - Body: ${errorText.substring(0, 200)}`);
            return new NextResponse(`Failed to fetch from upstream: ${response.status} ${response.statusText}`, { status: response.status });
        }

        const contentType = response.headers.get('Content-Type');
        const isM3u8 = url.includes('.m3u8') || (contentType && contentType.includes('mpegurl'));

        const responseHeaders = new Headers();
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Cache-Control', 'public, max-age=3600');
        if (contentType) responseHeaders.set('Content-Type', contentType);

        // OPTIMIZATION: Stream binary data (TS segments) directly to client
        // This reduces memory usage and TTFB (Time To First Byte)
        if (!isM3u8) {
            return new NextResponse(response.body, {
                status: 200,
                headers: responseHeaders,
            });
        }

        // For Playlists (Text), we must buffer to rewrite URLs
        const buffer = await response.arrayBuffer();

        // Text Processing for Playlist
        const decoder = new TextDecoder();
        const m3u8Content = decoder.decode(buffer);

        responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');

        const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
        const lines = m3u8Content.split('\n');
        const rewrittenContent = lines.map(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                try {
                    // Robust relative URL resolution using the FINAL response URL (handling redirects)
                    const absoluteUrl = new URL(trimmed, response.url).toString();
                    return `/api/hls-proxy?url=${encodeURIComponent(absoluteUrl)}`;
                } catch (e) {
                    console.error("Error resolving URL:", trimmed, e);
                    return line; // Keep original if resolution fails
                }
            }
            return line;
        }).join('\n');

        return new NextResponse(rewrittenContent, {
            status: 200,
            headers: responseHeaders,
        });

    } catch (error) {
        console.error('Proxy error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
