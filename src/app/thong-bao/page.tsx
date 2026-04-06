"use client";

import { useState, useEffect } from "react";
import { Bell, Loader2, Info, AlertTriangle, CheckCircle, Clock, ChevronRight, Bookmark, Film, Wifi } from "lucide-react";
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

const TYPE_CONFIG = {
    error:   { icon: AlertTriangle, color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20",    bar: "bg-red-500"    },
    warning: { icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", bar: "bg-yellow-500" },
    success: { icon: CheckCircle,   color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/20",  bar: "bg-green-500"  },
    info:    { icon: Info,          color: "text-primary",    bg: "bg-primary/10",    border: "border-primary/20",    bar: "bg-primary"    },
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
                    fetch("/api/user/notifications/updates"),
                ]);
                if (sysRes.ok) setSystemNotifs(await sysRes.json());
                if (movieRes.ok) {
                    const data = await movieRes.json();
                    setMovieUpdates(data.notifications || []);
                }
            } catch {
                // silent
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <main className="min-h-screen pt-20 pb-16">
            {/* Subtle background */}
            <div className="fixed inset-0 bg-[#07070B] -z-20" />
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/4 blur-[160px] rounded-full pointer-events-none -z-10" />

            <div className="w-full max-w-[780px] mx-auto px-4 sm:px-6">

                {/* ── Header ── */}
                <div className="pt-8 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
                            <Bell className="w-4.5 h-4.5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white leading-tight">Thông báo</h1>
                            <p className="text-[12px] text-white/30 mt-0.5">Cập nhật phim &amp; hệ thống</p>
                        </div>
                    </div>

                    {/* Status pill */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/8 border border-green-500/15 self-start sm:self-auto">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[11px] font-semibold text-green-400">Hệ thống ổn định</span>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className="flex items-center gap-1 bg-white/4 border border-white/8 rounded-xl p-1 mb-6 w-fit">
                    {([
                        { id: "updates", label: "Cập nhật phim", icon: Film,  count: movieUpdates.length },
                        { id: "system",  label: "Hệ thống",      icon: Bell,  count: 0 },
                    ] as const).map(({ id, label, icon: Icon, count }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all",
                                activeTab === id
                                    ? "bg-white/10 text-white shadow-sm"
                                    : "text-white/35 hover:text-white/70"
                            )}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {label}
                            {count > 0 && (
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded-md text-[10px] font-bold",
                                    activeTab === id ? "bg-primary/20 text-primary" : "bg-white/10 text-white/50"
                                )}>
                                    {count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── Content ── */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center min-h-[320px] gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-white/20" />
                        <p className="text-[12px] text-white/20 tracking-widest uppercase">Đang tải...</p>
                    </div>
                ) : activeTab === "updates" ? (
                    /* ── Movie Updates ── */
                    <div className="space-y-2">
                        {movieUpdates.length === 0 ? (
                            <EmptyState
                                icon={<Bookmark className="w-6 h-6 text-white/20" />}
                                title="Chưa có tập mới"
                                desc="Theo dõi phim để nhận thông báo khi có tập mới."
                            />
                        ) : (
                            movieUpdates.map((notif) => (
                                <Link
                                    key={notif.id}
                                    href={`/phim/${notif.movieSlug}`}
                                    className="group flex items-center gap-4 p-3.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl transition-all"
                                >
                                    {/* Poster */}
                                    <div className="relative w-12 sm:w-14 aspect-[2/3] rounded-lg overflow-hidden shrink-0 ring-1 ring-white/10">
                                        <Image
                                            src={getImageUrl(notif.moviePoster)}
                                            alt=""
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            unoptimized
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] sm:text-sm font-semibold text-white group-hover:text-primary transition-colors truncate mb-1.5">
                                            {notif.movieName}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-bold text-black bg-primary px-2 py-0.5 rounded-md">
                                                {notif.newEpisode}
                                            </span>
                                            <span className="text-[11px] text-white/30 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {notif.updatedAt}
                                            </span>
                                        </div>
                                    </div>

                                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 shrink-0 transition-colors" />
                                </Link>
                            ))
                        )}
                    </div>
                ) : (
                    /* ── System Notifications ── */
                    <div className="space-y-2">
                        {systemNotifs.length === 0 ? (
                            <EmptyState
                                icon={<Bell className="w-6 h-6 text-white/20" />}
                                title="Hệ thống đang ổn định"
                                desc="Không có thông báo bảo trì hay tin tức mới."
                            />
                        ) : (
                            systemNotifs.map((notif) => {
                                const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.info;
                                const Icon = cfg.icon;
                                return (
                                    <div
                                        key={notif._id}
                                        className="relative flex gap-4 p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden"
                                    >
                                        {/* Color bar */}
                                        <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${cfg.bar} rounded-full`} />

                                        {/* Icon */}
                                        <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${cfg.bg} border ${cfg.border} mt-0.5`}>
                                            <Icon className={`w-4 h-4 ${cfg.color}`} />
                                        </div>

                                        {/* Body */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <p className="text-[13px] sm:text-sm font-semibold text-white leading-snug">{notif.title}</p>
                                                <span className="text-[10px] text-white/25 whitespace-nowrap shrink-0 mt-0.5">
                                                    {new Date(notif.createdAt).toLocaleDateString("vi-VN", {
                                                        day: "2-digit", month: "2-digit", year: "numeric",
                                                        hour: "2-digit", minute: "2-digit",
                                                    })}
                                                </span>
                                            </div>
                                            <p className="text-[12px] text-white/40 leading-relaxed mb-3">{notif.message}</p>
                                            {notif.link && (
                                                <a
                                                    href={notif.link}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
                                                >
                                                    Xem chi tiết <ChevronRight className="w-3 h-3" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}

function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center border border-dashed border-white/8 rounded-2xl px-6 py-12">
            <div className="w-14 h-14 bg-white/4 rounded-2xl flex items-center justify-center mb-4">
                {icon}
            </div>
            <h3 className="text-sm font-semibold text-white/60 mb-1">{title}</h3>
            <p className="text-[12px] text-white/25 max-w-[260px]">{desc}</p>
        </div>
    );
}
