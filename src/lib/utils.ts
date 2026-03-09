import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getImageUrl(url: string, proxy = true): string {
    if (!url) return "";

    let finalUrl = url;
    if (!url.startsWith("http")) {
        finalUrl = `https://phimimg.com/${url}`;
    }

    // Trường hợp ép proxy: luôn đi qua /api/img-proxy để VPS + Cloudflare cache
    if (proxy && finalUrl.startsWith("http")) {
        return `/api/img-proxy?url=${encodeURIComponent(finalUrl)}`;
    }

    // Ngược lại: nếu ảnh đã nằm trên CDN/host tin cậy thì trả URL trực tiếp
    if (finalUrl.startsWith("http")) {
        try {
            const host = new URL(finalUrl).hostname;
            const trustedHosts = [
                "phimimg.com",
                "img.ophim.live",
                "img.ophim1.com",
                "image.tmdb.org",
                "ui-avatars.com",
                "assets.nflxext.com",
            ];

            if (trustedHosts.some((h) => host === h || host.endsWith(`.${h}`))) {
                return finalUrl;
            }
        } catch {
            // ignore URL parse error and fall through to proxy logic
        }

        // Các host khác: giữ nguyên URL gốc
    }

    return finalUrl;
}


export function decodeHtml(html: string) {
    if (!html) return "";
    return html
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&apos;/g, "'");
}
