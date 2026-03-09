"use client";

import Link from "next/link";

const NAV_ITEMS = [
    {
        label: "Hàn Quốc",
        sub: "Xem chủ đề",
        href: "/quoc-gia/han-quoc",
        color: "#60a5fa",
    },
    {
        label: "Trung Quốc",
        sub: "Xem chủ đề",
        href: "/quoc-gia/trung-quoc",
        color: "#f97373",
    },
    {
        label: "Thuyết Minh",
        sub: "Xem chủ đề",
        href: "/danh-sach/thuyet-minh",
        color: "#a78bfa",
    },
    {
        label: "Phim Bộ",
        sub: "Xem chủ đề",
        href: "/danh-sach/phim-bo",
        color: "#fb923c",
    },
    {
        label: "Phim Lẻ",
        sub: "Xem chủ đề",
        href: "/danh-sach/phim-le",
        color: "#34d399",
    },
    {
        label: "Hoạt Hình",
        sub: "Xem chủ đề",
        href: "/danh-sach/hoat-hinh",
        color: "#f472b6",
    },
];

export default function QuickNav() {
    return (
        <div className="w-full py-2 pb-8">
            <div className="container mx-auto px-4 md:px-12 mb-4">
                <h2 className="text-[17px] font-bold text-white mb-5 flex items-center gap-2">
                    <span className="w-1 h-5 bg-gradient-to-t from-[#F4C84A] to-yellow-200 rounded-sm inline-block" />
                    Bạn đang quan tâm gì?
                </h2>

                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 snap-x">
                    {NAV_ITEMS.map((item, index) => (
                        <Link
                            key={index}
                            href={item.href}
                            className="quick-nav-card flex-[0_0_36%] sm:flex-[0_0_28%] md:flex-[0_0_22%] lg:flex-[0_0_16%] aspect-[1.5/1] md:aspect-[16/9] lg:aspect-[1.5/1] relative rounded-2xl overflow-hidden snap-start shadow-lg border border-white/8 bg-[#0f1116]"
                        >
                            {/* Accent bar on top */}
                            <div
                                className="absolute inset-x-0 top-0 h-1.5 rounded-t-2xl"
                                style={{ background: item.color }}
                            />

                            {/* Content */}
                            <div className="absolute inset-0 flex flex-col justify-end p-3 lg:p-3 md:p-3.5">
                                <p className="text-white font-semibold text-[14px] sm:text-[15px] lg:text-[16px] leading-tight line-clamp-1">
                                    {item.label}
                                </p>
                                <p className="text-white/60 text-[11px] sm:text-[12px] font-medium mt-0.5 flex items-center gap-0.5 sm:gap-1">
                                    {item.sub}
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
