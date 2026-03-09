"use client";

import Link from "next/link";

const NAV_ITEMS = [
    {
        label: "Hàn Quốc",
        sub: "Xem chủ đề",
        href: "/quoc-gia/han-quoc",
        bg: "linear-gradient(135deg, #1f3b73 0%, #2563eb 50%, #38bdf8 100%)",
    },
    {
        label: "Trung Quốc",
        sub: "Xem chủ đề",
        href: "/quoc-gia/trung-quoc",
        bg: "linear-gradient(135deg, #7b2c3f 0%, #ef4444 45%, #fb7185 100%)",
    },
    {
        label: "Phim Ngắn",
        sub: "Xem chủ đề",
        href: "/danh-sach/phim-le?year=2024",
        bg: "linear-gradient(135deg, #5030a3 0%, #6366f1 45%, #a855f7 100%)",
    },
    {
        label: "Thuyết Minh",
        sub: "Xem chủ đề",
        href: "/danh-sach/thuyet-minh",
        bg: "linear-gradient(135deg, #3b0764 0%, #7c3aed 50%, #c4b5fd 100%)",
    },
    {
        label: "Phim Mỹ",
        sub: "Xem chủ đề",
        href: "/quoc-gia/my",
        bg: "linear-gradient(135deg, #1d293b 0%, #0ea5e9 40%, #22c55e 100%)",
    },
    {
        label: "Thái Lan",
        sub: "Xem chủ đề",
        href: "/quoc-gia/thai-lan",
        bg: "linear-gradient(135deg, #713f12 0%, #f97316 45%, #facc15 100%)",
    },
    {
        label: "+1 chủ đề",
        sub: "Xem tất cả",
        href: "/thu-vien",
        bg: "linear-gradient(135deg, #334155 0%, #64748b 50%, #cbd5f5 100%)",
    },
];

export default function QuickNav() {
    return (
        <div className="w-full py-2 pb-8">
            <div className="container mx-auto px-4 md:px-12 mb-4">
                <h2 className="text-[17px] font-bold text-white mb-5 flex items-center gap-2">
                    <span className="w-1 h-5 bg-[#F4C84A] rounded-sm inline-block" />
                    Bạn đang quan tâm gì?
                </h2>

                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 snap-x">
                    {NAV_ITEMS.map((item, index) => (
                        <Link
                            key={index}
                            href={item.href}
                            className="quick-nav-card flex-[0_0_40%] sm:flex-[0_0_28%] md:flex-[0_0_22%] lg:flex-[0_0_16%] aspect-[1.5/1] md:aspect-[16/9] lg:aspect-[1.5/1] relative rounded-2xl overflow-hidden snap-start shadow-lg border border-white/10"
                            style={{ background: item.bg }}
                        >
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
