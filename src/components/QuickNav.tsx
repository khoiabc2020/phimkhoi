"use client";

import Link from "next/link";

const NAV_ITEMS = [
    {
        label: "Hàn Quốc",
        sub: "Xem chủ đề",
        href: "/quoc-gia/han-quoc",
        from: "#6074c7",
        to: "#c884a6",
    },
    {
        label: "Trung Quốc",
        sub: "Xem chủ đề",
        href: "/quoc-gia/trung-quoc",
        from: "#559e86",
        to: "#cfa692",
    },
    {
        label: "Phim Ngắn",
        sub: "Xem chủ đề",
        href: "/the-loai/phim-ngan",
        from: "#e89f7f",
        to: "#d66969",
    },
    {
        label: "Thuyết Minh",
        sub: "Xem chủ đề",
        href: "/danh-sach/thuyet-minh",
        from: "#9777bd",
        to: "#cc7a8c",
    },
    {
        label: "Phim Mỹ",
        sub: "Xem chủ đề",
        href: "/quoc-gia/my",
        from: "#c4675b",
        to: "#bd5755",
    },
    {
        label: "Thái Lan",
        sub: "Xem chủ đề",
        href: "/quoc-gia/thai-lan",
        from: "#8a8ea3",
        to: "#d68b8e",
    },
];

export default function QuickNav() {
    return (
        <div className="w-full pt-4 md:pt-8 pb-6">
            <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 md:px-8 mb-3">
                <h2 className="text-[20px] md:text-[24px] font-extrabold text-white mb-4 flex items-center gap-2 tracking-tight">
                    <span className="w-1 h-5 bg-[#8FA7C5] rounded-sm inline-block" />
                    Bạn đang quan tâm gì?
                </h2>

                <div className="flex overflow-x-auto lg:grid lg:grid-cols-6 gap-3 md:gap-4 py-1 no-scrollbar snap-x">
                    {NAV_ITEMS.map((item, index) => (
                        <Link
                            key={index}
                            href={item.href}
                            aria-label={`Xem ${item.label}`}
                            className="quick-nav-card relative flex-shrink-0 w-[160px] sm:w-[220px] lg:w-auto aspect-[1.8/1] rounded-[12px] overflow-hidden transition-all duration-300 hover:scale-[1.02] shadow-sm hover:shadow-xl group snap-start"
                            style={{ background: `linear-gradient(135deg, ${item.from}, ${item.to})` }}
                        >
                            {/* Bottom content */}
                            <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 flex flex-col justify-end h-full">
                                <h3 className="text-white font-bold text-[16px] sm:text-[20px] leading-tight mb-1">
                                    {item.label}
                                </h3>
                                <p className="text-white/80 text-[11px] sm:text-[12px] font-medium flex items-center gap-1 group-hover:gap-1.5 transition-all">
                                    {item.sub}
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
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
