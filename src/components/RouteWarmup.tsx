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
        const idleWarm =
            typeof (window as any).requestIdleCallback === "function"
                ? (window as any).requestIdleCallback(warm, { timeout: 1200 })
                : setTimeout(warm, 800);
        const interval = setInterval(warm, 30000);

        const onVisible = () => {
            if (document.visibilityState === "visible") {
                warm();
            }
        };

        document.addEventListener("visibilitychange", onVisible);

        return () => {
            cancelled = true;
            clearTimeout(firstTimer);
            clearInterval(interval);
            if (typeof (window as any).cancelIdleCallback === "function") {
                (window as any).cancelIdleCallback(idleWarm);
            } else {
                clearTimeout(idleWarm as any);
            }
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [router]);

    return null;
}
