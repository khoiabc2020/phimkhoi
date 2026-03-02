"use client";

import Link from "next/link";

const NAV_ITEMS = [
    {
        label: "Hàn Quốc",
        sub: "Xem chủ đề",
        href: "/quoc-gia/han-quoc",
        bg: "linear-gradient(135deg, #1a3a6b 0%, #2563eb 60%, #60a5fa 100%)",
    },
    {
        label: "Trung Quốc",
        sub: "Xem chủ đề",
        href: "/quoc-gia/trung-quoc",
        bg: "linear-gradient(135deg, #7f1d1d 0%, #dc2626 60%, #f87171 100%)",
    },
    {
        label: "Thuyết Minh",
        sub: "Xem chủ đề",
        href: "/danh-sach/thuyet-minh",
        bg: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 60%, #a78bfa 100%)",
    },
    {
        label: "Phim Bộ",
        sub: "Xem chủ đề",
        href: "/danh-sach/phim-bo",
        bg: "linear-gradient(135deg, #9a3412 0%, #ea580c 60%, #fb923c 100%)",
    },
    {
        label: "Phim Lẻ",
        sub: "Xem chủ đề",
        href: "/danh-sach/phim-le",
        bg: "linear-gradient(135deg, #064e3b 0%, #059669 60%, #34d399 100%)",
    },
    {
        label: "Hoạt Hình",
        sub: "Xem chủ đề",
        href: "/danh-sach/hoat-hinh",
        bg: "linear-gradient(135deg, #831843 0%, #db2777 60%, #f472b6 100%)",
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
                            className="quick-nav-card flex-[0_0_36%] md:flex-[0_0_16%] aspect-[1.5/1] relative rounded-2xl overflow-hidden snap-start shadow-lg"
                            style={{ background: item.bg }}
                        >
                            {/* Noise texture */}
                            <div
                                className="absolute inset-0 opacity-[0.06] mix-blend-overlay pointer-events-none"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                                }}
                            />
                            {/* Shine sweep on hover */}
                            <div className="quick-nav-shine absolute inset-0 pointer-events-none" />

                            {/* Content */}
                            <div className="absolute inset-0 flex flex-col justify-end p-3.5">
                                <p className="text-white font-black text-[16px] md:text-[17px] leading-tight drop-shadow-sm">
                                    {item.label}
                                </p>
                                <p className="text-white/60 text-[12px] font-semibold mt-0.5 flex items-center gap-1">
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
