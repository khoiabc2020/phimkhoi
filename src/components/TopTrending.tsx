"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Movie } from "@/services/api";
import { getImageUrl, decodeHtml, cn } from "@/lib/utils";
import { memo } from "react";

interface TopTrendingProps {
    title: string;
    movies: Movie[];
    slug: string;
    className?: string;
}

function TopTrendingInner({ title, movies, slug, className }: TopTrendingProps) {
    // Top 10 only
    const topMovies = movies.slice(0, 10);

    return (
        <div className={cn("w-full relative py-2", className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-[20px] md:text-[24px] font-extrabold text-white capitalize flex items-center gap-2.5 tracking-tight">
                    <span className="w-1 h-6 bg-[#8FA7C5] rounded-full"></span>
                    <span className="leading-tight">{title}</span>
                </h2>
                {slug && (
                    <Link href={slug} className="text-sm md:text-base font-semibold text-[#a8bad3] hover:text-white flex items-center gap-1 transition-colors group">
                        Xem tất cả <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                )}
            </div>

            {/* List Container */}
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-3 snap-x [contain:layout_paint]">
                {topMovies.map((movie, index) => (
                    <Link
                        key={movie._id}
                        href={`/phim/${movie.slug}`}
                        className="group flex flex-col gap-2.5 p-2.5 rounded-[10px] transition-colors border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03] w-[156px] sm:w-[176px] md:w-[192px] lg:w-[210px] xl:w-[228px] shrink-0 snap-start bg-[#07070b]/82 shadow-[0_8px_18px_#00000055]"
                    >
                        {/* Poster Container */}
                        <div className="relative w-full aspect-[2/3] rounded-[10px] overflow-hidden flex-shrink-0 shadow-md bg-[#0B0B10]">
                            <Image
                                src={getImageUrl(movie.poster_url || movie.thumb_url)}
                                alt={movie.name}
                                fill
                                loading="lazy"
                                className="object-cover bg-[#0a0f1a] transition-transform duration-300 group-hover:scale-105"
                                sizes="(max-width: 768px) 48vw, (max-width: 1280px) 220px, 240px"
                            />
                            {/* Rank Number (Inside Image) */}
                            <div className="absolute top-0 left-0 w-8 h-8 md:w-9 md:h-9 flex items-center justify-center bg-black/75 backdrop-blur-md rounded-br-lg z-20">
                                <span className={cn(
                                    "font-black text-lg md:text-xl italic",
                                    index === 0 ? "text-[#c6d6ea]" :
                                        index === 1 ? "text-gray-200" :
                                            index === 2 ? "text-[#8FA7C5]" : "text-white"
                                )} style={{ fontFamily: 'var(--font-outfit)' }}>
                                    {index + 1}
                                </span>
                            </div>
                        </div>

                        {/* Metadata Container */}
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                            <h3 className="text-white text-[13px] sm:text-sm font-bold line-clamp-2 group-hover:text-[#c6d6ea] transition-colors leading-snug">
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
                ))}
            </div>
        </div>
    );
}

export default memo(TopTrendingInner);
