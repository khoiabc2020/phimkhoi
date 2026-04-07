'use client'

export default function imageLoader({
    src,
    width,
    quality,
}: {
    src: string;
    width: number;
    quality?: number;
}) {
    const q = quality ?? 70;

    // Đối với các ảnh có URL tuyệt đối (external images)
    // Dùng img-proxy của chính mình: cache 30 ngày trên disk VPS, memory cache 150 entries
    // → sau lần đầu load xong thì không còn phụ thuộc CDN bên ngoài nữa
    if (src.startsWith("http://") || src.startsWith("https://")) {
        return `/api/img-proxy?url=${encodeURIComponent(src)}&w=${width}&q=${q}`;
    }

    // Đối với ảnh cục bộ trong /public
    return src;
}
