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

    // Đối với các ảnh có URL tuyệt đối (external images)
    if (src.startsWith("http://") || src.startsWith("https://")) {
        // Sử dụng wsrv.nl CDN (chạy trên hạ tầng Cloudflare) để tự động resize và nén WebP
        return `https://wsrv.nl/?url=${encodeURIComponent(src)}&w=${width}&q=${q}&output=webp`;
    }

    // Đối với ảnh cục bộ trong /public
    return src;
}
