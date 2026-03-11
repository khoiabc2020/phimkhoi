"use client";

import Link from "next/link";

const NAV_ITEMS = [
    {
        label: "Hàn Quốc",
        sub: "K-Drama & Phim Hàn",
        href: "/quoc-gia/han-quoc",
        emoji: "🇰🇷",
        gradient: "from-[#1a3a6b] via-[#213a7a] to-[#c0392b]",
        accent: "#3b82f6",
        pattern: "circles",
    },
    {
        label: "Trung Quốc",
        sub: "Cổ Trang & Tiên Hiệp",
        href: "/quoc-gia/trung-quoc",
        emoji: "🇨🇳",
        gradient: "from-[#7f1d1d] via-[#991b1b] to-[#b45309]",
        accent: "#ef4444",
        pattern: "dots",
    },
    {
        label: "Phim Mỹ",
        sub: "Hollywood & HBO",
        href: "/quoc-gia/my",
        emoji: "🇺🇸",
        gradient: "from-[#1e3a5f] via-[#1d4ed8] to-[#7c3aed]",
        accent: "#60a5fa",
        pattern: "lines",
    },
    {
        label: "Thuyết Minh",
        sub: "Lồng tiếng Việt",
        href: "/danh-sach/thuyet-minh",
        emoji: "🎙️",
        gradient: "from-[#3b0764] via-[#6d28d9] to-[#4c1d95]",
        accent: "#a78bfa",
        pattern: "circles",
    },
    {
        label: "Thái Lan",
        sub: "BL & Tình Cảm",
        href: "/quoc-gia/thai-lan",
        emoji: "🇹🇭",
        gradient: "from-[#7c2d12] via-[#c2410c] to-[#ea580c]",
        accent: "#fb923c",
        pattern: "dots",
    },
    {
        label: "Anime",
        sub: "Hoạt Hình Nhật Bản",
        href: "/danh-sach/hoat-hinh",
        emoji: "🇯🇵",
        gradient: "from-[#0f172a] via-[#1e293b] to-[#334155]",
        accent: "#f472b6",
        pattern: "lines",
    },
];

function PatternBg({ type, color }: { type: string; color: string }) {
    if (type === "circles") return (
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
            <circle cx="85%" cy="20%" r="40" fill={color} />
            <circle cx="75%" cy="70%" r="24" fill={color} />
            <circle cx="90%" cy="90%" r="60" fill="none" stroke={color} strokeWidth="1.5" />
        </svg>
    );
    if (type === "dots") return (
        <svg className="absolute inset-0 w-full h-full opacity-[0.12]" xmlns="http://www.w3.org/2000/svg">
            {[0, 1, 2, 3, 4].map(row => [0, 1, 2, 3, 4, 5, 6, 7].map(col => (
                <circle key={`${row}-${col}`} cx={col * 18 + 8} cy={row * 18 + 8} r="1.5" fill={color} />
            )))}
        </svg>
    );
    return (
        <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
            {[0, 1, 2, 3, 4, 5].map(i => (
                <line key={i} x1={i * 24} y1="0" x2={i * 24 - 60} y2="120" stroke={color} strokeWidth="8" />
            ))}
        </svg>
    );
}

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
                            className={`quick-nav-card flex-[0_0_40%] sm:flex-[0_0_28%] md:flex-[0_0_22%] lg:flex-[0_0_16%] aspect-[1.5/1] md:aspect-[16/9] lg:aspect-[1.5/1] relative rounded-2xl overflow-hidden snap-start border border-white/10 bg-gradient-to-br ${item.gradient} group hover:scale-[1.03] transition-transform duration-200`}
                        >
                            {/* Subtle background pattern */}
                            <PatternBg type={item.pattern} color={item.accent} />

                            {/* Large emoji — decorative */}
                            <div className="absolute right-2 top-1 text-[40px] sm:text-[44px] opacity-25 group-hover:opacity-40 transition-opacity duration-300 select-none pointer-events-none" style={{ filter: "saturate(0.6)" }}>
                                {item.emoji}
                            </div>

                            {/* Bottom gradient for readability */}
                            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

                            {/* Content */}
                            <div className="absolute inset-0 flex flex-col justify-end p-3">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="text-[15px] leading-none">{item.emoji}</span>
                                    <p className="text-white font-bold text-[13px] sm:text-[14px] leading-tight line-clamp-1">
                                        {item.label}
                                    </p>
                                </div>
                                <p className="text-white/60 text-[10px] sm:text-[11px] font-medium flex items-center gap-0.5 truncate">
                                    {item.sub}
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
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
