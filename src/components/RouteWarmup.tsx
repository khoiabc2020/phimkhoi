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

export default function RouteWarmup() {
    const router = useRouter();

    useEffect(() => {
        let cancelled = false;

        const warm = () => {
            if (cancelled) return;
            HOT_ROUTES.forEach((route) => router.prefetch(route));
        };

        const firstTimer = window.setTimeout(warm, 150);
        const idleWarm =
            "requestIdleCallback" in window
                ? (window as any).requestIdleCallback(warm, { timeout: 1200 })
                : window.setTimeout(warm, 800);
        const interval = window.setInterval(warm, 30000);

        const onVisible = () => {
            if (document.visibilityState === "visible") {
                warm();
            }
        };

        document.addEventListener("visibilitychange", onVisible);

        return () => {
            cancelled = true;
            window.clearTimeout(firstTimer);
            window.clearInterval(interval);
            if ("cancelIdleCallback" in window) {
                (window as any).cancelIdleCallback(idleWarm);
            } else {
                window.clearTimeout(idleWarm);
            }
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [router]);

    return null;
}
