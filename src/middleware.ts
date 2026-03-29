import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware — thêm header cho /api/mobile/* để Cloudflare không challenge.
 * Cloudflare đọc "cf-cache-status" và các hint header để quyết định có challenge không.
 */
export function middleware(request: NextRequest) {
    // Chỉ xử lý /api/mobile/*
    if (request.nextUrl.pathname.startsWith('/api/mobile/')) {
        const response = NextResponse.next();
        // Cho Cloudflare biết đây là API endpoint, không cần JS challenge
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        response.headers.set('Vary', 'Accept, Accept-Encoding');
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, sec-ch-ua, sec-ch-ua-mobile, sec-ch-ua-platform');
        return response;
    }
    return NextResponse.next();
}

export const config = {
    matcher: '/api/mobile/:path*',
};
