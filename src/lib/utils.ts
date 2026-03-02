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

    // Route qua VPS Image Proxy để được Cache & phục vụ nhanh hơn
    // Proxy server sẽ tải ảnh về, cache 4 giờ và serve từ VPS (loại bỏ màn đen)
    if (proxy && finalUrl.startsWith("http")) {
        return `/api/img-proxy?url=${encodeURIComponent(finalUrl)}`;
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
