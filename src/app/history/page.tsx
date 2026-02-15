"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Clock, Trash2, Play } from "lucide-react";
import Link from "next/link";
import { getImageUrl } from "@/lib/utils";

export default function HistoryPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            fetchHistory();
        }
    }, [status, router]);

    const fetchHistory = async () => {
        try {
            const res = await fetch("/api/user/history");
            const data = await res.json();
            if (data.history) setHistory(data.history);
        } catch (error) {
            console.error("Failed to fetch history", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center pt-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <main className="min-h-screen bg-[#0a0a0a] pt-24 pb-20 px-4 md:px-12">
            <div className="container mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Clock className="w-8 h-8 text-primary" /> Lịch Sử Xem
                    </h1>
                    <div className="text-gray-400">
                        {history.length} phim đã xem
                    </div>
                </div>

                {history.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {history.map((item, index) => (
                            <Link href={`/phim/${item.slug}`} key={index} className="group relative aspect-[2/3] rounded-xl overflow-hidden border border-white/10 bg-[#1a1a1a]">
                                <img
                                    src={`https://phimimg.com/${item.slug}/thumb.jpg`}
                                    onError={(e) => (e.currentTarget.src = "https://phimimg.com/upload/vod/20240801-1/5b35c0293375815615d1858564245598.jpg")}
                                    alt={item.slug}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-primary/90 rounded-full flex items-center justify-center scale-0 group-hover:scale-100 transition-transform duration-300 shadow-lg shadow-primary/50">
                                        <Play className="w-5 h-5 fill-black text-black ml-1" />
                                    </div>

                                    <h3 className="text-white font-bold text-sm line-clamp-2 uppercase drop-shadow-md">
                                        {item.slug.replace(/-/g, " ")}
                                    </h3>
                                    <div className="flex items-center justify-between mt-2 text-xs text-gray-300">
                                        <span className="bg-white/10 px-2 py-1 rounded backdrop-blur-md">
                                            Tập {item.episode}
                                        </span>
                                        <span>{new Date(item.timestamp).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                </div>

                                {/* Progress Bar (Mock) */}
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10">
                                    <div className="h-full bg-primary" style={{ width: '100%' }} />
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border border-white/10 rounded-2xl bg-[#1a1a1a]/50">
                        <Clock className="w-16 h-16 text-gray-600" />
                        <h2 className="text-xl font-bold text-white">Chưa có lịch sử xem</h2>
                        <p className="text-gray-400 max-w-md">
                            Các phim bạn xem sẽ xuất hiện tại đây để bạn dễ dàng theo dõi và xem tiếp.
                        </p>
                        <Link href="/" className="px-6 py-3 bg-primary text-black font-bold rounded-full hover:bg-yellow-400 transition-colors mt-4">
                            Khám phá phim ngay
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
}
