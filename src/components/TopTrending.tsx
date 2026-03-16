"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Movie } from "@/services/api";
import { getImageUrl, decodeHtml, cn } from "@/lib/utils";
import { memo, useState } from "react";

interface TopTrendingProps {
    title: string;
    movies: Movie[];
    slug: string;
    className?: string;
}

const getYouTubeId = (url?: string) => {
    if (!url) return "";
    const vMatch = url.match(/[?&]v=([^&#]+)/);
    if (vMatch?.[1]) return vMatch[1];
    const shortMatch = url.match(/youtu\.be\/([^?&#/]+)/);
    if (shortMatch?.[1]) return shortMatch[1];
    const embedMatch = url.match(/youtube\.com\/embed\/([^?&#/]+)/);
    if (embedMatch?.[1]) return embedMatch[1];
    return "";
};

function TopTrendingInner({ title, movies, slug, className }: TopTrendingProps) {
    // Top 10 only
    const topMovies = movies.slice(0, 10);
    const [hoveredMovieId, setHoveredMovieId] = useState<string | null>(null);

    return (
        <div className={cn("w-full relative py-2", className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-[17px] font-extrabold text-white capitalize flex items-center gap-2.5 tracking-tight">
                    <span className="w-1 h-5 bg-[#8fa7c5] rounded-full"></span>
                    <span className="leading-tight">{title}</span>
                </h2>
                {slug && (
                    <Link href={slug} className="text-xs font-semibold text-[#a8bad3] hover:text-white flex items-center gap-1 transition-colors group">
                        Xem tất cả <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                )}
            </div>

            {/* List Container */}
            <div className="flex lg:flex-col gap-3 lg:gap-3 overflow-x-auto lg:overflow-visible no-scrollbar pb-3 lg:pb-0 snap-x lg:snap-none [contain:layout_paint]">
                {topMovies.map((movie, index) => {
                    const trailerId = getYouTubeId(movie.trailer_url);
                    return (
                    <Link
                        key={movie._id}
                        href={`/phim/${movie.slug}`}
                        className="group flex flex-col lg:flex-row gap-2.5 p-2.5 rounded-[10px] transition-colors border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03] w-[138px] md:w-[156px] lg:w-full shrink-0 snap-start bg-[#07070b]/82 shadow-[0_8px_18px_#00000055]"
                        onMouseEnter={() => setHoveredMovieId(movie._id)}
                        onMouseLeave={() => setHoveredMovieId(null)}
                    >
                        {/* Poster Container */}
                        <div className="relative w-full lg:w-[92px] xl:w-[104px] aspect-[2/3] rounded-[10px] overflow-hidden flex-shrink-0 shadow-md bg-[#0B0B10]">
                            <Image
                                src={getImageUrl(movie.poster_url || movie.thumb_url)}
                                alt={movie.name}
                                fill
                                loading="lazy"
                                className="object-contain bg-[#0a0f1a] transition-transform duration-300 group-hover:scale-105"
                                sizes="(max-width: 1024px) 160px, 120px"
                            />
                            {hoveredMovieId === movie._id && trailerId && (
                                <div className="hidden lg:block absolute inset-0 z-10">
                                    <iframe
                                        src={`https://www.youtube.com/embed/${trailerId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerId}&modestbranding=1&playsinline=1&rel=0`}
                                        title={`Trailer ${movie.name}`}
                                        className="w-full h-full pointer-events-none"
                                        allow="autoplay; encrypted-media"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
                                </div>
                            )}

                            {/* Rank Number (Inside Image) */}
                            <div className="absolute top-0 left-0 w-8 h-8 md:w-9 md:h-9 flex items-center justify-center bg-black/75 backdrop-blur-md rounded-br-lg z-20">
                                <span className={cn(
                                    "font-black text-lg md:text-xl italic",
                                    index === 0 ? "text-[#c6d6ea]" :
                                        index === 1 ? "text-gray-200" :
                                            index === 2 ? "text-orange-400" : "text-white"
                                )} style={{ fontFamily: 'var(--font-outfit)' }}>
                                    {index + 1}
                                </span>
                            </div>
                        </div>

                        {/* Metadata Container */}
                        <div className="flex-1 min-w-0 flex flex-col lg:justify-center gap-1">
                            <h3 className="text-white text-[13px] sm:text-sm font-bold line-clamp-2 md:line-clamp-1 group-hover:text-[#c6d6ea] transition-colors leading-snug">
                                {decodeHtml(movie.name)}
                            </h3>
                            <p className="text-white/50 text-xs truncate">
                                {decodeHtml(movie.origin_name)}
                            </p>
                            <div className="flex items-center lg:flex-wrap gap-2 mt-auto lg:mt-1 pt-1 lg:pt-0">
                                <span className="text-[10px] items-center px-1.5 py-0.5 rounded-sm bg-white/10 text-white/70 border border-white/5 whitespace-nowrap">
                                    {movie.year}
                                </span>
                                <span className="text-[10px] items-center px-1.5 py-0.5 rounded-sm bg-[#253143] text-[#c7d7ea] border border-[#33455f] font-bold whitespace-nowrap">
                                    {movie.quality}
                                </span>
                            </div>
                        </div>
                    </Link>
                )})}
            </div>
        </div>
    );
}

export default memo(TopTrendingInner);
