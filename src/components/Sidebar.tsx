"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
    { name: "Phim Hàn", href: "/phim-han", icon: Tv },
    { name: "Phim Trung", href: "/phim-trung", icon: Video },
    { name: "Duyệt Tìm", href: "/loc-phim", icon: Search },
    { name: "Chủ đề", href: "/the-loai", icon: Hash },
    { name: "Thư viện", href: "/thu-vien", icon: Library },
    { name: "Lịch sử", href: "/lich-su-xem", icon: History },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    // Hide sidebar on Auth and Admin routes
    if (pathname === "/login" || pathname === "/register" || pathname?.startsWith("/admin")) {
        return null;
    }

    return (
        <aside className="fixed left-0 top-[54px] lg:top-[64px] bottom-0 z-[100] hidden lg:flex flex-col w-20 bg-transparent transition-all duration-300 border-r border-white/5 overflow-y-auto no-scrollbar">
            <div className="h-4 shrink-0" />

            {/* Navigation Section */}
            <nav className="flex-1 flex flex-col gap-5 py-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onMouseEnter={() => router.prefetch(item.href)}
                            onFocus={() => router.prefetch(item.href)}
                            className={cn(
                                "relative flex flex-col items-center justify-center gap-1.5 py-3 transition-all duration-200 group",
                                isActive 
                                    ? "text-[#8FA7C5]" 
                                    : "text-white/40 hover:text-white"
                            )}
                        >
                            {/* Active Indicator Bar - Left Edge */}
                            {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#8FA7C5] shadow-[2px_0_12px_#8FA7C5]" />
                            )}

                            <Icon className={cn(
                                "w-6 h-6 shrink-0 transition-all duration-300",
                                isActive ? "scale-110 drop-shadow-[0_0_8px_#8FA7C588]" : "group-hover:scale-110 group-hover:text-white"
                            )} />
                            
                            <span className={cn(
                                "text-[10px] font-medium tracking-normal text-center transition-colors",
                                isActive ? "opacity-100" : "opacity-40 group-hover:opacity-100"
                            )}>
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer space */}
            <div className="h-6 shrink-0" />
        </aside>
    );
}
