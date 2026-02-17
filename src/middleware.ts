import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
    const token = await getToken({ req });
    const { pathname } = req.nextUrl;

    // Paths that require authentication
    const protectedPaths = ["/admin", "/lich-su-xem", "/phim-yeu-thich", "/cai-dat", "/thong-tin-tai-khoan"];
    const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

    // Login/Register page should redirect to home if already logged in
    if ((pathname.startsWith("/login") || pathname.startsWith("/register")) && token) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    // Protect private routes
    if (isProtected && !token) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Admin route protection
    if (pathname.startsWith("/admin") && token?.role !== "admin") {
        return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
