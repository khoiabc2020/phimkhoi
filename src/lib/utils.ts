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

    // Sử dụng Image CDN Proxy (wsrv.nl) với định dạng WebP để tối đa hóa tốc độ load ảnh toàn cầu
    // Cực kỳ hữu ích với mạng chập chờn hoặc thiết bị yếu
    return `https://wsrv.nl/?url=${encodeURIComponent(finalUrl)}&output=webp&q=80`;
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
