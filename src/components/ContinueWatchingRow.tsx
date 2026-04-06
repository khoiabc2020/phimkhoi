"use client";

import { useRef, useState, useEffect, useMemo, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, ChevronLeft, ChevronRight, X } from "lucide-react";
import { removeWatchHistory } from "@/app/actions/watchHistory";
import { useSession } from "next-auth/react";

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

    const CACHE_KEY = "phimkhoi_continue_watching";

    useEffect(() => {
        if (!session) {
            setLoading(false);
            return;
        }

        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed)) {
                    setMovies(parsed);
                    setLoading(false);
                }
            } catch {
                console.error("Failed to parse history cache");
            }
        }

        let cancelled = false;
        let interval: ReturnType<typeof setInterval> | null = null;

        const fetchData = async () => {
            try {
                const res = await fetch("/api/user/continue-watching", { cache: "no-store" });
                if (!res.ok) return;
                const data = await res.json();
                if (!cancelled && data?.success && Array.isArray(data.data)) {
                    setMovies(data.data);
                    localStorage.setItem(CACHE_KEY, JSON.stringify(data.data));
                }
            } catch (error) {
                console.error("Failed to fetch continue watching:", error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchData();
        interval = setInterval(fetchData, 30000);

        const channel = new BroadcastChannel("phimkhoi_history_sync");
        channel.onmessage = (event) => {
            if (event.data?.type === "HISTORY_UPDATE") {
                const { movieId, progress, episodeSlug, episodeName, movieName, moviePoster } = event.data;
                setMovies((prev) => {
                    const existing = prev.find((m) => m.movieId === movieId);
                    let newMovies = prev;

                    if (existing) {
                        const isNewer =
                            !existing.lastWatched ||
                            (event.data.lastWatched &&
                                new Date(event.data.lastWatched) > new Date(existing.lastWatched));
                        if (!isNewer) return prev;

                        newMovies = prev
                            .map((m) =>
                                m.movieId === movieId
                                    ? {
                                        ...m,
                                        progress,
                                        episodeSlug: episodeSlug || m.episodeSlug,
                                        episodeName: episodeName || m.episodeName,
                                        lastWatched: event.data.lastWatched || new Date().toISOString(),
                                    }
                                    : m
                            )
                            .sort(
                                (a, b) =>
                                    new Date(b.lastWatched).getTime() - new Date(a.lastWatched).getTime()
                            );
                    } else if (movieName) {
                        newMovies = [
                            {
                                _id: `temp_${Date.now()}`,
                                movieId,
                                movieSlug: event.data.movieSlug,
                                movieName,
                                moviePoster,
                                episodeSlug,
                                episodeName,
                                progress,
                                lastWatched: event.data.lastWatched || new Date().toISOString(),
                            },
                            ...prev,
                        ].slice(0, 10);
                    }

                    if (newMovies !== prev) {
                        localStorage.setItem(CACHE_KEY, JSON.stringify(newMovies));
                    }
                    return newMovies;
                });
            }
        };

        const onVis = () => {
            if (document.visibilityState === "visible") fetchData();
        };
        document.addEventListener("visibilitychange", onVis);

        return () => {
            cancelled = true;
            if (interval) clearInterval(interval);
            channel.close();
            document.removeEventListener("visibilitychange", onVis);
        };
    }, [session]);

    const handleRemove = async (e: React.MouseEvent, historyId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setMovies((prev) => prev.filter((m) => m._id !== historyId));

        try {
            await removeWatchHistory(historyId);
        } catch (error) {
            console.error("Failed to remove item", error);
        }
    };

    const scroll = (direction: "left" | "right") => {
        if (!rowRef.current) return;
        const { scrollLeft, clientWidth } = rowRef.current;
        const scrollTo =
            direction === "left"
                ? scrollLeft - clientWidth / 2
                : scrollLeft + clientWidth / 2;

        rowRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    };

    const displayMovies = useMemo(() => movies, [movies]);

    if (loading) {
        return (
            <div className="space-y-4 py-4">
                <div className="flex items-center justify-between gap-3">
                    <div className="h-6 w-48 bg-white/10 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
                </div>
                <div className="flex gap-3 overflow-x-hidden pb-4">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="flex-[0_0_220px] sm:flex-[0_0_260px] md:flex-[0_0_300px] aspect-video rounded-xl bg-white/5 animate-pulse border border-white/5"
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (!session || !movies || movies.length === 0) return null;

    return (
        <div className="space-y-4 group relative py-4">
            <div className="space-y-2">
                <Link href="/lich-su-xem" className="flex items-center gap-2 min-w-0 group/title w-max">
                    <h2 className="text-[17px] md:text-[20px] font-bold text-white leading-tight flex items-center min-w-0 transition-colors hover:text-[#e0e0e0]">
                        Xem tiếp của bạn
                    </h2>
                    <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center transition-all opacity-80 group-hover/title:bg-white/10 group-hover/title:border-white/40">
                        <ChevronRight className="w-3 h-3 text-white" />
                    </div>
                </Link>
            </div>

            <div className="relative group/row">
                <button
                    onClick={() => scroll("left")}
                    className="absolute left-0 top-0 bottom-12 z-40 bg-gradient-to-r from-[#0a0a0a]/90 via-[#0a0a0a]/60 to-transparent w-12 md:w-16 flex items-center justify-start pl-1 md:pl-2 opacity-60 md:opacity-0 md:group-hover/row:opacity-100 transition-all duration-300 pointer-events-auto md:pointer-events-none md:group-hover/row:pointer-events-auto -ml-4 lg:-ml-8"
                >
                    <ChevronLeft className="w-8 h-8 md:w-10 md:h-10 text-white hover:text-white transition-transform hover:scale-110 drop-shadow-xl" />
                </button>

                <div
                    ref={rowRef}
                    className="flex gap-4 md:gap-5 overflow-x-auto pb-4 pt-4 no-scrollbar snap-x px-1"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none", scrollBehavior: "smooth", contain: "layout paint" }}
                >
                    {displayMovies.map((item) => (
                        <div
                            key={item._id}
                            className="relative group/card flex-[0_0_220px] sm:flex-[0_0_260px] md:flex-[0_0_300px] snap-start"
                        >
                            <Link href={`/xem-phim/${item.movieSlug}/${item.episodeSlug}`} className="block w-full outline-none">
                                <div className="relative aspect-video rounded-md overflow-hidden bg-white/5 border border-white/10 group-hover/card:border-[#b4c4da]/45 transition-all duration-300">
                                    <Image
                                        src={getImageUrl(item.movieThumb || item.moviePoster)}
                                        alt={item.movieName}
                                        fill
                                        loading="lazy"
                                        quality={70}
                                        sizes="(max-width: 768px) 140px, (max-width: 1024px) 160px, 180px"
                                        className="object-cover group-hover/card:scale-105 transition-transform duration-500 will-change-transform"
                                    />

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-100 transition-opacity duration-300 pointer-events-none" />

                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all duration-500 pointer-events-none">
                                        <div className="w-12 h-12 rounded-full bg-[#d3deec] shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center scale-75 group-hover/card:scale-100 transition-transform duration-500">
                                            <Play className="w-6 h-6 text-[#0d1119] fill-[#0d1119] ml-1" />
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => handleRemove(e, item._id)}
                                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/80 hover:bg-red-600 flex items-center justify-center text-white/90 hover:text-white transition-all opacity-0 group-hover/card:opacity-100 z-30 touch-manipulation hover:scale-110"
                                        title="Xóa khỏi lịch sử"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>

                                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20 z-20">
                                        <div
                                            className="h-full bg-[#8FA7C5] rounded-r-full shadow-[0_0_8px_#8FA7C5] transition-all duration-1000 ease-linear"
                                            style={{ width: `${Math.max(0, Math.min(100, item.progress || 0))}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="mt-3 px-1">
                                    <h3
                                        className="text-white font-bold text-[15.5px] sm:text-[17px] line-clamp-1 group-hover/card:text-[#8FA7C5] transition-colors leading-tight drop-shadow-md"
                                        title={item.movieName}
                                    >
                                        {item.movieName}
                                    </h3>
                                    <div className="flex items-center justify-between mt-1.5 opacity-60 group-hover/card:opacity-100 transition-opacity">
                                        <span className="text-gray-300 text-[12px] font-medium truncate">
                                            {item.episodeName || "Tiếp tục xem"}
                                        </span>
                                        {Number(item.progress) > 0 && (
                                            <span className="text-[#8FA7C5] text-[12px] font-black uppercase tracking-wider">
                                                {item.progress}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>

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
