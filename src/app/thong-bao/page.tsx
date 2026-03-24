"use client";

import { useState, useEffect } from "react";
import { Bell, Loader2, Info, AlertTriangle, CheckCircle, Clock, Film, ChevronRight, Bookmark } from "lucide-react";
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

                if (sysRes.ok) {
                    const data = await sysRes.json();
                    setSystemNotifs(data);
                }
                if (movieRes.ok) {
                    const data = await movieRes.json();
                    setMovieUpdates(data.notifications || []);
                }
            } catch (err) {
                console.error("Failed to fetch notifications");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <main className="min-h-screen pt-20 pb-16 relative">
            {/* Background elements */}
            <div className="absolute inset-0 bg-[#07070B] -z-20" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10 opacity-50" />

            <div className="w-full max-w-[900px] mx-auto px-4 sm:px-6">
                <div className="mb-8 md:mb-12 text-center pt-6">
                    <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
                        Trung tâm thông báo
                    </h1>
                    <p className="text-gray-400 text-sm md:text-base max-w-[600px] mx-auto font-medium">
                        Theo dõi mọi cập nhật mới nhất từ bộ sưu tập phim yêu thích và thông báo quan trọng của hệ thống.
                    </p>
                </div>

                {/* Tab Switcher (Elite) */}
                <div className="flex items-center justify-center p-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl mb-10 w-fit mx-auto shadow-2xl">
                    <button
                        onClick={() => setActiveTab("updates")}
                        className={cn(
                            "flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[13px] font-black uppercase tracking-widest transition-all",
                            activeTab === "updates" ? "bg-[#8FA7C5] text-black shadow-lg" : "text-white/40 hover:text-white"
                        )}
                    >
                        <Bookmark className={cn("w-4 h-4", activeTab === "updates" ? "text-black" : "text-white/20")} />
                        Cập nhật phim
                        {movieUpdates.length > 0 && (
                            <span className={cn("ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-black", activeTab === "updates" ? "bg-black/10" : "bg-white/10")}>
                                {movieUpdates.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("system")}
                        className={cn(
                            "flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[13px] font-black uppercase tracking-widest transition-all",
                            activeTab === "system" ? "bg-[#8FA7C5] text-black shadow-lg" : "text-white/40 hover:text-white"
                        )}
                    >
                        <Bell className={cn("w-4 h-4", activeTab === "system" ? "text-black" : "text-white/20")} />
                        Hệ thống
                    </button>
                </div>

                {/* VPS / System Status Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-[#0B0B10]/60 backdrop-blur-md border border-white/[0.08] rounded-2xl p-5 flex items-center justify-between group hover:border-primary/30 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Trạng thái VPS</p>
                                <p className="text-sm font-bold text-white">Đang hoạt động</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-green-500/80 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">ONLINE</span>
                    </div>

                    <div className="bg-[#0B0B10]/60 backdrop-blur-md border border-white/[0.08] rounded-2xl p-5 flex items-center justify-between group hover:border-primary/30 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                <CheckCircle className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Cơ sở dữ liệu</p>
                                <p className="text-sm font-bold text-white">Kết nối tốt</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-blue-500/80 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">CONNECTED</span>
                    </div>

                    <div className="bg-[#0B0B10]/60 backdrop-blur-md border border-white/[0.08] rounded-2xl p-5 flex items-center justify-between group hover:border-primary/30 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                <Clock className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Lần cuối đồng bộ</p>
                                <p className="text-sm font-bold text-white">Vừa xong</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-primary/80 bg-primary/10 px-2 py-0.5 rounded border border-primary/20">SYNCED</span>
                    </div>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center min-h-[400px]">
                            <Loader2 className="w-10 h-10 animate-spin text-[#8FA7C5] mb-6" />
                            <p className="text-white/30 font-black uppercase tracking-[4px]">Syncing Data...</p>
                        </div>
                    ) : activeTab === "updates" ? (
                        /* MOVIE UPDATES TAB */
                        <div className="space-y-4">
                            {movieUpdates.length === 0 ? (
                                <div className="flex flex-col items-center justify-center min-h-[400px] text-center bg-[#0B0B10]/40 rounded-3xl border border-white/5 border-dashed">
                                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 opacity-20">
                                        <Bookmark className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight italic">Tất cả đã sẵn sàng!</h3>
                                    <p className="text-white/30 text-sm font-medium">Hiện không có tập phim mới nào trong danh sách yêu thích của bạn.</p>
                                </div>
                            ) : (
                                movieUpdates.map((notif) => (
                                    <Link
                                        key={notif.id}
                                        href={`/phim/${notif.movieSlug}`}
                                        className="group relative flex items-center gap-6 p-5 bg-[#0B0B10]/60 backdrop-blur-xl border border-white/[0.05] rounded-3xl hover:border-[#8FA7C5]/30 transition-all shadow-2xl overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-[#8FA7C5]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        
                                        <div className="relative w-[70px] sm:w-[90px] aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 group-hover:ring-[#8FA7C5]/50 transition-all shrink-0">
                                            <Image
                                                src={getImageUrl(notif.moviePoster)}
                                                alt=""
                                                fill
                                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                                                unoptimized
                                            />
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                                <h3 className="text-lg sm:text-2xl font-black text-white group-hover:text-[#8FA7C5] transition-colors truncate tracking-tighter uppercase italic">
                                                    {notif.movieName}
                                                </h3>
                                                <span className="flex items-center gap-1.5 text-[12px] text-white/30 font-bold shrink-0">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {notif.updatedAt}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-3">
                                                <span className="shrink-0 text-[13px] font-black text-black px-3 py-1 bg-[#8FA7C5] rounded-full uppercase shadow-lg shadow-[#8FA7C5]/20">
                                                    Tập {notif.newEpisode}
                                                </span>
                                                <p className="text-white/50 text-[13px] sm:text-sm font-medium leading-relaxed italic truncate">
                                                    Vừa cập nhật bản dịch mới nhất. Hãy thưởng thức ngay!
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="hidden sm:flex w-12 h-12 rounded-full bg-white/5 items-center justify-center translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 border border-white/10">
                                            <ChevronRight className="w-5 h-5 text-[#8FA7C5]" />
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    ) : (
                        /* SYSTEM TAB */
                        <div className="space-y-4">
                            {systemNotifs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center min-h-[400px] text-center bg-[#0B0B10]/40 rounded-3xl border border-white/5 border-dashed">
                                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 opacity-20">
                                        <Bell className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight italic">Hệ thống đang ổn định!</h3>
                                    <p className="text-white/30 text-sm font-medium">Hiện không có thông báo bảo trì hay tin tức mới từ ban quản trị.</p>
                                </div>
                            ) : (
                                systemNotifs.map((notif) => (
                                    <div key={notif._id} className="group relative flex flex-col sm:flex-row gap-6 p-6 bg-[#0B0B10]/60 backdrop-blur-xl border border-white/[0.05] rounded-3xl hover:border-[#8FA7C5]/30 transition-all shadow-2xl overflow-hidden">
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                                            notif.type === 'error' ? 'bg-red-500' :
                                            notif.type === 'warning' ? 'bg-yellow-500' :
                                            notif.type === 'success' ? 'bg-green-500' :
                                            'bg-[#8FA7C5]'
                                        }`} />
                                        
                                        <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${
                                            notif.type === 'error' ? 'bg-red-500/10 text-red-500' :
                                            notif.type === 'warning' ? 'bg-yellow-500/10 text-yellow-500' :
                                            notif.type === 'success' ? 'bg-green-500/10 text-green-500' :
                                            'bg-[#8FA7C5]/10 text-[#8FA7C5]'
                                        } border border-white/5 ring-1 ring-white/5 shadow-inner`}>
                                            {notif.type === 'error' ? <AlertTriangle className="w-6 h-6" /> : 
                                             notif.type === 'warning' ? <AlertTriangle className="w-6 h-6" /> : 
                                             notif.type === 'success' ? <CheckCircle className="w-6 h-6" /> : 
                                             <Info className="w-6 h-6" />}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                                <h3 className="text-xl font-black text-white leading-tight group-hover:text-[#8FA7C5] transition-colors uppercase tracking-tight italic">{notif.title}</h3>
                                                <span className="flex items-center gap-2 text-[12px] text-white/30 font-bold shrink-0">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {new Date(notif.createdAt).toLocaleDateString("vi-VN", { hour: '2-digit', minute:'2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <p className="text-white/50 leading-relaxed mb-5 font-medium">{notif.message}</p>
                                            
                                            {notif.link && (
                                                <a 
                                                    href={notif.link} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white text-[12px] font-black rounded-xl transition-all border border-white/10 shadow-lg"
                                                >
                                                    Xem chi tiết <ChevronRight className="w-4 h-4" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
