"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { getContinueWatching } from "@/app/actions/watchHistory";
import { cn } from "@/lib/utils";

// Helper to get image URL
const getImageUrl = (url: string) => {
    if (!url) return "/placeholder.jpg";
    if (url.startsWith("http")) return url;
    return `https://phimimg.com/${url}`;
};

export default function ContinueWatchingRow() {
    const [movies, setMovies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const rowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
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
    }, []);

    const scroll = (direction: "left" | "right") => {
        if (rowRef.current) {
            const { scrollLeft, clientWidth } = rowRef.current;
            const scrollTo = direction === "left"
                ? scrollLeft - clientWidth / 2
                : scrollLeft + clientWidth / 2;

            rowRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
        }
    };

    if (loading) return null; // Or skeleton
    if (!movies || movies.length === 0) return null;

    return (
        <div className="space-y-4 group relative py-4 container mx-auto px-4 md:px-12">
            <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                    <span className="w-1 h-6 bg-[#fbbf24] rounded-full shadow-[0_0_10px_#fbbf24]"></span>
                    Xem tiếp của bạn
                    <ChevronRight className="w-5 h-5 text-gray-500" />
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
                        <Link
                            key={item._id}
                            href={`/xem-phim/${item.movieSlug}/${item.episodeSlug}`}
                            className="flex-[0_0_200px] md:flex-[0_0_240px] relative group/card snap-start"
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
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                    <div className="w-10 h-10 rounded-full bg-[#fbbf24] flex items-center justify-center shadow-[0_0_15px_#fbbf24] transform scale-0 group-hover/card:scale-100 transition-transform duration-300 delay-75">
                                        <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                                    <div
                                        className="h-full bg-[#fbbf24] shadow-[0_0_5px_#fbbf24]"
                                        style={{ width: `${item.progress}%` }}
                                    />
                                </div>

                                {/* Episode Badge */}
                                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white">
                                    {item.episodeName}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="mt-2 pl-1">
                                <h3 className="text-white font-bold text-sm line-clamp-1 group-hover/card:text-[#fbbf24] transition-colors">{item.movieName}</h3>
                                {item.movieOriginName && <p className="text-gray-400 text-xs italic line-clamp-1">{item.movieOriginName}</p>}
                                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-500">
                                    <Clock className="w-3 h-3" />
                                    <span>Đã xem {item.progress}%</span>
                                    <span className="w-1 h-1 rounded-full bg-gray-600 mx-1" />
                                    <span>{new Date(item.lastWatched).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </Link>
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
