import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getImageUrl(url: string) {
    if (!url) return "";

    let finalUrl = url;
    if (!url.startsWith("http")) {
        finalUrl = `https://phimimg.com/${url}`;
    }

    // Bypass wsrv image CDN to provide the most original, full quality image as requested by user.
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
