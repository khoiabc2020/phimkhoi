export default function internalImageLoader({
    src,
    width,
    quality,
}: {
    src: string;
    width: number;
    quality?: number;
}) {
    // If it's already a relative path or a local asset, keep it
    if (src.startsWith("/") && !src.startsWith("/api/img-proxy")) {
        return src;
    }

    // Extract the original URL if it's already wrapped in our proxy
    let absoluteUrl = src;
    if (src.startsWith("/api/img-proxy?url=")) {
        try {
            const params = new URLSearchParams(src.split("?")[1]);
            absoluteUrl = params.get("url") || src;
        } catch { }
    }

    // Only proxy external absolute URLs
    if (absoluteUrl.startsWith("http")) {
        const q = quality || 85;
        // Map width to standard breakpoints to improve cache hit rate
        const w = width <= 400 ? 400 : width <= 800 ? 800 : width <= 1200 ? 1200 : width <= 1920 ? 1920 : 2560;
        // Use global image CDN (wsrv.nl) to completely offload VPS CPU
        return `https://wsrv.nl/?url=${encodeURIComponent(absoluteUrl)}&w=${w}&q=${q}&output=webp`;
    }

    return src;
}
