"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    Home, 
    Tv, 
    Video, 
    LayoutGrid, 
    Hash, 
    PlayCircle, 
    Library, 
    History,
    Search
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { name: "Trang chủ", href: "/", icon: Home },
    { name: "Phim Hàn", href: "/quoc-gia/han-quoc", icon: Tv },
    { name: "Phim Trung", href: "/quoc-gia/trung-quoc", icon: Video },
    { name: "Duyệt Tìm", href: "/tim-kiem", icon: LayoutGrid },
    { name: "Chủ đề", href: "/the-loai", icon: Hash },
    { name: "Thước phim", href: "/danh-sach/phim-le", icon: PlayCircle }, // Temporary mapping
    { name: "Thư viện", href: "/thu-vien", icon: Library },
    { name: "Lịch sử", href: "/lich-su-xem", icon: History },
];

export default function Sidebar() {
    const pathname = usePathname();

    // Hide sidebar on Auth and Admin routes
    if (pathname === "/login" || pathname === "/register" || pathname?.startsWith("/admin")) {
        return null;
    }

    return (
        <aside className="fixed left-0 top-0 bottom-0 z-50 hidden lg:flex flex-col w-20 xl:w-64 bg-[#0a0a0a]/98 border-r border-white/5 shadow-2xl transition-all duration-300 overflow-y-auto no-scrollbar">
            {/* Logo Section */}
            <div className="flex items-center justify-center xl:justify-start px-2 xl:px-8 h-20 shrink-0">
                <Link href="/" className="flex items-center gap-2 group">
                    <span className="xl:hidden font-logo text-2xl font-bold text-[#22C55E]">K</span>
                    <span className="hidden xl:inline font-logo text-2xl font-bold tracking-tight">
                        <span className="text-white">KHOI</span><span className="text-[#22C55E]">PHIM</span>
                    </span>
                </Link>
            </div>

            {/* Navigation Section */}
            <nav className="flex-1 flex flex-col gap-2 p-3 xl:px-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "relative flex items-center justify-center xl:justify-start gap-4 px-3 py-3.5 rounded-xl transition-all duration-200 group",
                                isActive 
                                    ? "bg-[#22C55E]/10 text-[#22C55E]" 
                                    : "text-white/40 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {/* Active Indicator Bar */}
                            {isActive && (
                                <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#22C55E] rounded-r-full shadow-[0_0_10px_#22C55E]" />
                            )}

                            <Icon className={cn(
                                "w-6 h-6 shrink-0 transition-all duration-300",
                                isActive ? "scale-110 drop-shadow-[0_0_8px_#22C55E99]" : "group-hover:scale-110 group-hover:text-white"
                            )} />
                            
                            <span className={cn(
                                "hidden xl:inline text-[15px] font-medium transition-colors",
                                isActive ? "font-bold" : ""
                            )}>
                                {item.name}
                            </span>

                            {/* Tooltip for collapsed state */}
                            <div className="absolute left-full ml-4 px-2 py-1 bg-white text-[#0a0a0a] text-xs font-bold rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all xl:hidden whitespace-nowrap z-[60]">
                                {item.name}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / User Preview or Settings could go here */}
            <div className="p-4 border-t border-white/5 shrink-0">
                <div className="xl:flex items-center gap-3 px-3 py-2 text-white/40 hover:text-white cursor-pointer transition-colors hidden truncate">
                    <div className="w-8 h-8 rounded-full bg-[#22C55E]/20 flex items-center justify-center shrink-0">
                        <span className="text-[#22C55E] text-xs font-bold">K</span>
                    </div>
                    <span className="text-sm font-medium">Premium User</span>
                </div>
            </div>
        </aside>
    );
}
