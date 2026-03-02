import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

/**
 * GET /api/download/apk
 * 
 * Phục vụ file APK cho người dùng tải về.
 * File APK cần được đặt tại: public/downloads/PhimKhoi-Release.apk
 * 
 * Nếu file không tồn tại, redirect về link fallback.
 */
export async function GET(request: NextRequest) {
    const apkPath = path.join(process.cwd(), 'public', 'downloads', 'PhimKhoi-Release.apk');

    // Kiểm tra file tồn tại trong public/downloads
    if (fs.existsSync(apkPath)) {
        try {
            const fileBuffer = fs.readFileSync(apkPath);
            return new Response(fileBuffer, {
                headers: {
                    'Content-Type': 'application/vnd.android.package-archive',
                    'Content-Disposition': 'attachment; filename="PhimKhoi-Release.apk"',
                    'Content-Length': fileBuffer.length.toString(),
                    'Cache-Control': 'no-store',
                },
            });
        } catch {
            // Fall through to redirect
        }
    }

    // Fallback: redirect về link static
    return NextResponse.redirect(new URL('/downloads/PhimKhoi-Release.apk', request.url));
}
