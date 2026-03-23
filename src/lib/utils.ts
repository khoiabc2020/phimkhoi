import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getImageUrl(url: string, proxy = false): string {
    if (!url) return "";

    let finalUrl = url;
    if (!url.startsWith("http")) {
        // Skip prefixing for local assets or special paths
        if (url.startsWith("/images") || url.startsWith("/icons") || url.startsWith("/favicon") || url.startsWith("/_next")) {
            finalUrl = url;
        } else {
            // For ophim, normally paths without http are relative to phimimg.com
            finalUrl = url.startsWith("/") ? `https://phimimg.com${url}` : `https://phimimg.com/${url}`;
        }
    }

    // Trường hợp ép proxy (cho các component không dùng Next Image)
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
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&nbsp;/g, " ");
}

export function stripHtml(html: string) {
    if (!html) return "";
    return decodeHtml(html.replace(/<[^>]*>?/gm, ""));
}

export function detectOrientation(url?: string | null): "portrait" | "landscape" | "unknown" {
    if (!url) return "unknown";
    const u = url.toLowerCase();
    
    // OPhim uses *-thumb.jpg for portrait, *-poster.jpg for backdrop
    if (u.includes("img.ophim.live") || u.includes("phimimg.com")) {
        if (u.includes("-thumb.") || u.includes("/thumb-")) return "portrait";
        if (u.includes("-poster.") || u.includes("/poster-")) return "landscape";
    }

    // KKPhim and NguonC generic checks
    if (u.includes("backdrop") || u.includes("banner") || u.includes("landscape") || u.includes("horizontal")) {
        return "landscape";
    }
    if (u.includes("portrait") || u.includes("vertical") || u.includes("/poster") || u.includes("poster.")) {
        return "portrait";
    }

    // Dimension heuristic for fallback
    const dim = u.match(/(\d{2,4})x(\d{2,4})/);
    if (dim) {
        const w = parseInt(dim[1], 10);
        const h = parseInt(dim[2], 10);
        if (Number.isFinite(w) && Number.isFinite(h) && w !== h) {
            return h > w ? "portrait" : "landscape";
        }
    }
    return "unknown";
}
