"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const HOT_ROUTES = [
    "/",
    "/phim-han",
    "/phim-trung",
    "/quoc-gia/han-quoc",
    "/quoc-gia/trung-quoc",
    "/danh-sach/phim-moi-cap-nhat",
    "/danh-sach/phim-bo",
    "/danh-sach/phim-le",
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
