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
        const q = quality || 75;
        // Map width to more granular standard breakpoints to improve quality and cache hit rate
        // Next.js Defaults: 16, 32, 48, 64, 96, 128, 256, 384, 512, 640, 750, 828, 1080, 1200, 1920, 2048, 3840
        const breakpoints = [128, 256, 384, 512, 640, 750, 828, 1080, 1200, 1600];
        const w = breakpoints.find(b => b >= width) || 1600;
        
        return `/api/img-proxy?url=${encodeURIComponent(absoluteUrl)}&w=${w}&q=${q}`;
    }

    return src;
}
