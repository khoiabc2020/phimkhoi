import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

/**
 * [Elite Middleware] Unified Traffic & Security Controller
 * Handles:
 * 1. 301 Permanent Redirection to khoiphim.org
 * 2. Session Hardening (Cache-Control)
 * 3. Route Protection (Admin/Profile)
 */
export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const host = request.headers.get("host") || "";
    console.log(`[Proxy] Request: ${host}${pathname}`);

    // Mobile API: add headers so Cloudflare skips JS challenge
    if (pathname.startsWith('/api/mobile/')) {
        const res = NextResponse.next();
        res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.headers.set('Vary', 'Accept, Accept-Encoding');
        res.headers.set('Access-Control-Allow-Origin', '*');
        res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, sec-ch-ua, sec-ch-ua-mobile, sec-ch-ua-platform');
        return res;
    }

    // 1. [Elite Redirect] Domain Migration (khoiphim.io.vn -> khoiphim.org)
    if (host.includes("khoiphim.io.vn")) {
        const url = request.nextUrl.clone();
        url.host = "khoiphim.org";
        url.protocol = "https";
        return NextResponse.redirect(url, 301);
    }

    const token = await getToken({ req: request });
    
    // 2. Navigation & Route Protection
    const protectedPaths = ["/admin", "/lich-su-xem", "/phim-yeu-thich", "/cai-dat", "/thong-tin-tai-khoan"];
    const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

    // Redirect logged-in users from login/register to home
    if ((pathname.startsWith("/login") || pathname.startsWith("/register")) && token) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    // Redirect guest users from protected pages to login
    if (isProtected && !token) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Admin-only protection
    if (pathname.startsWith("/admin") && token?.role !== "admin") {
        return NextResponse.redirect(new URL("/", request.url));
    }

    // 3. [Elite Security] Zero-Leak Session Hardening
    const response = NextResponse.next();
    
    // Detect active session cookies
    const hasSession = request.cookies.has("next-auth.session-token") ||
                       request.cookies.has("__Secure-next-auth.session-token") ||
                       !!token;

    const isAuthApi = pathname.startsWith("/api/auth");
    const isUserApi = pathname.startsWith("/api/user");
    const isAdminApi = pathname.startsWith("/api/admin");
    const isPrivateApi = isAuthApi || isUserApi || isAdminApi;
    const isAccountPage = pathname.startsWith("/thong-tin-tai-khoan");
    const isPrivatePage = isProtected || isAccountPage || pathname.startsWith("/login") || pathname.startsWith("/register");

    // Important:
    // Do NOT force `no-store` for all public pages just because the user is logged in.
    // That disables the App Router/client cache and makes navigating back to public pages
    // feel like a full reload every time.
    if ((hasSession && isPrivatePage) || isPrivateApi) {
        // Force no-cache only for private/account/auth surfaces.
        response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
        response.headers.set("Pragma", "no-cache");
        response.headers.set("Expires", "0");
        response.headers.set("Vary", "Cookie");
    }

    return response;
}

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
        "/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|api/download).*)",
    ],
};
