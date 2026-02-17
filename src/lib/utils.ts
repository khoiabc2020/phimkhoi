import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getImageUrl(url: string) {
    if (!url) return "";

    // Return direct URL for these known domains to let Next.js optimize them
    if (url.includes("tmdb.org") || url.includes("img.ophim") || url.includes("phimimg.com")) {
        return url;
    }

    // Handle relative paths (presumed to be from KKPhim/phimimg)
    if (!url.startsWith("http")) {
        return `https://phimimg.com/${url}`;
    }

    // For other full URLs, return as is.
    // Previously we wrapped in phimapi.com/image.php which is returning 403.
    // We trust Next.js Image component or standard img tag to handle them if domains are allowed.
    return url;
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
