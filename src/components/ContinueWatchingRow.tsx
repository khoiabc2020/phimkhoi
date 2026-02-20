"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, ChevronLeft, ChevronRight, X } from "lucide-react";
import { getContinueWatching, removeWatchHistory } from "@/app/actions/watchHistory";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// Helper to get image URL
const getImageUrl = (url: string) => {
    if (!url) return "/placeholder.jpg";
    if (url.startsWith("http")) return url;
    // OPhim images usually start with http in the API data, but if they are relative, they might need a specific domain.
    // However, KKPhim data usually has relative paths.
    return `https://phimimg.com/${url}`;
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

        const fetchData = async () => {
            try {
                const res = await getContinueWatching();
                if (res.success && res.data) {
                    setMovies(res.data);
                }
            } catch (error) {
                console.error("Failed to fetch continue watching:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
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

            rowRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
        }
    };

    if (loading) return null;
    if (!session || !movies || movies.length === 0) return null;

    return (
        <div className="space-y-4 group relative py-4 container mx-auto px-4 md:px-12">
            <div className="flex items-center justify-between">
                <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                    Xem tiếp của bạn
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                </h2>
            </div>

            <div className="relative group/row">
                {/* Left Arrow */}
                <button
                    onClick={() => scroll("left")}
                    className="absolute left-0 top-0 bottom-0 z-40 bg-gradient-to-r from-black/80 to-transparent w-12 flex items-center justify-start pl-2 opacity-0 group-hover/row:opacity-100 transition-all duration-300 pointer-events-none group-hover/row:pointer-events-auto"
                >
                    <ChevronLeft className="w-8 h-8 text-white hover:text-[#fbbf24] transition-colors drop-shadow-lg" />
                </button>

                {/* Scroll Container */}
                <div
                    ref={rowRef}
                    className="flex gap-4 overflow-x-auto pb-4 pt-2 no-scrollbar snap-x scroll-smooth"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {movies.map((item) => (
                        <div key={item._id} className="relative group/card flex-[0_0_200px] md:flex-[0_0_240px] snap-start">
                            <Link
                                href={`/xem-phim/${item.movieSlug}/${item.episodeSlug}`}
                                className="block w-full h-full"
                            >
                                {/* Card Image */}
                                <div className="relative aspect-video rounded-lg overflow-hidden bg-white/5 border border-white/10 shadow-lg group-hover/card:border-[#fbbf24]/50 transition-all duration-300">
                                    <Image
                                        src={getImageUrl(item.moviePoster)}
                                        alt={item.movieName}
                                        fill
                                        className="object-cover group-hover/card:scale-105 transition-transform duration-500"
                                    />

                                    {/* Overlay & Play Button */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10">
                                        <div className="w-10 h-10 rounded-full bg-[#fbbf24] flex items-center justify-center shadow-[0_0_15px_#fbbf24] transform scale-0 group-hover/card:scale-100 transition-transform duration-300 delay-75">
                                            <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                                        </div>
                                    </div>

                                    {/* Liquid Glass Info Container (iOS 26 Style) */}
                                    <div className="absolute bottom-0 left-0 right-0 pt-8 pb-[6px] px-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent backdrop-blur-sm border-t border-white/10 flex flex-col justify-end z-20 overflow-hidden">
                                        <h3 className="text-white font-extrabold text-sm tracking-wide line-clamp-1 drop-shadow-md">{item.movieName}</h3>
                                        <span className="text-white/80 font-bold text-[11px] mt-[2px] drop-shadow-sm">{item.episodeName || "Tiếp tục xem"}</span>
                                    </div>

                                    {/* Remove Button (X) */}
                                    <button
                                        onClick={(e) => handleRemove(e, item._id)}
                                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 hover:bg-red-600 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white transition-colors opacity-0 group-hover/card:opacity-100 z-30"
                                        title="Xóa khỏi lịch sử"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>

                                    {/* Progress Bar Container - Netflix Style Overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 z-30">
                                        <div
                                            className="h-full bg-[#E50914] rounded-r-md"
                                            style={{ width: `${Math.max(2, Math.min(100, item.progress || 0))}%` }}
                                        />
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>

                {/* Right Arrow */}
                <button
                    onClick={() => scroll("right")}
                    className="absolute right-0 top-0 bottom-0 z-40 bg-gradient-to-l from-black/80 to-transparent w-12 flex items-center justify-end pr-2 opacity-0 group-hover/row:opacity-100 transition-all duration-300 pointer-events-none group-hover/row:pointer-events-auto"
                >
                    <ChevronRight className="w-8 h-8 text-white hover:text-[#fbbf24] transition-colors drop-shadow-lg" />
                </button>
            </div>
        </div>
    );
}
