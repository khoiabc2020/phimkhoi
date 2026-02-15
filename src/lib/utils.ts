import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getImageUrl(url: string) {
    if (!url) return "";
    if (url.includes("tmdb.org")) return url;

    // Check if it's already a full URL that is NOT tmdb (e.g. some other external source) -> still proxy it potentially? 
    // But for now, just bypass TMDB specific ones.
    const rawUrl = url.startsWith("http") ? url : `https://phimimg.com/${url}`;
    return `https://phimapi.com/image.php?url=${encodeURIComponent(rawUrl)}`;
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
