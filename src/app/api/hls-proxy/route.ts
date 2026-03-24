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

    try {
        // Spoof Referer to be the origin of the video URL, as many servers block external referers
        const upstreamUrl = new URL(url);
        const upstreamOrigin = upstreamUrl.origin;
        
        let referer = upstreamOrigin + '/';
        let origin = upstreamOrigin;

        // Special handling for known providers who are strict about Referer
        if (url.includes('nguonc.com') || url.includes('streamc.xyz') || url.includes('phimmoi.net') || url.includes('1080.com.vn')) {
            referer = 'https://phim.nguonc.com/';
            origin = 'https://phim.nguonc.com';
        } else if (url.includes('kkphim') || url.includes('phim1280.tv') || url.includes('phimapi.com')) {
            referer = 'https://kkphim.com/';
            origin = 'https://kkphim.com';
        } else if (url.includes('ophim') || url.includes('phim.live') || url.includes('opstream')) {
            // Ophim CDNs: use their main sites as referer
            referer = 'https://ophim10.cc/';
            origin = 'https://ophim10.cc';
            // Also try phim.live if first one is blocked by some strict CDNs
            if (url.includes('opstream')) {
                referer = 'https://phim.live/';
                origin = 'https://phim.live';
            }
        }

        const headers: Record<string, string> = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            'Referer': referer,
            'Origin': origin,
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
            'Sec-Ch-Ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'cross-site',
            'Connection': 'keep-alive',
            'DNT': '1'
        };

        const response = await fetch(url, { headers });

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'No body');
            console.error(`[Proxy] Failed: ${response.status} ${response.statusText} - Body: ${errorText.substring(0, 200)}`);
            return new NextResponse(`Failed to fetch from upstream: ${response.status} ${response.statusText}`, { status: response.status });
        }

        const contentType = response.headers.get('Content-Type');
        const isM3u8 = url.includes('.m3u8') ||
            (contentType && (
                contentType.includes('mpegurl') ||
                contentType.includes('application/x-mpegURL')
            ));

        const responseHeaders = new Headers();
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Cache-Control', 'public, max-age=3600');
        if (contentType) responseHeaders.set('Content-Type', contentType);

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
