"use client";

import { useRef, useState, useEffect, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, ChevronLeft, ChevronRight, X } from "lucide-react";
import { removeWatchHistory } from "@/app/actions/watchHistory";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const getImageUrl = (url: string) => {
    if (!url) return "/placeholder.jpg";
    if (url.startsWith("http")) return url;
    return `https://phimimg.com/${url}`;
};

function ContinueWatchingRowInner() {
    const { data: session } = useSession();
    const [movies, setMovies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const rowRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (!session) {
            setLoading(false);
            return;
        }

        let cancelled = false;
        let interval: any = null;

        const fetchData = async () => {
            try {
                const res = await fetch("/api/user/continue-watching", { cache: "no-store" });
                if (!res.ok) return;
                const data = await res.json();
                if (!cancelled && data?.success && Array.isArray(data.data)) {
                    setMovies(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch continue watching:", error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchData();
        // Poll để đồng bộ realtime (web nhận update từ app sau vài giây)
        interval = setInterval(fetchData, 10000);

        const onVis = () => {
            if (document.visibilityState === "visible") fetchData();
        };
        document.addEventListener("visibilitychange", onVis);

        return () => {
            cancelled = true;
            if (interval) clearInterval(interval);
            document.removeEventListener("visibilitychange", onVis);
        };
    }, [session]);

    const handleRemove = async (e: React.MouseEvent, historyId: string) => {
        e.preventDefault(); // Prevent link navigation
        e.stopPropagation();

        // Optimistic update
        setMovies(prev => prev.filter(m => m._id !== historyId));

        try {
            await removeWatchHistory(historyId);
            router.refresh();
        } catch (error) {
            console.error("Failed to remove item", error);
            // Revert if failed (optional, but good UX)
        }
    };

    const scroll = (direction: "left" | "right") => {
        if (rowRef.current) {
            const { scrollLeft, clientWidth } = rowRef.current;
            const scrollTo = direction === "left"
                ? scrollLeft - clientWidth / 2
                : scrollLeft + clientWidth / 2;

            rowRef.current.scrollTo({ left: scrollTo, behavior: "auto" });
        }
    };

    if (loading) return null;
    if (!session || !movies || movies.length === 0) return null;

    return (
        <div className="space-y-4 group relative py-4">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg md:text-xl font-[800] text-white flex items-center gap-2">
                    Xem tiếp của bạn
                    <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
                </h2>
                <Link
                    href="/lich-su-xem"
                    className="text-sm font-semibold text-[#fbbf24] hover:text-[#fcd34d] whitespace-nowrap flex items-center gap-1"
                >
                    Lịch sử
                    <ChevronRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            <div className="relative group/row">
                {/* Left Arrow - visible on touch (mobile) for easier scroll */}
                <button
                    onClick={() => scroll("left")}
                    className="absolute left-0 top-0 bottom-0 z-40 bg-gradient-to-r from-[#020617]/80 to-transparent w-10 md:w-12 flex items-center justify-start pl-1 md:pl-2 opacity-60 md:opacity-0 md:group-hover/row:opacity-100 transition-all duration-300 pointer-events-auto md:pointer-events-none md:group-hover/row:pointer-events-auto"
                >
                    <ChevronLeft className="w-7 h-7 md:w-8 md:h-8 text-white hover:text-[#fbbf24] transition-colors drop-shadow-lg" />
                </button>

                {/* Scroll Container */}
                <div
                    ref={rowRef}
                    className="flex gap-3 md:gap-4 overflow-x-auto pb-4 pt-2 no-scrollbar snap-x px-1"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {movies.map((item) => (
                        <div key={item._id} className="relative group/card flex-[0_0_160px] sm:flex-[0_0_200px] md:flex-[0_0_240px] snap-start">
                            <Link
                                href={`/xem-phim/${item.movieSlug}/${item.episodeSlug}`}
                                className="block w-full"
                            >
                                {/* Card Image - ảnh đầy đủ không bị che */}
                                <div className="relative aspect-video rounded-xl overflow-hidden bg-white/5 border border-white/10 group-hover/card:border-[#fbbf24]/50 transition-all duration-300">
                                    <Image
                                        src={getImageUrl(item.moviePoster)}
                                        alt={item.movieName}
                                        fill
                                        className="object-cover group-hover/card:scale-105 transition-transform duration-500"
                                    />

                                    {/* Play button on hover; on mobile always show subtle */}
                                    <div className="absolute inset-0 bg-black/20 md:bg-black/30 md:opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10">
                                        <div className="w-10 h-10 rounded-full bg-[#fbbf24] flex items-center justify-center shadow-[0_0_15px_#fbbf24] scale-90 md:scale-0 group-hover/card:scale-100 transition-transform duration-300 delay-75">
                                            <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                                        </div>
                                    </div>

                                    {/* Nút X xóa — luôn hiện trên mobile để chạm được, desktop hover */}
                                    <button
                                        onClick={(e) => handleRemove(e, item._id)}
                                        className="absolute top-1.5 right-1.5 md:top-2 md:right-2 w-8 h-8 md:w-6 md:h-6 rounded-full bg-black/70 hover:bg-red-600 backdrop-blur-md flex items-center justify-center text-white/90 hover:text-white transition-colors opacity-100 md:opacity-0 md:group-hover/card:opacity-100 z-30 touch-manipulation"
                                        title="Xóa khỏi lịch sử"
                                    >
                                        <X className="w-4 h-4 md:w-3 md:h-3" />
                                    </button>

                                    {/* Progress Bar - chỉ 1 dải mỏng đáy ảnh */}
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
                                        <div
                                            className="h-full bg-[#E50914] rounded-r-sm"
                                            style={{ width: `${Math.max(2, Math.min(100, item.progress || 0))}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Text bên dưới ảnh - không che mặt nhân vật */}
                                <div className="mt-2 px-0.5">
                                    <h3 className="text-white font-semibold text-sm line-clamp-1 group-hover/card:text-[#fbbf24] transition-colors">
                                        {item.movieName}
                                    </h3>
                                    <div className="flex items-center justify-between mt-0.5">
                                        <span className="text-white/50 text-xs truncate mr-1">{item.episodeName || "Tiếp tục xem"}</span>
                                        <span className="text-[#fbbf24]/80 text-[10px] font-medium shrink-0">{item.progress}%</span>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>

                {/* Right Arrow - visible on touch (mobile) */}
                <button
                    onClick={() => scroll("right")}
                    className="absolute right-0 top-0 bottom-0 z-40 bg-gradient-to-l from-[#020617]/80 to-transparent w-10 md:w-12 flex items-center justify-end pr-1 md:pr-2 opacity-60 md:opacity-0 md:group-hover/row:opacity-100 transition-all duration-300 pointer-events-auto md:pointer-events-none md:group-hover/row:pointer-events-auto"
                >
                    <ChevronRight className="w-7 h-7 md:w-8 md:h-8 text-white hover:text-[#fbbf24] transition-colors" />
                </button>
            </div>
        </div>
    );
}

export default memo(ContinueWatchingRowInner);
