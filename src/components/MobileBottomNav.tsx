"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Film, User, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MobileBottomNav() {
    const pathname = usePathname();

    // Hide on player page or specific routes if needed
    if (pathname?.startsWith("/xem-phim") || pathname?.startsWith("/admin")) {
        return null; // Immersive mode for player
    }

    const navItems = [
        { label: "Trang chủ", href: "/", icon: Home },
        { label: "Tìm kiếm", href: "/tim-kiem", icon: Search },
        { label: "Khám phá", href: "/danh-sach/phim-le", icon: Compass },
        { label: "Cá nhân", href: "/thong-tin-tai-khoan", icon: User },
    ];

    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0B0D12]/95 backdrop-blur-xl border-t border-white/10 z-50 pb-safe">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full gap-1",
                                isActive ? "text-primary" : "text-gray-500 hover:text-gray-300"
                            )}
                        >
                            <item.icon className={cn("w-6 h-6", isActive && "fill-current")} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
