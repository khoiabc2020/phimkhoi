import { NextRequest, NextResponse } from 'next/server';

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

    try {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://player.phimapi.com/',
            'Origin': 'https://player.phimapi.com'
        };

        const response = await fetch(url, {
            headers,
            keepalive: true
        });

        if (!response.ok) {
            return new NextResponse(`Failed to fetch: ${response.status} ${response.statusText}`, { status: response.status });
        }

        const contentType = response.headers.get('Content-Type');
        const isM3u8 = url.includes('.m3u8') || (contentType && contentType.includes('mpegurl'));

        const responseHeaders = new Headers();
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        if (contentType) responseHeaders.set('Content-Type', contentType);
        responseHeaders.set('Cache-Control', 'public, max-age=3600');

        // 1. STREAM VIDEO SEGMENTS (Binary) - Do not buffer!
        if (!isM3u8) {
            return new NextResponse(response.body, {
                status: 200,
                headers: responseHeaders,
            });
        }

        // 2. REWRITE PLAYLISTS (Text) - Must buffer to edit
        const m3u8Content = await response.text();
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
