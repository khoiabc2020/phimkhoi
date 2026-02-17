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
            'Referer': upstreamOrigin + '/', // Set referer to the video source origin
            'Origin': upstreamOrigin
        };

        const response = await fetch(url, { headers });
        console.log(`[Proxy] Upstream Status: ${response.status} for ${url}`);

        if (!response.ok) {
            return new NextResponse(`Failed to fetch: ${response.status} ${response.statusText}`, { status: response.status });
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
                const absoluteUrl = trimmed.startsWith('http') ? trimmed : baseUrl + trimmed;
                return `/api/hls-proxy?url=${encodeURIComponent(absoluteUrl)}`;
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
