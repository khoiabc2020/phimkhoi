export default function cloudflareImageLoader({
    src,
    width,
    quality,
}: {
    src: string;
    width: number;
    quality?: number;
}) {
    const q = quality || 80;
    const safeWidth = Math.max(64, Math.min(1920, width || 640));

    const toWsrv = (absoluteUrl: string) =>
        `https://wsrv.nl/?url=${encodeURIComponent(absoluteUrl)}&w=${safeWidth}&q=${q}&output=webp`;

    // Nếu ảnh đi qua proxy nội bộ, bóc URL gốc ra để wsrv resize đúng kích thước.
    if (src.startsWith("/api/img-proxy?url=")) {
        try {
            const query = src.split("?")[1] || "";
            const params = new URLSearchParams(query);
            const raw = params.get("url");
            if (raw) {
                const decoded = decodeURIComponent(raw);
                if (decoded.startsWith("http://") || decoded.startsWith("https://")) {
                    return toWsrv(decoded);
                }
            }
        } catch {
            // fallback to default handling below
        }
    }

    // Đối với các ảnh có URL tuyệt đối (external images)
    if (src.startsWith("http://") || src.startsWith("https://")) {
        // Sử dụng wsrv.nl CDN (chạy trên hạ tầng Cloudflare) để tự động resize và nén WebP
        return toWsrv(src);
    }

    // Đối với ảnh cục bộ trong /public
    return src;
}
