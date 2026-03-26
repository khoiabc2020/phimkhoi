import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getImageUrl(url: string, proxy = false): string {
    if (!url) return "";

    let finalUrl = url;
    if (!url.startsWith("http")) {
        const normalized = url.trim();
        // Skip prefixing for local assets or special paths
        if (normalized.startsWith("/images") || normalized.startsWith("/icons") || normalized.startsWith("/favicon") || normalized.startsWith("/_next")) {
            finalUrl = normalized;
        } else if (
            normalized.startsWith("upload/") ||
            normalized.startsWith("/upload/") ||
            normalized.startsWith("uploads/") ||
            normalized.startsWith("/uploads/") ||
            normalized.startsWith("vod/")
        ) {
            const cleanPath = normalized.startsWith("/") ? normalized : `/${normalized}`;
            finalUrl = `https://img.phimapi.com${cleanPath}`;
        } else {
            // For ophim, normally paths without http are relative to phimimg.com
            finalUrl = normalized.startsWith("/") ? `https://phimimg.com${normalized}` : `https://phimimg.com/${normalized}`;
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
    const poster = String(movie.poster_url || "").trim();
    const thumb = String(movie.thumb_url || "").trim();

    const portraitPoster = poster && detectOrientation(poster) === "portrait" ? poster : "";
    const portraitThumb = thumb && detectOrientation(thumb) === "portrait" ? thumb : "";
    const fallback = portraitPoster || portraitThumb || poster || thumb;

    return fallback ? getImageUrl(fallback, proxy) : "";
}

export function getBackdropImageUrl(movie?: MovieImageLike | null, proxy = false): string {
    if (!movie) return "";
    const poster = String(movie.poster_url || "").trim();
    const thumb = String(movie.thumb_url || "").trim();

    const landscapeThumb = thumb && detectOrientation(thumb) === "landscape" ? thumb : "";
    const landscapePoster = poster && detectOrientation(poster) === "landscape" ? poster : "";
    const fallback = landscapeThumb || landscapePoster || thumb || poster;

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
        .replace(/&nbsp;/g, " ");
}

export function stripHtml(html: string) {
    if (!html) return "";
    return decodeHtml(html.replace(/<[^>]*>?/gm, ""));
}

export function detectOrientation(url?: string | null): "portrait" | "landscape" | "unknown" {
    if (!url) return "unknown";
    const u = url.toLowerCase();
    
    // OPhim, NguonC often use "thumb" for portrait and "poster" for landscape (reverse of standard)
    const isNguonc = u.includes("nguonc.com") || u.includes("streamc.xyz") || u.includes("phimmoi.net") || u.includes("1080.com.vn");
    const isOphim = u.includes("img.ophim.live") || u.includes("phimimg.com") || u.includes("img.ophim1.com");

    if (isOphim || isNguonc) {
        if (u.includes("-thumb.") || u.includes("/thumb-") || u.endsWith("/thumb.jpg") || u.endsWith("/thumb.png")) return "portrait";
        if (u.includes("-poster.") || u.includes("/poster-") || u.endsWith("/poster.jpg") || u.endsWith("/poster.png")) return "landscape";
    }

    // Standard checks for other sources (KKPhim, TMDB, etc.)
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
