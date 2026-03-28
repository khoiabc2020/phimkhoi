"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
    {
        label: "Hàn Quốc",
        sub: "Phim Bộ",
        href: "/quoc-gia/han-quoc",
        from: "#7182d9",
        to: "#d9a7c7",
    },
    {
        label: "Trung Quốc",
        sub: "Hoa Ngữ",
        href: "/quoc-gia/trung-quoc",
        from: "#d9a7c7",
        to: "#e8809e",
    },
    {
        label: "Thái Lan",
        sub: "Cực Hay",
        href: "/quoc-gia/thai-lan",
        from: "#557bc4",
        to: "#c16b92",
    },
    {
        label: "Sitcom",
        sub: "Game Shows",
        href: "/danh-sach/tv-shows",
        from: "#4f9d81",
        to: "#a46358",
    },
    {
        label: "Chiếu Rạp",
        sub: "Mới Nhất",
        href: "/the-loai/phim-chieu-rap",
        from: "#8f76b9",
        to: "#cc7781",
    },
    {
        label: "Kinh Dị",
        sub: "Thót Tim",
        href: "/the-loai/kinh-di",
        from: "#ca876a",
        to: "#b8565a",
    },
    {
        label: "Cổ Trang",
        sub: "Huyền Huyễn",
        href: "/the-loai/co-trang",
        from: "#b15f58",
        to: "#b54452",
    },
    {
        label: "Thuyết Minh",
        sub: "VietDub",
        href: "/danh-sach/thuyet-minh",
        from: "#5d6d84",
        to: "#434b5a",
    },
];

export default function QuickNav() {
    const router = useRouter();

    useEffect(() => {
        NAV_ITEMS.forEach((item) => router.prefetch(item.href));
    }, [router]);

    return (
        <div className="w-full pb-6 pt-4 md:pt-8">
            <div className="mx-auto mb-3 w-full max-w-[1920px] px-2 sm:px-4 md:px-8">
                <h2 className="mb-5 flex items-center gap-2 text-[20px] font-extrabold tracking-tight text-white md:text-[24px]">
                    <span className="inline-block h-6 w-1 rounded-sm bg-[#A5B8D6]" />
                    Bạn đang quan tâm gì?
                </h2>

                <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto py-1 lg:grid lg:grid-cols-4 2xl:grid-cols-8 md:gap-4">
                    {NAV_ITEMS.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onMouseEnter={() => router.prefetch(item.href)}
                            onFocus={() => router.prefetch(item.href)}
                            aria-label={`Xem ${item.label}`}
                            className="group relative aspect-[1.8/1] w-[160px] flex-shrink-0 snap-start overflow-hidden rounded-[14px] border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/22 hover:shadow-[0_18px_36px_rgba(0,0,0,0.20)] sm:w-[220px] lg:w-auto"
                            style={{
                                backgroundImage: `linear-gradient(135deg, ${item.from}, ${item.to})`,
                            }}
                        >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_42%)]" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-black/[0.03] to-transparent" />

                            <div className="absolute inset-x-0 bottom-0 flex h-full flex-col justify-end p-3 sm:p-4">
                                <h3 className="mb-1 text-[16px] font-extrabold leading-tight text-white sm:text-[20px]">
                                    {item.label}
                                </h3>
                                <p className="flex items-center gap-1 text-[11px] font-semibold text-white/92 transition-all group-hover:gap-1.5 sm:text-[12px]">
                                    {item.sub}
                                    <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="shrink-0"
                                    >
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
