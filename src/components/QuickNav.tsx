"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { label: "Hàn Quốc", href: "/quoc-gia/han-quoc", color: "from-blue-600 to-blue-400" },
    { label: "Trung Quốc", href: "/quoc-gia/trung-quoc", color: "from-red-600 to-red-400" },
    { label: "Thuyết Minh", href: "/danh-sach/thuyet-minh", color: "from-purple-600 to-purple-400" },
    { label: "Phim Bộ", href: "/danh-sach/phim-bo", color: "from-orange-600 to-orange-400" },
    { label: "Phim Lẻ", href: "/danh-sach/phim-le", color: "from-emerald-600 to-emerald-400" },
    { label: "Hoạt Hình", href: "/danh-sach/hoat-hinh", color: "from-pink-600 to-pink-400" },
];

export default function QuickNav() {
    return (
        <div className="w-full py-2 pb-8">
            <div className="container mx-auto px-4 md:px-12 mb-4">
                <h2 className="text-[17px] font-bold text-white mb-4">Danh sách nổi bật</h2>

                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 snap-x">
                    {NAV_ITEMS.map((item, index) => (
                        <Link
                            key={index}
                            href={item.href}
                            className={cn(
                                "flex-[0_0_35%] md:flex-[0_0_15%] aspect-[1.4/1] relative rounded-xl overflow-hidden shadow-lg snap-start group",
                                "bg-gradient-to-br", item.color
                            )}
                        >
                            <div className="absolute inset-0 flex items-center justify-center p-2 text-center">
                                <span className="text-white font-bold text-sm md:text-lg group-hover:scale-105 transition-transform duration-200">
                                    {item.label}
                                </span>
                            </div>
                            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
