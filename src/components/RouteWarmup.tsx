"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const HOT_ROUTES = [
    "/",
    "/phim-han",
    "/phim-trung",
    "/quoc-gia/han-quoc",
    "/quoc-gia/trung-quoc",
    "/quoc-gia/nhat-ban",
    "/quoc-gia/thai-lan",
    "/danh-sach/phim-moi-cap-nhat",
    "/danh-sach/phim-bo",
    "/danh-sach/phim-le",
    "/danh-sach/phim-chieu-rap",
    "/the-loai/hanh-dong",
    "/the-loai/tinh-cam",
    "/the-loai/kinh-di",
    "/the-loai/hoat-hinh",
    "/loc-phim",
];

export default function RouteWarmup(): null {
    const router = useRouter();

    useEffect(() => {
        let cancelled = false;

        const warm = () => {
            if (cancelled) return;
            HOT_ROUTES.forEach((route) => router.prefetch(route));
        };

        const firstTimer = setTimeout(warm, 150);

        return () => {
            cancelled = true;
            clearTimeout(firstTimer);
        };
    }, [router]);

    return null;
}
