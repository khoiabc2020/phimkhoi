"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { label: "Hàn Quốc", emoji: "🇰🇷", href: "/quoc-gia/han-quoc", from: "#1d4ed8", to: "#60a5fa", glow: "rgba(96,165,250,0.4)" },
    { label: "Trung Quốc", emoji: "🇨🇳", href: "/quoc-gia/trung-quoc", from: "#b91c1c", to: "#f87171", glow: "rgba(248,113,113,0.4)" },
    { label: "Thuyết Minh", emoji: "🎙️", href: "/danh-sach/thuyet-minh", from: "#7c3aed", to: "#c084fc", glow: "rgba(192,132,252,0.4)" },
    { label: "Phim Bộ", emoji: "📺", href: "/danh-sach/phim-bo", from: "#c2410c", to: "#fb923c", glow: "rgba(251,146,60,0.4)" },
    { label: "Phim Lẻ", emoji: "🎬", href: "/danh-sach/phim-le", from: "#065f46", to: "#34d399", glow: "rgba(52,211,153,0.4)" },
    { label: "Hoạt Hình", emoji: "✨", href: "/danh-sach/hoat-hinh", from: "#9d174d", to: "#f472b6", glow: "rgba(244,114,182,0.4)" },
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
                            className="flex-[0_0_35%] md:flex-[0_0_15%] aspect-[1.4/1] relative rounded-2xl overflow-hidden shadow-lg snap-start group transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.03]"
                            style={{ background: `linear-gradient(135deg, ${item.from}, ${item.to})` }}
                        >
                            {/* Shimmer overlay on hover */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)', backgroundSize: '200%', animation: 'shimmer 1.5s ease-in-out' }}
                            />
                            {/* Glow shadow on hover */}
                            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                style={{ boxShadow: `0 0 20px ${item.glow}` }}
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center gap-1">
                                <span className="text-2xl md:text-3xl group-hover:scale-110 transition-transform duration-200 drop-shadow-md">
                                    {item.emoji}
                                </span>
                                <span className="text-white font-bold text-sm md:text-base drop-shadow-md leading-tight">
                                    {item.label}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
