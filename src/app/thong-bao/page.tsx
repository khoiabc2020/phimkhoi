"use client";

import { useState, useEffect } from "react";
import { Bell, Loader2, Info, AlertTriangle, CheckCircle, ChevronRight, Bookmark, Film, Dot } from "lucide-react";
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
    error: <AlertTriangle className="w-3.5 h-3.5" />,
    warning: <AlertTriangle className="w-3.5 h-3.5" />,
    success: <CheckCircle className="w-3.5 h-3.5" />,
    info: <Info className="w-3.5 h-3.5" />,
};
const TYPE_BG: Record<string, string> = {
    error: "bg-red-500/15 text-red-400",
    warning: "bg-yellow-400/15 text-yellow-400",
    success: "bg-emerald-400/15 text-emerald-400",
    info: "bg-[#8FA7C5]/15 text-[#8FA7C5]",
};

export default function NotificationsPage() {
    const searchParams = useSearchParams();
    const initialTab = searchParams.get("tab") === "system" ? "system" : "updates";

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
                    fetch("/api/user/notifications/updates"),
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

    const currentItems = activeTab === "updates" ? movieUpdates : systemNotifs;

    return (
        <main className="min-h-screen pt-20 pb-8 bg-[#0a0a0a]">
            <div className="absolute top-0 inset-x-0 h-[45vh] bg-gradient-to-b from-[#8FA7C5]/10 to-transparent pointer-events-none" />

            <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-4 md:px-8 lg:pl-24 lg:pr-12 relative pt-6">

                {/* Page title */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-xl bg-[#8FA7C5]/15 flex items-center justify-center border border-[#8FA7C5]/20 shrink-0">
                        <Bell className="w-4 h-4 text-[#8FA7C5]" />
                    </div>
                    <h1 className="text-[20px] font-bold text-white">Thông báo</h1>
                    <div className="ml-auto hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-bold text-emerald-400">Ổn định</span>
                    </div>
                </div>

                {/* Two-panel layout */}
                <div className="flex gap-4 min-h-[calc(100vh-200px)]">

                    {/* ── LEFT SIDEBAR ── */}
                    <div className="w-[220px] shrink-0 flex flex-col gap-2">

                        {/* Cập nhật phim */}
                        <button
                            onClick={() => setActiveTab("updates")}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all",
                                activeTab === "updates"
                                    ? "bg-[#8FA7C5]/15 border border-[#8FA7C5]/30"
                                    : "bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]"
                            )}
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                                activeTab === "updates" ? "bg-[#8FA7C5]/20" : "bg-white/5"
                            )}>
                                <Bookmark className={cn("w-3.5 h-3.5", activeTab === "updates" ? "text-[#8FA7C5]" : "text-white/40")} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={cn("text-[13px] font-bold leading-tight", activeTab === "updates" ? "text-[#8FA7C5]" : "text-white/60")}>
                                    Cập nhật phim
                                </p>
                                <p className="text-[10px] text-white/30 mt-0.5">{movieUpdates.length} thông báo</p>
                            </div>
                            {movieUpdates.length > 0 && (
                                <span className={cn(
                                    "text-[10px] font-black px-1.5 py-0.5 rounded-lg min-w-[20px] text-center",
                                    activeTab === "updates" ? "bg-[#8FA7C5]/30 text-[#8FA7C5]" : "bg-white/10 text-white/50"
                                )}>
                                    {movieUpdates.length}
                                </span>
                            )}
                        </button>

                        {/* Hệ thống */}
                        <button
                            onClick={() => setActiveTab("system")}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all",
                                activeTab === "system"
                                    ? "bg-[#8FA7C5]/15 border border-[#8FA7C5]/30"
                                    : "bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]"
                            )}
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                                activeTab === "system" ? "bg-[#8FA7C5]/20" : "bg-white/5"
                            )}>
                                <Bell className={cn("w-3.5 h-3.5", activeTab === "system" ? "text-[#8FA7C5]" : "text-white/40")} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={cn("text-[13px] font-bold leading-tight", activeTab === "system" ? "text-[#8FA7C5]" : "text-white/60")}>
                                    Hệ thống
                                </p>
                                <p className="text-[10px] text-white/30 mt-0.5">{systemNotifs.length} thông báo</p>
                            </div>
                            {systemNotifs.length > 0 && (
                                <span className={cn(
                                    "text-[10px] font-black px-1.5 py-0.5 rounded-lg min-w-[20px] text-center",
                                    activeTab === "system" ? "bg-[#8FA7C5]/30 text-[#8FA7C5]" : "bg-white/10 text-white/50"
                                )}>
                                    {systemNotifs.length}
                                </span>
                            )}
                        </button>

                        {/* Divider */}
                        <div className="border-t border-white/[0.06] my-1" />

                        {/* System status */}
                        <div className="px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2">Trạng thái</p>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-[12px] font-bold text-emerald-400">Hoạt động bình thường</span>
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT PANEL ── */}
                    <div className="flex-1 min-w-0">
                        {/* Panel header */}
                        <div className="flex items-center justify-between mb-3 px-1">
                            <p className="text-[12px] font-bold text-white/40 uppercase tracking-wider">
                                {activeTab === "updates" ? "Cập nhật phim" : "Thông báo hệ thống"}
                            </p>
                            <p className="text-[11px] text-white/25">
                                {currentItems.length} mục
                            </p>
                        </div>

                        {isLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-7 h-7 animate-spin text-[#8FA7C5]" />
                            </div>
                        ) : currentItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3 rounded-2xl border border-white/[0.06] border-dashed">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                    {activeTab === "updates"
                                        ? <Bookmark className="w-5 h-5 text-white/20" />
                                        : <Bell className="w-5 h-5 text-white/20" />}
                                </div>
                                <p className="text-white/25 text-sm">Không có thông báo nào</p>
                            </div>
                        ) : activeTab === "updates" ? (
                            /* Movie update cards — 2-col grid */
                            <div className="flex flex-col gap-2">
                                {(movieUpdates as MovieUpdate[]).map(notif => (
                                    <Link
                                        key={notif.id}
                                        href={`/phim/${notif.movieSlug}`}
                                        className="group flex items-center gap-3 px-3 py-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-[#8FA7C5]/25 transition-all duration-200"
                                    >
                                        <div className="relative w-[48px] h-[66px] shrink-0 rounded-xl overflow-hidden border border-white/10 group-hover:border-[#8FA7C5]/30 transition-colors">
                                            <Image
                                                src={getImageUrl(notif.moviePoster)}
                                                alt=""
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                sizes="48px"
                                                loading="lazy"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1.5">
                                                <h3 className="text-[13px] font-bold text-white group-hover:text-[#8FA7C5] transition-colors line-clamp-1 leading-tight">
                                                    {notif.movieName}
                                                </h3>
                                                <span className="shrink-0 text-[10px] text-white/25 whitespace-nowrap">{notif.updatedAt}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="shrink-0 text-[10px] font-black text-[#080b12] px-2 py-0.5 bg-[#8FA7C5] rounded-full uppercase">
                                                    {notif.newEpisode}
                                                </span>
                                                <span className="text-[11px] text-white/30 line-clamp-1">Vừa cập nhật</span>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-3.5 h-3.5 text-white/15 group-hover:text-[#8FA7C5] shrink-0 transition-colors" />
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            /* System notifications */
                            <div className="flex flex-col gap-2">
                                {(systemNotifs as SystemNotification[]).map(notif => (
                                    <div
                                        key={notif._id}
                                        className="relative flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all overflow-hidden"
                                    >
                                        <div className={cn("absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl", TYPE_COLOR[notif.type])} />
                                        <div className={cn("shrink-0 w-7 h-7 rounded-xl flex items-center justify-center mt-0.5", TYPE_BG[notif.type])}>
                                            {TYPE_ICON[notif.type]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <h3 className="text-[13px] font-bold text-white leading-snug line-clamp-1">{notif.title}</h3>
                                                <span className="shrink-0 text-[10px] text-white/25 whitespace-nowrap">
                                                    {new Date(notif.createdAt).toLocaleDateString("vi-VN", {
                                                        hour: "2-digit", minute: "2-digit",
                                                        day: "2-digit", month: "2-digit"
                                                    })}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2">{notif.message}</p>
                                            {notif.link && (
                                                <a href={notif.link} target="_blank" rel="noreferrer"
                                                    className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-bold text-[#8FA7C5] hover:text-white transition-colors"
                                                    onClick={e => e.stopPropagation()}>
                                                    Xem chi tiết <ChevronRight className="w-3 h-3" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
