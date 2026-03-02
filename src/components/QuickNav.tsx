"use client";

import Link from "next/link";

const NAV_ITEMS = [
    {
        label: "Hàn Quốc",
        sub: "K-Drama",
        href: "/quoc-gia/han-quoc",
        bg: "linear-gradient(135deg, #1a3a6b 0%, #2563eb 60%, #3b82f6 100%)",
        accent: "#60a5fa",
        tag: "KR",
    },
    {
        label: "Trung Quốc",
        sub: "C-Drama",
        href: "/quoc-gia/trung-quoc",
        bg: "linear-gradient(135deg, #7f1d1d 0%, #dc2626 60%, #ef4444 100%)",
        accent: "#fca5a5",
        tag: "CN",
    },
    {
        label: "Thuyết Minh",
        sub: "Vietsub",
        href: "/danh-sach/thuyet-minh",
        bg: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 60%, #a78bfa 100%)",
        accent: "#c4b5fd",
        tag: "VM",
    },
    {
        label: "Phim Bộ",
        sub: "Series",
        href: "/danh-sach/phim-bo",
        bg: "linear-gradient(135deg, #7c2d12 0%, #ea580c 60%, #fb923c 100%)",
        accent: "#fdba74",
        tag: "TV",
    },
    {
        label: "Phim Lẻ",
        sub: "Movie",
        href: "/danh-sach/phim-le",
        bg: "linear-gradient(135deg, #064e3b 0%, #059669 60%, #34d399 100%)",
        accent: "#6ee7b7",
        tag: "4K",
    },
    {
        label: "Hoạt Hình",
        sub: "Animation",
        href: "/danh-sach/hoat-hinh",
        bg: "linear-gradient(135deg, #831843 0%, #db2777 60%, #f472b6 100%)",
        accent: "#fbcfe8",
        tag: "AN",
    },
];

export default function QuickNav() {
    return (
        <div className="w-full py-2 pb-8">
            <div className="container mx-auto px-4 md:px-12 mb-4">
                <h2 className="text-[17px] font-bold text-white mb-4 flex items-center gap-2">
                    <span className="w-1 h-5 bg-gradient-to-t from-[#F4C84A] to-yellow-200 rounded-sm inline-block" />
                    Danh sách nổi bật
                </h2>

                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 snap-x">
                    {NAV_ITEMS.map((item, index) => (
                        <Link
                            key={index}
                            href={item.href}
                            className="flex-[0_0_36%] md:flex-[0_0_16%] aspect-[1.5/1] relative rounded-2xl overflow-hidden snap-start group transition-all duration-300 hover:-translate-y-1 hover:scale-[1.04] shadow-lg"
                            style={{ background: item.bg }}
                        >
                            {/* Noise texture overlay */}
                            <div
                                className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                                }}
                            />

                            {/* Glow on hover */}
                            <div
                                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                style={{ boxShadow: `inset 0 0 0 1px ${item.accent}40, 0 0 24px ${item.accent}50` }}
                            />

                            {/* Badge tag top-right */}
                            <span
                                className="absolute top-2 right-2.5 text-[10px] font-black tracking-[0.12em] px-1.5 py-0.5 rounded"
                                style={{ background: "rgba(0,0,0,0.3)", color: item.accent, backdropFilter: "blur(4px)" }}
                            >
                                {item.tag}
                            </span>

                            {/* Content */}
                            <div className="absolute inset-0 flex flex-col justify-end p-3">
                                <p className="text-white font-black text-[15px] md:text-[16px] leading-tight drop-shadow-sm group-hover:translate-x-0.5 transition-transform duration-200">
                                    {item.label}
                                </p>
                                <p
                                    className="text-[11px] font-semibold tracking-wider uppercase mt-0.5 opacity-70"
                                    style={{ color: item.accent }}
                                >
                                    {item.sub}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
