"use client";

import Link from "next/link";

const NAV_ITEMS = [
    {
        label: "Hàn Quốc",
        sub: "Xem chủ đề",
        href: "/quoc-gia/han-quoc",
        from: "#2f3654",
        to: "#4a3450",
    },
    {
        label: "Trung Quốc",
        sub: "Xem chủ đề",
        href: "/quoc-gia/trung-quoc",
        from: "#2f4a46",
        to: "#52413a",
    },
    {
        label: "Phim Ngắn",
        sub: "Xem chủ đề",
        href: "/the-loai/phim-ngan",
        from: "#4f3a33",
        to: "#553338",
    },
    {
        label: "Thuyết Minh",
        sub: "Xem chủ đề",
        href: "/danh-sach/thuyet-minh",
        from: "#3d3555",
        to: "#533748",
    },
    {
        label: "Phim Mỹ",
        sub: "Xem chủ đề",
        href: "/quoc-gia/my",
        from: "#4e3433",
        to: "#4c3132",
    },
    {
        label: "Thái Lan",
        sub: "Xem chủ đề",
        href: "/quoc-gia/thai-lan",
        from: "#353c4f",
        to: "#503b41",
    },
];

export default function QuickNav() {
    return (
        <div className="w-full py-2 pb-6">
            <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 md:px-8 mb-3">
                <h2 className="text-[16px] md:text-[18px] font-extrabold text-white mb-4 flex items-center gap-2 tracking-tight">
                    <span className="w-1 h-5 bg-[#F4C84A] rounded-sm inline-block" />
                    Bạn đang quan tâm gì?
                </h2>

                <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1 px-0.5 -mx-0.5 snap-x">
                    {NAV_ITEMS.map((item, index) => (
                        <Link
                            key={index}
                            href={item.href}
                            aria-label={`Xem ${item.label}`}
                            className="quick-nav-card flex-[0_0_138px] sm:flex-[0_0_170px] md:flex-[0_0_190px] lg:flex-[1] aspect-[1.8/1] relative rounded-[10px] overflow-hidden snap-start transition-all duration-300 hover:scale-[1.02] border border-white/[0.08] shadow-[0_6px_16px_#00000055] hover:shadow-[0_10px_22px_#00000075]"
                            style={{ background: `linear-gradient(135deg, ${item.from}, ${item.to})` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/15 to-black/45" />
                            {/* Bottom content */}
                            <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 flex flex-col justify-end h-full">
                                <h3 className="text-white font-bold text-[15px] sm:text-[17px] leading-tight mb-1">
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
