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
        <div className={cn("w-full relative py-4", className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white capitalize flex items-center gap-3">
                    <span className="w-1 h-5 bg-[#fbbf24] rounded-full"></span>
                    <span className="leading-tight">{title}</span>
                </h2>
                {slug && (
                    <Link href={slug} className="text-xs font-medium text-[#fbbf24] hover:text-white flex items-center gap-1 transition-colors group">
                        Xem tất cả <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                )}
            </div>

            {/* List Container */}
            <div className="flex lg:grid lg:grid-cols-2 gap-4 overflow-x-auto lg:overflow-visible no-scrollbar pb-4 lg:pb-0 snap-x lg:snap-none [contain:layout_paint]">
                {topMovies.map((movie, index) => (
                    <Link
                        key={movie._id}
                        href={`/phim/${movie.slug}`}
                        className="group/card relative block w-[150px] sm:w-[170px] lg:w-full shrink-0 snap-start overflow-hidden rounded-md bg-[#1a1a1a] shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-300 ring-1 ring-white/[0.05] hover:ring-white/[0.15] hover:-translate-y-1"
                    >
                        {/* Poster */}
                        <div className="relative w-full aspect-[2/3] bg-gray-900">
                            <Image
                                src={getImageUrl(movie.poster_url || movie.thumb_url)}
                                alt={movie.name}
                                fill
                                loading="lazy"
                                className="object-cover transition-transform duration-500 group-hover/card:scale-105 will-change-transform"
                                sizes="(max-width: 1024px) 170px, 300px"
                            />

                            {/* Rank Overlay inside Image */}
                            <div className="absolute top-0 left-0 w-10 h-10 flex items-center justify-center bg-black/60 backdrop-blur-md rounded-br-lg z-20">
                                <span className={cn(
                                    "font-black text-2xl italic",
                                    index === 0 ? "text-[#fbbf24]" :
                                        index === 1 ? "text-gray-200" :
                                            index === 2 ? "text-orange-400" : "text-white"
                                )} style={{ fontFamily: 'var(--font-outfit)' }}>
                                    {index + 1}
                                </span>
                            </div>

                            {/* Gradient Overlay for Text Visibility */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b0f] via-[#0a0b0f]/60 to-transparent opacity-90 group-hover/card:opacity-100 transition-opacity duration-300 z-10" />

                            {/* Metadata overlaid on poster */}
                            <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col justify-end z-20">
                                <h3 className="text-white text-[13px] font-bold line-clamp-2 leading-snug group-hover/card:text-[#F4C84A] transition-colors mb-1.5 drop-shadow-md">
                                    {decodeHtml(movie.name)}
                                </h3>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-white/20 text-white backdrop-blur-sm border border-white/10 shadow-sm leading-none">
                                        {movie.year}
                                    </span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-[#fbbf24]/20 text-[#fbbf24] backdrop-blur-sm border border-[#fbbf24]/30 font-bold leading-none">
                                        {movie.quality}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default memo(TopTrendingInner);
