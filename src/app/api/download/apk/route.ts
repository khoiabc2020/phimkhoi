import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

const DEFAULT_GITHUB_RELEASE_APK_URL =
    'https://github.com/khoiabc2020/phimkhoi/releases/latest/download/PhimKhoi-Release.apk';
const GITHUB_RELEASE_BASE = 'https://github.com/khoiabc2020/phimkhoi/releases';

/**
 * GET /api/download/apk
 *
 * Mặc định redirect đến GitHub Releases (không phụ thuộc file APK trong repo).
 * Có thể override bằng env `APK_DOWNLOAD_URL`.
 * Nếu link ngoài lỗi, fallback về file local trong public/downloads (nếu có).
 */
export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const versionParam = (url.searchParams.get('v') || '').trim();
    const normalizedVersion = versionParam ? (versionParam.startsWith('v') ? versionParam : `v${versionParam}`) : '';

    const externalUrl = normalizedVersion
        ? `${GITHUB_RELEASE_BASE}/download/${normalizedVersion}/PhimKhoi-${normalizedVersion}.apk`
        : (process.env.APK_DOWNLOAD_URL || DEFAULT_GITHUB_RELEASE_APK_URL);
    if (externalUrl) {
        return NextResponse.redirect(new URL(externalUrl), 302);
    }

    const apkPath = path.join(process.cwd(), 'public', 'downloads', 'PhimKhoi-Release.apk');

    // Legacy fallback: serve local APK when external URL is unavailable.
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

    // Final fallback: keep old static path behavior.
    return NextResponse.redirect(new URL('/downloads/PhimKhoi-Release.apk', request.url));
}
