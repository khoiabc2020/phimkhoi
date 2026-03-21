"use client";

import { useRef, useState, useEffect, useMemo, memo } from "react";
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
    const [viewMode, setViewMode] = useState<"recent" | "nearlyDone">("recent");
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

    const displayMovies = useMemo(() => {
        if (viewMode === "nearlyDone") {
            return [...movies].sort((a, b) => (b.progress || 0) - (a.progress || 0));
        }
        return movies;
    }, [movies, viewMode]);

    if (loading) {
        return (
            <div className="space-y-4 py-4">
                <div className="flex items-center justify-between gap-3">
                    <div className="h-6 w-48 bg-white/10 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
                </div>
                <div className="flex gap-3 overflow-x-hidden pb-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex-[0_0_160px] sm:flex-[0_0_200px] md:flex-[0_0_240px] aspect-video rounded-md bg-white/10 animate-pulse" />
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
                                {/* Card Image */}
                                <div className="relative aspect-video rounded-md overflow-hidden bg-white/5 border border-white/10 group-hover/card:border-[#b4c4da]/45 transition-all duration-300">
                                    <Image
                                        src={getImageUrl(item.movieThumb || item.moviePoster)}
                                        alt={item.movieName}
                                        fill
                                        sizes="(max-width: 768px) 140px, (max-width: 1024px) 160px, 180px"
                                        className="object-cover group-hover/card:scale-105 transition-transform duration-300"
                                    />
                                    
                                    {/* Play button on hover */}
                                    <div className="absolute inset-0 bg-black/20 md:bg-black/30 md:opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10">
                                        <div className="w-10 h-10 rounded-full bg-[#d3deec] flex items-center justify-center scale-90 md:scale-0 group-hover/card:scale-100 transition-transform duration-300 delay-75">
                                            <Play className="w-5 h-5 text-[#0d1119] fill-[#0d1119] ml-0.5" />
                                        </div>
                                    </div>

                                    {/* Nút X xóa */}
                                    <button
                                        onClick={(e) => handleRemove(e, item._id)}
                                        className="absolute top-1.5 right-1.5 md:top-2 md:right-2 w-8 h-8 md:w-6 md:h-6 rounded-full bg-black/70 hover:bg-red-600 backdrop-blur-md flex items-center justify-center text-white/90 hover:text-white transition-colors opacity-100 md:opacity-0 md:group-hover/card:opacity-100 z-30 touch-manipulation"
                                        title="Xóa khỏi lịch sử"
                                    >
                                        <X className="w-4 h-4 md:w-3 md:h-3" />
                                    </button>

                                    {/* Progress Bar */}
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
                                        <div
                                            className="h-full bg-[#8FA7C5] rounded-r-sm"
                                            style={{ width: `${Math.max(2, Math.min(100, item.progress || 0))}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Text bên dưới ảnh */}
                                <div className="mt-2.5 px-0.5">
                                    <h3 className="text-white font-semibold text-[14.5px] line-clamp-1 group-hover/card:text-[#8FA7C5] transition-colors leading-tight" title={item.movieName}>
                                        {item.movieName}
                                    </h3>
                                    <div className="flex items-center justify-between mt-1 mb-1.5">
                                        <span className="text-white/40 text-[11px] truncate mr-2 font-medium">{item.episodeName || "Tiếp tục xem"}</span>
                                        <span className="text-white/50 text-[11px] font-bold shrink-0">{item.progress}%</span>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>

                {/* Right Arrow */}
                <button
                    onClick={() => scroll("right")}
                    className="absolute right-0 top-0 bottom-12 z-40 bg-gradient-to-l from-[#0a0a0a]/90 via-[#0a0a0a]/60 to-transparent w-12 md:w-16 flex items-center justify-end pr-1 md:pr-2 opacity-60 md:opacity-0 md:group-hover/row:opacity-100 transition-all duration-300 pointer-events-auto md:pointer-events-none md:group-hover/row:pointer-events-auto -mr-4 lg:-mr-8"
                >
                    <ChevronRight className="w-8 h-8 md:w-10 md:h-10 text-white hover:text-white transition-transform hover:scale-110 drop-shadow-xl" />
                </button>
            </div>
        </div>
    );
}

export default memo(ContinueWatchingRowInner);