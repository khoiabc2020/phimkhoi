import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * [Elite Security] Zero-Leak Session Middleware
 * Ensures that any request with an active session cookie NEVER gets cached by proxies/CDNs.
 */
export function middleware(request: NextRequest) {
    const response = NextResponse.next();
    
    // 1. Detect active session cookies
    const hasSession = request.cookies.has("next-auth.session-token") || 
                       request.cookies.has("__Secure-next-auth.session-token");
    
    const isAuthApi = request.nextUrl.pathname.startsWith("/api/auth");
    const isAccountPage = request.nextUrl.pathname.startsWith("/thong-tin-tai-khoan");

    // 2. Harden headers for authenticated or sensitive routes
    if (hasSession || isAuthApi || isAccountPage) {
        // Force no-cache across all layers (Browser, Cloudflare, Nginx)
        response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
        response.headers.set("Pragma", "no-cache");
        response.headers.set("Expires", "0");
        // Ensure Cloudflare/Proxies distinguish between user sessions
        response.headers.set("Vary", "Cookie");
    }

    return response;
}

// Apply to all routes to be safe, or just sensitive ones
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - manifest.json (pwa manifest)
         * - robots.txt (seo)
         * - sitemap.xml (seo)
         */
        "/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml).*)",
    ],
};
