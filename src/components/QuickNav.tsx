"use client";

import Link from "next/link";

const NAV_ITEMS = [
    {
        label: "Hàn Quốc",
        sub: "K-Drama, Tình Cảm",
        href: "/quoc-gia/han-quoc",
        from: "#1a3668",
        to: "#0f2347",
        accent: "#4f86e8",
        icon: (
            <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
                <circle cx="16" cy="16" r="15" fill="#fff" opacity="0.07" />
                <path d="M16 8C11.58 8 8 11.58 8 16C8 20.42 11.58 24 16 24C20.42 24 24 20.42 24 16C24 11.58 20.42 8 16 8Z" fill="#cd2e3a" opacity="0.8" />
                <path d="M16 8C16 8 16 16 16 16C16 16 11.58 16 8 16C8 11.58 11.58 8 16 8Z" fill="#0047a0" opacity="0.8" />
            </svg>
        ),
    },
    {
        label: "Trung Quốc",
        sub: "Cổ Trang, Tiên Hiệp",
        href: "/quoc-gia/trung-quoc",
        from: "#6b1212",
        to: "#3d0b0b",
        accent: "#e84f4f",
        icon: (
            <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
                <circle cx="16" cy="16" r="13" stroke="#e84f4f" strokeWidth="1.5" opacity="0.4" />
                <path d="M16 9l1.8 5.6H23l-4.6 3.4 1.8 5.6L16 20.2l-4.2 3.4 1.8-5.6L9 14.6h5.2z" fill="#e84f4f" opacity="0.85" />
            </svg>
        ),
    },
    {
        label: "Phim Mỹ",
        sub: "Hollywood, HBO",
        href: "/quoc-gia/my",
        from: "#0d2b52",
        to: "#071830",
        accent: "#60a5fa",
        icon: (
            <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
                <circle cx="16" cy="16" r="13" stroke="#60a5fa" strokeWidth="1.5" opacity="0.35" />
                <path d="M16 6C10.48 6 6 10.48 6 16s4.48 10 10 10 10-4.48 10-10S21.52 6 16 6zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#60a5fa" opacity="0.6" />
                <path d="M14 11l5 5-5 5V11z" fill="#60a5fa" opacity="0.85" />
            </svg>
        ),
    },
    {
        label: "Thuyết Minh",
        sub: "Lồng tiếng Việt",
        href: "/danh-sach/thuyet-minh",
        from: "#2d1654",
        to: "#1a0c35",
        accent: "#a78bfa",
        icon: (
            <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
                <circle cx="16" cy="16" r="13" stroke="#a78bfa" strokeWidth="1.5" opacity="0.3" />
                <circle cx="16" cy="14" r="4" fill="#a78bfa" opacity="0.75" />
                <path d="M10 24c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" opacity="0.75" />
            </svg>
        ),
    },
    {
        label: "Thái Lan",
        sub: "BL & Tình Cảm",
        href: "/quoc-gia/thai-lan",
        from: "#5a1a00",
        to: "#3a1000",
        accent: "#fb923c",
        icon: (
            <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
                <circle cx="16" cy="16" r="13" stroke="#fb923c" strokeWidth="1.5" opacity="0.35" />
                <path d="M16 9 L19 15 L26 15 L20.5 19 L22.5 26 L16 22 L9.5 26 L11.5 19 L6 15 L13 15 Z" fill="#fb923c" opacity="0.7" />
            </svg>
        ),
    },
    {
        label: "Anime",
        sub: "Hoạt Hình Nhật Bản",
        href: "/danh-sach/hoat-hinh",
        from: "#0f2030",
        to: "#071420",
        accent: "#f472b6",
        icon: (
            <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
                <circle cx="16" cy="16" r="13" stroke="#f472b6" strokeWidth="1.5" opacity="0.3" />
                <circle cx="12" cy="15" r="3" fill="#f472b6" opacity="0.7" />
                <circle cx="20" cy="15" r="3" fill="#f472b6" opacity="0.7" />
                <path d="M12 21 Q16 25 20 21" stroke="#f472b6" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7" />
                <path d="M9 12 Q12 8 15 12" stroke="#f472b6" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.5" />
                <path d="M17 12 Q20 8 23 12" stroke="#f472b6" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.5" />
            </svg>
        ),
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
                            aria-label={`Xem ${item.label}`}
                            className="quick-nav-card flex-[0_0_40%] sm:flex-[0_0_28%] md:flex-[0_0_22%] lg:flex-[0_0_16%] aspect-[1.5/1] md:aspect-[16/9] lg:aspect-[1.5/1] relative rounded-2xl overflow-hidden snap-start border border-white/[0.07] group hover:border-white/20 transition-all duration-200 hover:scale-[1.03] hover:shadow-lg"
                            style={{ background: `linear-gradient(135deg, ${item.from}, ${item.to})` }}
                        >
                            {/* Subtle shine top-right */}
                            <div
                                className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 blur-xl pointer-events-none"
                                style={{ background: item.accent }}
                            />

                            {/* Icon top-right */}
                            <div className="absolute top-3 right-3 opacity-60 group-hover:opacity-90 transition-opacity duration-200">
                                {item.icon}
                            </div>

                            {/* Bottom content */}
                            <div className="absolute inset-x-0 bottom-0 p-3">
                                <p className="text-white font-bold text-[13px] sm:text-[14px] leading-tight">
                                    {item.label}
                                </p>
                                <p className="text-white/50 text-[10px] sm:text-[11px] font-medium mt-0.5 flex items-center gap-0.5 truncate">
                                    {item.sub}
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 ml-0.5">
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
