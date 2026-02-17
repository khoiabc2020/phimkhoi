import { NextRequest, NextResponse } from 'next/server';

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

        const response = await fetch(url, { headers });

        if (!response.ok) {
            return new NextResponse(`Failed to fetch m3u8: ${response.status} ${response.statusText}`, { status: response.status });
        }

        const m3u8Content = await response.text();

        // CORS headers for the client
        const responseHeaders = new Headers();
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');

        // Handle relative paths in m3u8 if necessary
        // Ideally, if ts files are relative, we need to rewrite them to absolute, or proxy them too.
        // For now, let's assume they are absolute or base URL handling by player works (it won't if we proxy).

        // Simple rewrite for relative paths:
        // Resolve base URL
        const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);

        // Rewrite lines not starting with # (URLs) to go through proxy
        const lines = m3u8Content.split('\n');
        const params = lines.map(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                // Determine absolute URL of the resource
                const absoluteUrl = trimmed.startsWith('http')
                    ? trimmed
                    : baseUrl + trimmed;

                // Recursively proxy this URL
                // Get the current protocol and host from the request to construct full proxy URL
                // Or just use relative path since we are on the same domain
                return `/api/hls-proxy?url=${encodeURIComponent(absoluteUrl)}`;
            }
            return line;
        }).join('\n');

        return new NextResponse(params, {
            status: 200,
            headers: responseHeaders,
        });

    } catch (error) {
        console.error('Proxy error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
