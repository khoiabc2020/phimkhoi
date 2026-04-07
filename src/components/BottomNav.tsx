"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Tv, Video, Search, Library } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { name: "Trang chủ", href: "/", icon: Home },
    { name: "Phim Hàn", href: "/phim-han", icon: Tv },
    { name: "Tìm kiếm", href: "/tim-kiem", icon: Search },
    { name: "Phim Trung", href: "/phim-trung", icon: Video },
    { name: "Thư viện", href: "/thu-vien", icon: Library },
];

export default function BottomNav() {
    const pathname = usePathname();

    if (
        pathname === "/login" ||
        pathname === "/register" ||
        pathname?.startsWith("/admin") ||
        pathname?.startsWith("/xem-phim")
    ) return null;

    return (
        <nav
            className="fixed bottom-0 inset-x-0 z-[200] lg:hidden border-t border-white/[0.06] bg-[#080b12]/90 backdrop-blur-xl"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
            <div className="flex items-stretch h-14">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "relative flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors active:scale-95 touch-manipulation",
                                isActive ? "text-[#8FA7C5]" : "text-white/35 hover:text-white/70"
                            )}
                        >
                            <Icon className={cn("w-5 h-5 shrink-0", isActive && "drop-shadow-[0_0_6px_#8FA7C560]")} strokeWidth={isActive ? 2 : 1.75} />
                            <span className={cn("text-[9px] font-semibold tracking-wide truncate max-w-[56px] text-center", isActive ? "opacity-100" : "opacity-60")}>
                                {item.name}
                            </span>
                            {isActive && (
                                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full bg-[#8FA7C5] shadow-[0_0_8px_#8FA7C5]" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
