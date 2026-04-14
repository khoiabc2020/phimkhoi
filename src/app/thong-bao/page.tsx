"use client";

import { useState, useEffect } from "react";
import { Bell, Loader2, Info, AlertTriangle, CheckCircle, Clock, Film, ChevronRight, Bookmark, Dot } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { getImageUrl, cn } from "@/lib/utils";

type SystemNotification = {
    _id: string;
    title: string;
    message: string;
    link?: string;
    type: "info" | "success" | "warning" | "error";
    createdAt: string;
};

type MovieUpdate = {
    id: string;
    movieName: string;
    movieSlug: string;
    moviePoster: string;
    newEpisode: string;
    updatedAt: string;
    isRead: boolean;
};

const TYPE_COLOR: Record<string, string> = {
    error: "bg-red-500",
    warning: "bg-yellow-400",
    success: "bg-emerald-400",
    info: "bg-[#8FA7C5]",
};

const TYPE_ICON: Record<string, React.ReactNode> = {
    error: <AlertTriangle className="w-4 h-4" />,
    warning: <AlertTriangle className="w-4 h-4" />,
    success: <CheckCircle className="w-4 h-4" />,
    info: <Info className="w-4 h-4" />,
};

export default function NotificationsPage() {
    const searchParams = useSearchParams();
    const initialTab = searchParams.get("tab") === "updates" ? "updates" : "system";

    const [activeTab, setActiveTab] = useState<"updates" | "system">(initialTab);
    const [systemNotifs, setSystemNotifs] = useState<SystemNotification[]>([]);
    const [movieUpdates, setMovieUpdates] = useState<MovieUpdate[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [sysRes, movieRes] = await Promise.all([
                    fetch("/api/notifications"),
                    fetch("/api/user/notifications/updates")
                ]);
                if (sysRes.ok) setSystemNotifs(await sysRes.json());
                if (movieRes.ok) {
                    const data = await movieRes.json();
                    setMovieUpdates(data.notifications || []);
                }
            } catch { /* noop */ } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <main className="min-h-screen pt-20 pb-16 bg-[#0a0a0a]">
            {/* Subtle glow */}
            <div className="absolute top-0 inset-x-0 h-[50vh] bg-gradient-to-b from-[#8FA7C5]/10 to-transparent pointer-events-none" />

            <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-4 md:px-8 lg:pl-24 lg:pr-12 relative">

                {/* ── Compact header ── */}
                <div className="pt-6 pb-5 flex items-center justify-between gap-4 border-b border-white/[0.07]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#8FA7C5]/15 flex items-center justify-center border border-[#8FA7C5]/20">
                            <Bell className="w-4 h-4 text-[#8FA7C5]" />
                        </div>
                        <div>
                            <h1 className="text-[18px] font-bold text-white leading-tight">Thông báo</h1>
                            <p className="text-[11px] text-white/35 font-medium">Cập nhật phim & hệ thống</p>
                        </div>
                    </div>

                    {/* Status chip */}
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[11px] font-bold text-emerald-400">Hệ thống ổn định</span>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className="flex items-center gap-1 pt-4 pb-5">
                    {[
                        { id: "updates" as const, label: "Cập nhật phim", icon: <Bookmark className="w-3.5 h-3.5" />, count: movieUpdates.length },
                        { id: "system" as const, label: "Hệ thống", icon: <Bell className="w-3.5 h-3.5" />, count: systemNotifs.length },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold transition-all",
                                activeTab === tab.id
                                    ? "bg-[#8FA7C5] text-[#080b12] shadow-lg shadow-[#8FA7C5]/20"
                                    : "text-white/40 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {tab.icon}
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={cn(
                                    "text-[10px] font-black px-1.5 py-0.5 rounded-md min-w-[20px] text-center",
                                    activeTab === tab.id ? "bg-black/15" : "bg-white/10"
                                )}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── Content ── */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="w-8 h-8 animate-spin text-[#8FA7C5]" />
                    </div>
                ) : activeTab === "updates" ? (
                    movieUpdates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-3">
                            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
                                <Bookmark className="w-6 h-6 text-white/20" />
                            </div>
                            <p className="text-white/30 text-sm">Không có cập nhật phim nào</p>
                        </div>
                    ) : (
                        /* ── HORIZONTAL GRID — 2 cols on md+, 1 col mobile ── */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {movieUpdates.map((notif) => (
                                <Link
                                    key={notif.id}
                                    href={`/phim/${notif.movieSlug}`}
                                    className="group flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-[#8FA7C5]/30 transition-all duration-200"
                                >
                                    {/* Poster */}
                                    <div className="relative w-[52px] h-[72px] shrink-0 rounded-xl overflow-hidden bg-white/5 border border-white/10 group-hover:border-[#8FA7C5]/40 transition-colors">
                                        <Image
                                            src={getImageUrl(notif.moviePoster)}
                                            alt=""
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            sizes="52px"
                                            loading="lazy"
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1.5">
                                            <h3 className="text-[14px] font-bold text-white group-hover:text-[#8FA7C5] transition-colors leading-tight line-clamp-1">
                                                {notif.movieName}
                                            </h3>
                                            <span className="shrink-0 text-[10px] text-white/30 font-medium whitespace-nowrap">
                                                {notif.updatedAt}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="shrink-0 text-[11px] font-black text-[#080b12] px-2 py-0.5 bg-[#8FA7C5] rounded-full uppercase tracking-wide">
                                                {notif.newEpisode}
                                            </span>
                                            <span className="text-[11px] text-white/35 line-clamp-1">
                                                Vừa cập nhật bản dịch mới nhất
                                            </span>
                                        </div>
                                    </div>

                                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-[#8FA7C5] shrink-0 transition-colors" />
                                </Link>
                            ))}
                        </div>
                    )
                ) : (
                    /* ── SYSTEM NOTIFICATIONS ── */
                    systemNotifs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-3">
                            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
                                <Bell className="w-6 h-6 text-white/20" />
                            </div>
                            <p className="text-white/30 text-sm">Hệ thống đang ổn định</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {systemNotifs.map((notif) => (
                                <div
                                    key={notif._id}
                                    className="relative flex items-start gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all overflow-hidden"
                                >
                                    {/* Left accent bar */}
                                    <div className={cn("absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl", TYPE_COLOR[notif.type])} />

                                    {/* Icon */}
                                    <div className={cn(
                                        "shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5",
                                        notif.type === "error" ? "bg-red-500/15 text-red-400" :
                                        notif.type === "warning" ? "bg-yellow-400/15 text-yellow-400" :
                                        notif.type === "success" ? "bg-emerald-400/15 text-emerald-400" :
                                        "bg-[#8FA7C5]/15 text-[#8FA7C5]"
                                    )}>
                                        {TYPE_ICON[notif.type]}
                                    </div>

                                    {/* Body */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h3 className="text-[13px] font-bold text-white leading-snug line-clamp-1">{notif.title}</h3>
                                            <span className="shrink-0 text-[10px] text-white/30 font-medium whitespace-nowrap">
                                                {new Date(notif.createdAt).toLocaleDateString("vi-VN", {
                                                    hour: "2-digit", minute: "2-digit",
                                                    day: "2-digit", month: "2-digit"
                                                })}
                                            </span>
                                        </div>
                                        <p className="text-[12px] text-white/45 leading-relaxed line-clamp-2">{notif.message}</p>
                                        {notif.link && (
                                            <a
                                                href={notif.link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-[#8FA7C5] hover:text-white transition-colors"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                Xem chi tiết <ChevronRight className="w-3 h-3" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </main>
    );
}
