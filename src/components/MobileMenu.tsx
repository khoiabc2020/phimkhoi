"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export default function MobileMenu() {
    const pathname = usePathname();

    const menuItems = [
        { label: "Đề xuất", href: "/", icon: null },
        { label: "Phim bộ", href: "/danh-sach/phim-bo" },
        { label: "Phim lẻ", href: "/danh-sach/phim-le" },
        { label: "TV Shows", href: "/danh-sach/tv-shows" },
        { label: "Hoạt hình", href: "/danh-sach/hoat-hinh" },
        { label: "Sắp chiếu", href: "/danh-sach/phim-sap-chieu" },
    ];

    return (
        <div className="md:hidden w-full overflow-x-auto bg-transparent pb-2 scrollbar-hide z-50">
            <div className="flex items-center gap-2 px-4 min-w-max">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                                isActive
                                    ? "bg-white text-black font-bold shadow-md"
                                    : "bg-white/10 text-gray-300 border border-white/10 hover:bg-white/20"
                            )}
                        >
                            {item.label}
                        </Link>
                    );
                })}

                {/* Dropdowns as Pills (Simplified for now) */}
                <button className="px-4 py-1.5 rounded-full text-sm font-medium bg-white/10 text-gray-300 border border-white/10 flex items-center gap-1 whitespace-nowrap">
                    Thể loại <ChevronDown size={14} />
                </button>
                <button className="px-4 py-1.5 rounded-full text-sm font-medium bg-white/10 text-gray-300 border border-white/10 flex items-center gap-1 whitespace-nowrap">
                    Quốc gia <ChevronDown size={14} />
                </button>
            </div>
        </div>
    );
}
