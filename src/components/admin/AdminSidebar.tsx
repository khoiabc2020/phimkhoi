"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, MessageSquare, Settings, Film, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

const sidebarItems = [
    { label: "Tổng quan", href: "/admin", icon: LayoutDashboard },
    { label: "Thành viên", href: "/admin/users", icon: Users },
    // { label: "Phim (Coming soon)", href: "/admin/movies", icon: Film },
    { label: "Bình luận", href: "/admin/comments", icon: MessageSquare },
    { label: "Cài đặt", href: "/admin/settings", icon: Settings },
];

export default function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-black/95 border-r border-white/10 h-screen fixed left-0 top-0 flex flex-col z-50">
            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-white/10">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-black shadow-lg shadow-primary/50">
                        K
                    </div>
                    <span className="font-bold text-xl text-white">MovieBox Admin</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {sidebarItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-primary text-black font-bold shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                                    : "text-gray-400 hover:text-white hover:bg-white/10"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5", isActive ? "text-black" : "text-gray-400 group-hover:text-white")} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer Actions */}
            <div className="p-4 border-t border-white/10">
                <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Đăng xuất</span>
                </button>
            </div>
        </aside>
    );
}
