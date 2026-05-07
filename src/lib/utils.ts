import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { detectImageOrientation, normalizeImageUrl, resolveMovieImages } from "@/lib/movie-media";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getImageUrl(url: string, proxy = false): string {
    const finalUrl = normalizeImageUrl(url);
    if (!finalUrl) return "";

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
                "img.phimapi.com",
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

type MovieImageLike = {
    poster_url?: string | null;
    thumb_url?: string | null;
};

export function getPosterImageUrl(movie?: MovieImageLike | null, proxy = false): string {
    if (!movie) return "";
    const fallback = resolveMovieImages(movie).poster_url;

    return fallback ? getImageUrl(fallback, proxy) : "";
}

export function getBackdropImageUrl(movie?: MovieImageLike | null, proxy = false): string {
    if (!movie) return "";
    const fallback = resolveMovieImages(movie).thumb_url;

    return fallback ? getImageUrl(fallback, proxy) : "";
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
        .replace(/&nbsp;/g, " ")
        .replace(/&#(\d+);/g, (_, code) => {
            const value = Number(code);
            return Number.isFinite(value) ? String.fromCharCode(value) : "";
        });
}

export function stripHtml(html: string) {
    if (!html) return "";
    return decodeHtml(html.replace(/<[^>]*>?/gm, ""));
}

/**
 * Sanitize HTML: giữ lại tag định dạng an toàn (p, br, b, i, em, strong),
 * loại bỏ script/style/iframe, on* event handlers, javascript: URIs.
 * Dùng cho nội dung từ API ngoài trước khi render dangerouslySetInnerHTML.
 */
export function sanitizeHtml(html: string): string {
    if (!html) return "";
    return html
        // Xóa script tag và toàn bộ nội dung bên trong
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        // Xóa style tag và nội dung
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
        // Xóa các tag nguy hiểm kèm nội dung
        .replace(/<(iframe|object|embed|form|input|button|link|meta|base)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
        .replace(/<(iframe|object|embed|form|input|button|link|meta|base)\b[^>]*\/?>/gi, "")
        // Xóa on* event handlers (onclick, onload, onerror, ...)
        .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "")
        // Xóa javascript: và vbscript: URIs
        .replace(/(?:href|src|action)\s*=\s*(?:"[^"]*"|'[^']*')/gi, (match) =>
            /javascript:|vbscript:|data:/i.test(match) ? "" : match
        )
        .trim();
}

export function detectOrientation(url?: string | null): "portrait" | "landscape" | "unknown" {
    return detectImageOrientation(url);
}

export function extractEpisodeNumber(value: string): string | null {
    const match = String(value || "").match(/(\d+)/);
    return match ? match[1] : null;
}

export function buildEpisodeKeyCandidates(epName: string, epSlug: string, indexInServer: number): string[] {
    const seen = new Set<string>();
    const pushKey = (raw: unknown) => {
        const val = String(raw ?? "").trim();
        if (!val || seen.has(val)) return;
        seen.add(val);
    };

    const fromName = extractEpisodeNumber(epName);
    const fromSlug = extractEpisodeNumber(epSlug);
    const parsed = Number(fromName || fromSlug);

    if (fromName) pushKey(fromName);
    if (fromSlug) pushKey(fromSlug);
    if (Number.isFinite(parsed) && parsed > 0) {
        pushKey(String(parsed));
        pushKey(String(parsed).padStart(2, "0"));
        pushKey(String(parsed).padStart(3, "0"));
    }

    const byIndex = indexInServer + 1;
    pushKey(String(byIndex));
    pushKey(String(byIndex).padStart(2, "0"));

    return Array.from(seen);
}
