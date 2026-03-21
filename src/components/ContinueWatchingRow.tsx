"use client";

import { useRef, useState, useEffect, useMemo, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { removeWatchHistory } from "@/app/actions/watchHistory";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const getImageUrl = (url: string) => {
    if (!url) return "/placeholder.jpg";
    if (url.startsWith("http")) return url;
    return `https://phimimg.com/${url}`;
};

const formatTimeAndDuration = (currentSec: number, totalSec: number, episode: string) => {
    const toStr = (sec: number) => {
        if (!sec || isNaN(sec)) return "0m";
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    const epStr = episode ? `${episode} • ` : "";
    if (currentSec > 0 && totalSec > 0) {
        return `${epStr}${toStr(currentSec)} / ${toStr(totalSec)}`;
    }
    return episode || "Tiếp tục xem";
};

export default function ContinueWatchingRow() {
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

            rowRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="h-6 w-48 bg-white/10 rounded animate-pulse" />
                </div>
                <div className="flex gap-4 overflow-x-hidden pb-4 pt-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="flex-[0_0_140px] md:flex-[0_0_160px] lg:flex-[0_0_180px] space-y-3 pt-2">
                            <div className="aspect-[2/3] rounded-lg bg-white/10 animate-pulse" />
                            <div className="h-1.5 w-4/5 mx-auto bg-white/10 rounded animate-pulse" />
                            <div className="space-y-2 flex flex-col items-center">
                                <div className="h-2 w-3/4 bg-white/10 rounded animate-pulse" />
                                <div className="h-3 w-5/6 bg-white/10 rounded animate-pulse" />
                                <div className="h-2 w-1/2 bg-white/10 rounded animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!session || !movies || movies.length === 0) return null;

    return (
        <div className="space-y-4 group relative py-4">
            <div className="space-y-2">
                <Link
                    href="/lich-su-xem"
                    className="flex items-center gap-2 min-w-0 group/title w-max"
                >
                    <h2 className="text-[17px] md:text-[20px] font-bold text-white leading-tight flex items-center min-w-0 transition-colors hover:text-[#e0e0e0]">
                        Xem tiếp của bạn
                    </h2>
                    <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center transition-all opacity-80 group-hover/title:bg-white/10 group-hover/title:border-white/40">
                        <ChevronRight className="w-3 h-3 text-white" />
                    </div>
                </Link>
            </div>

            <div className="relative group/row">
                {/* Left Arrow */}
                <button
                    onClick={() => scroll("left")}
                    className="absolute left-0 top-0 bottom-12 z-40 bg-gradient-to-r from-[#0a0a0a]/90 via-[#0a0a0a]/60 to-transparent w-12 md:w-16 flex items-center justify-start pl-1 md:pl-2 opacity-60 md:opacity-0 md:group-hover/row:opacity-100 transition-all duration-300 pointer-events-auto md:pointer-events-none md:group-hover/row:pointer-events-auto -ml-4 lg:-ml-8"
                >
                    <ChevronLeft className="w-8 h-8 md:w-10 md:h-10 text-white hover:text-white transition-transform hover:scale-110 drop-shadow-xl" />
                </button>

                {/* Scroll Container */}
                <div
                    ref={rowRef}
                    className="flex gap-4 md:gap-5 overflow-x-auto pb-4 pt-4 no-scrollbar snap-x px-1"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none", scrollBehavior: "smooth", contain: "layout paint" }}
                >
                    {movies.map((item) => (
                        <div key={item._id} className="relative group/card flex-[0_0_140px] md:flex-[0_0_160px] lg:flex-[0_0_180px] snap-start">
                            <Link
                                href={`/xem-phim/${item.movieSlug}/${item.episodeSlug}`}
                                className="block w-full outline-none"
                            >
                                {/* Card Image (Portrait 2:3) */}
                                <div className="relative aspect-[2/3] rounded-[10px] overflow-hidden bg-white/5 border border-white/5 shadow-2xl transition-all duration-300 md:group-hover/card:-translate-y-1 md:group-hover/card:shadow-[0_8px_30px_rgba(0,0,0,0.6)]">
                                    {/* Background Blurred Image */}
                                    <Image
                                        src={getImageUrl(item.moviePoster)}
                                        alt={""}
                                        fill
                                        sizes="(max-width: 768px) 140px, (max-width: 1024px) 160px, 180px"
                                        className="object-cover scale-110 blur-xl opacity-50 select-none pointer-events-none"
                                        quality={30}
                                    />
                                    {/* Foreground clear image (uncropped) */}
                                    <Image
                                        src={getImageUrl(item.moviePoster)}
                                        alt={item.movieName}
                                        fill
                                        sizes="(max-width: 768px) 140px, (max-width: 1024px) 160px, 180px"
                                        className="object-contain drop-shadow-2xl z-10"
                                        quality={85}
                                    />
                                    
                                    {/* Vignette effect for text contrast later if needed, mostly transparent */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 md:group-hover/card:opacity-100 z-20" />
                                </div>

                                {/* White Square 'X' Delete Button */}
                                <button
                                    onClick={(e) => handleRemove(e, item._id)}
                                    className="absolute top-1 right-1 md:top-2 md:right-2 w-6 h-6 rounded bg-white/95 hover:bg-white backdrop-blur-md flex items-center justify-center text-[#111] hover:text-red-500 shadow-md transition-all opacity-100 md:opacity-0 md:group-hover/card:opacity-100 z-30 touch-manipulation hover:scale-110"
                                    title="Xóa khỏi lịch sử"
                                >
                                    <X className="w-[14px] h-[14px] stroke-[2.5]" />
                                </button>

                                {/* External Progress Bar */}
                                <div className="mt-3.5 flex justify-center w-full px-2">
                                    <div className="w-full h-[3px] bg-white/15 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#f1f1f1] rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-500"
                                            style={{ width: `${Math.max(2, Math.min(100, item.progress || 0))}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Text Block - Center Aligned */}
                                <div className="mt-2.5 px-0.5 text-center flex flex-col items-center">
                                    {/* Time Info */}
                                    <span className="text-[#a0a0a0] text-[10.5px] font-medium tracking-wide">
                                        {formatTimeAndDuration(item.currentTime, item.duration, item.episodeName)}
                                    </span>
                                    
                                    {/* Main Title */}
                                    <h3 className="text-white font-bold text-[13px] md:text-[14px] line-clamp-1 mt-1 px-1 tracking-tight">
                                        {item.movieName}
                                    </h3>
                                    
                                    {/* Subtitle / English Title */}
                                    <span className="text-[#707070] text-[11px] font-medium line-clamp-1 mt-0.5">
                                        {item.movieOriginName || ""}
                                    </span>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>

                {/* Right Arrow */}
                <button
                    onClick={() => scroll("right")}
                    className="absolute right-0 top-0 bottom-12 z-40 bg-gradient-to-l from-[#0a0a0a]/90 via-[#0a0a0a]/60 to-transparent w-12 md:w-16 flex items-center justify-end pr-1 md:pr-2 opacity-60 md:opacity-0 md:group-hover/row:opacity-100 transition-all duration-300 pointer-events-auto md:pointer-events-none md:group-hover/row:pointer-events-auto -mr-4 lg:-mr-12"
                >
                    <ChevronRight className="w-8 h-8 md:w-10 md:h-10 text-white hover:text-white transition-transform hover:scale-110 drop-shadow-xl" />
                </button>
            </div>
        </div>
    );
}
