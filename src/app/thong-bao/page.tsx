"use client";

import { useState, useEffect } from "react";
import { Bell, Loader2, Info, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type Notification = {
    _id: string;
    title: string;
    message: string;
    link?: string;
    type: "info" | "success" | "warning" | "error";
    createdAt: string;
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchNotifs = async () => {
            try {
                const res = await fetch("/api/notifications");
                if (res.ok) {
                    const data = await res.json();
                    setNotifications(data);
                }
            } catch (err) {
                console.error("Failed to fetch notifications");
            } finally {
                setIsLoading(false);
            }
        };
        fetchNotifs();
    }, []);

    return (
        <main className="min-h-screen pt-20 pb-16 relative">
            {/* Background elements */}
            <div className="absolute inset-0 bg-[#07070B] -z-20" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10 opacity-50" />

            <div className="w-full max-w-[1000px] mx-auto px-4 sm:px-6">
                <div className="mb-8 md:mb-12 text-center md:text-left pt-6">
                    <h1 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight flex items-center justify-center md:justify-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <Bell className="w-6 h-6 text-primary" />
                        </div>
                        Thông báo hệ thống
                    </h1>
                    <p className="text-gray-400 text-sm md:text-base">
                        Cập nhật các tin tức, bảo trì hoặc thông báo quan trọng nhất từ ban quản trị KHOIPHIM
                    </p>
                </div>

                <div className="bg-[#0B0B10]/80 backdrop-blur-md border border-white/[0.08] rounded-2xl md:p-8 p-4 shadow-2xl">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center min-h-[300px]">
                            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                            <p className="text-gray-400 font-medium">Đang tải thông báo...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                <Bell className="w-8 h-8 text-white/20" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Bạn đã đọc hết mọi thứ!</h3>
                            <p className="text-gray-400">Hiện tại không có thông báo mới nào từ hệ thống.</p>
                            <Link href="/" className="mt-8 px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-lg transition-all">
                                Quay lại trang chủ
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {notifications.map((notif) => (
                                <div key={notif._id} className="group flex flex-col sm:flex-row gap-5 p-5 bg-[#14151B] border border-white/5 rounded-xl hover:border-white/15 transition-all w-full relative overflow-hidden">
                                    {/* Left Status Line */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                                        notif.type === 'error' ? 'bg-red-500' :
                                        notif.type === 'warning' ? 'bg-yellow-500' :
                                        notif.type === 'success' ? 'bg-green-500' :
                                        'bg-primary'
                                    }`} />
                                    
                                    {/* Icon */}
                                    <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                                        notif.type === 'error' ? 'bg-red-500/10 text-red-500' :
                                        notif.type === 'warning' ? 'bg-yellow-500/10 text-yellow-500' :
                                        notif.type === 'success' ? 'bg-green-500/10 text-green-500' :
                                        'bg-blue-500/10 text-primary'
                                    }`}>
                                        {notif.type === 'error' ? <AlertTriangle className="w-6 h-6" /> : 
                                         notif.type === 'warning' ? <AlertTriangle className="w-6 h-6" /> : 
                                         notif.type === 'success' ? <CheckCircle className="w-6 h-6" /> : 
                                         <Info className="w-6 h-6" />}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                            <h3 className="text-lg font-bold text-white leading-tight group-hover:text-primary transition-colors">{notif.title}</h3>
                                            <span className="flex items-center gap-1.5 text-[13px] text-gray-500 font-medium shrink-0">
                                                <Clock className="w-3.5 h-3.5" />
                                                {new Date(notif.createdAt).toLocaleDateString("vi-VN", { hour: '2-digit', minute:'2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <p className="text-[#a1a1aa] leading-relaxed mb-4">{notif.message}</p>
                                        
                                        {notif.link && (
                                            <a 
                                                href={notif.link} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold rounded-lg transition-colors border border-white/10"
                                            >
                                                Xem chi tiết →
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
