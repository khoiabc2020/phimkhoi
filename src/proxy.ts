import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
    const token = await getToken({ req });
    const { pathname } = req.nextUrl;

    const protectedPaths = ["/admin", "/lich-su-xem", "/phim-yeu-thich", "/cai-dat", "/thong-tin-tai-khoan"];
    const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

    if ((pathname.startsWith("/login") || pathname.startsWith("/register")) && token) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    if (isProtected && !token) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (pathname.startsWith("/admin") && token?.role !== "admin") {
        return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
