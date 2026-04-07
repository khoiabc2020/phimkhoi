"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Library, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { name: "Trang chủ", href: "/",                        icon: Home    },
    { name: "Khám phá",  href: "/loc-phim",                icon: Compass },
    { name: "Thư viện",  href: "/thu-vien",                icon: Library },
    { name: "Tài khoản", href: "/thong-tin-tai-khoan",     icon: User    },
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
            className="fixed bottom-0 inset-x-0 z-[200] lg:hidden bg-[#080b12]/95 backdrop-blur-2xl border-t border-white/[0.05]"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
            <div className="flex items-center justify-around h-[60px] px-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                        pathname === item.href ||
                        (item.href !== "/" && pathname?.startsWith(item.href!));

                    const content = isActive ? (
                        /* Active → solid brand pill */
                        <span className="flex items-center gap-1.5 px-4 py-[7px] rounded-full bg-[#8FA7C5] shadow-[0_4px_18px_rgba(143,167,197,0.40)]">
                            <Icon className="w-[17px] h-[17px] text-[#060913] shrink-0" strokeWidth={2.5} />
                            <span className="text-[12px] font-black text-[#060913] whitespace-nowrap">{item.name}</span>
                        </span>
                    ) : (
                        /* Inactive → just icon */
                        <span className="flex items-center justify-center w-10 h-10">
                            <Icon className="w-[22px] h-[22px] text-white/30" strokeWidth={1.6} />
                        </span>
                    );

                    return (
                        <Link
                            key={item.href}
                            href={item.href!}
                            className="flex flex-1 items-center justify-center touch-manipulation active:scale-95 transition-transform"
                        >
                            {content}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
