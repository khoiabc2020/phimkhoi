"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, ChevronRight, Loader2, User } from "lucide-react";
import { useSession } from "next-auth/react";
import { getImageUrl, cn } from "@/lib/utils";
import NextLink from "next/link";
import Image from "next/image";

interface NotificationItem {
    id: string;
    movieName: string;
    movieSlug: string;
    moviePoster: string;
    newEpisode: string;
    updatedAt: string;
    isRead: boolean;
}

export default function NotificationDropdown() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Tải số unread nhẹ khi mount — badge hiện ngay mà không cần load full list
    useEffect(() => {
        if (!session) return;
        fetch("/api/user/notifications/count")
            .then(r => r.json())
            .then(d => { if (d.count > 0) setHasUnread(true); })
            .catch(() => {});
    }, [session]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/user/notifications/updates");
            const data = await res.json();
            if (data.notifications) {
                setNotifications(data.notifications);
                setHasUnread(data.notifications.some((n: any) => !n.isRead));
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async () => {
        setHasUnread(false);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        // Persist mark-as-read to DB
        fetch("/api/user/notifications/updates", { method: "PATCH" }).catch(() => {});
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) {
                         fetchNotifications(); // Refresh on open
                         setHasUnread(false); // Optimistic clear
                    }
                }}
                className={cn(
                    "relative p-2 rounded-full transition-all text-white/70 hover:text-white bg-white/5 hover:bg-white/10",
                    isOpen && "bg-white/10 text-white"
                )}
            >
                <Bell className="w-5 h-5" />
                {hasUnread && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-primary border-2 border-[#0a0a0a] rounded-full animate-pulse shadow-[0_0_10px_rgba(143,167,197,0.8)]" />
                )}
            </button>

            {isOpen && (
                <div className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-[68px] sm:top-full sm:mt-3 sm:w-[420px] bg-[#0c0c14]/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] z-[200] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 ease-out">
                    {/* Panel Header */}
                    <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.02]">
                        <div className="flex items-center gap-2.5">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <h3 className="text-[14px] font-bold text-white">Thông báo mới</h3>
                        </div>
                        {notifications.length > 0 && (
                            <button
                                onClick={markAsRead}
                                className="text-[11px] text-white/40 hover:text-primary font-bold transition-colors"
                            >
                                Đánh dấu đã đọc
                            </button>
                        )}
                    </div>

                    {/* Content Scrollable */}
                    <div className="max-h-[55vh] sm:max-h-[500px] overflow-y-auto custom-scrollbar">
                        {!session ? (
                            <div className="p-10 text-center space-y-4">
                                <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mx-auto ring-1 ring-white/10">
                                    <User className="w-7 h-7 text-white/20" />
                                </div>
                                <p className="text-[13px] text-white/50 font-medium max-w-[220px] mx-auto leading-relaxed">Vui lòng đăng nhập để theo dõi cập nhật từ phim yêu thích</p>
                                <NextLink href="/login" onClick={() => setIsOpen(false)} className="inline-block px-10 py-3 bg-[#8FA7C5] text-black text-[13px] font-bold rounded-full hover:bg-[#a8bdd8] transition-all active:scale-95 shadow-lg shadow-[#8FA7C5]/20">Đăng nhập</NextLink>
                            </div>
                        ) : loading ? (
                            <div className="p-16 flex flex-col items-center justify-center gap-4">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                <span className="text-[11px] text-primary/60 font-bold tracking-wider uppercase animate-pulse">Đang kiểm tra...</span>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-20 text-center space-y-4">
                                <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mx-auto opacity-10 ring-1 ring-white/20">
                                    <Bell className="w-7 h-7 text-white" />
                                </div>
                                <p className="text-[13px] text-white/40 font-medium px-8">Bạn đã cập nhật hết!</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/[0.03]">
                                {notifications.map((notif) => (
                                    <NextLink
                                        key={notif.id}
                                        href={`/phim/${notif.movieSlug}`}
                                        onClick={() => setIsOpen(false)}
                                        className="group relative flex items-center gap-4 p-4 hover:bg-white/[0.03] transition-all ease-in-out duration-200"
                                    >
                                        <div className="relative w-[50px] aspect-[2/3] rounded overflow-hidden shadow-xl ring-1 ring-white/10 group-hover:ring-primary/50 transition-all shrink-0">
                                            <Image
                                                src={getImageUrl(notif.moviePoster)}
                                                alt=""
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                unoptimized
                                            />
                                            {!notif.isRead && (
                                                <div className="absolute inset-0 bg-primary/10" />
                                            )}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1.5">
                                                <span className="text-[14px] font-bold text-white group-hover:text-[#8FA7C5] transition-colors truncate">
                                                    {notif.movieName}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 overflow-hidden">
                                                <span className="shrink-0 text-[11px] font-bold text-primary px-1.5 py-0.5 bg-primary/10 rounded uppercase">
                                                    Tập {notif.newEpisode}
                                                </span>
                                                <span className="text-[11px] text-white/40 truncate font-medium">
                                                    Vừa cập nhật • {notif.updatedAt}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                                            <ChevronRight className="w-4 h-4 text-primary" />
                                        </div>
                                    </NextLink>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Action Footer (Elite Glassmorphic) */}
                    <div className="p-2 border-t border-white/[0.05] bg-white/[0.01]">
                        <NextLink
                            href="/thong-bao?tab=updates" // Correct routing to unified notification page
                            onClick={() => setIsOpen(false)}
                            className="group flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-center text-[12px] text-[#8FA7C5] font-bold transition-all border border-white/5 hover:border-[#8FA7C5]/30"
                        >
                            Xem tất cả <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </NextLink>
                    </div>
                </div>
            )}
        </div>
    );
}
