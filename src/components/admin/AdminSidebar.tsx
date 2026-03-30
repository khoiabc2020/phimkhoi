"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Captions, Film, History, LayoutDashboard, LogOut, MessageSquare, Settings, Star, Users } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const sidebarItems = [
    { label: "Tổng Quan", href: "/admin", icon: LayoutDashboard },
    { label: "Phim", href: "/admin/movies", icon: Film },
    { label: "Phụ Đề", href: "/admin/subtitles", icon: Captions },
    { label: "Thành Viên", href: "/admin/users", icon: Users },
    { label: "Custom Hero", href: "/admin/hero", icon: Star },
    { label: "Bình Luận", href: "/admin/comments", icon: MessageSquare },
    { label: "Thông Báo", href: "/admin/notifications", icon: Bell },
    { label: "Nhật Ký", href: "/admin/audit", icon: History },
    { label: "Cài Đặt", href: "/admin/settings", icon: Settings },
];

export default function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-white/10 bg-black/95">
            <div className="flex h-16 items-center border-b border-white/10 px-6">
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-black shadow-lg shadow-primary/50">
                        K
                    </div>
                    <span className="text-xl font-bold text-white">KHOIPHIM Admin</span>
                </Link>
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto p-4">
                {sidebarItems.map((item) => {
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200",
                                isActive
                                    ? "bg-primary font-bold text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                                    : "text-gray-400 hover:bg-white/10 hover:text-white",
                            )}
                        >
                            <item.icon className={cn("h-5 w-5", isActive ? "text-black" : "text-gray-400 group-hover:text-white")} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-white/10 p-4">
                <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-red-500 transition-colors hover:bg-red-500/10"
                >
                    <LogOut className="h-5 w-5" />
                    <span>Đăng Xuất</span>
                </button>
            </div>
        </aside>
    );
}
