"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Movie } from "@/services/api";
import { getImageUrl, decodeHtml, cn } from "@/lib/utils";
import useEmblaCarousel from "embla-carousel-react";

interface TopTrendingProps {
    title: string;
    movies: Movie[];
    slug?: string;
}

export default function TopTrending({ title, movies, slug }: TopTrendingProps) {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: false,
        align: "start",
        containScroll: "trimSnaps",
        dragFree: true
    });

    // Use all movies passed in (caller controls limit)
    const topMovies = movies;

    return (
        <div className="w-full relative py-8">
            <div className="container mx-auto px-4 md:px-12 mb-5 flex flex-row items-end justify-between gap-4">
                <h2 className="text-xl md:text-2xl font-bold text-white capitalize flex items-center gap-2 flex-1">
                    <span className="w-1 h-6 bg-[#fbbf24] rounded-full shadow-[0_0_15px_#fbbf24] flex-shrink-0"></span>
                    <span className="line-clamp-2 leading-tight">{title}</span>
                </h2>
                {slug && (
                    <Link href={slug} className="text-sm text-gray-400 hover:text-[#fbbf24] flex items-center gap-1 transition-colors group whitespace-nowrap mb-1">
                        Xem tất cả <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                )}
            </div>

            <div className="relative pl-4 md:pl-12 overflow-hidden">
                <div className="overflow-visible" ref={emblaRef}>
                    <div className="flex touch-pan-y gap-4 md:gap-8">
                        {topMovies.map((movie, index) => (
                            <Link
                                key={movie._id}
                                href={`/phim/${movie.slug}`}
                                className="relative flex-[0_0_40%] sm:flex-[0_0_28%] md:flex-[0_0_20%] lg:flex-[0_0_16%] xl:flex-[0_0_14%] min-w-0 group flex flex-col gap-3"
                            >
                                {/* Poster Container */}
                                <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-lg group-hover:shadow-[0_0_25px_rgba(251,191,36,0.3)] transition-all duration-300 border border-white/5 group-hover:border-[#fbbf24]/50">
                                    <Image
                                        src={getImageUrl(movie.poster_url || movie.thumb_url)}
                                        alt={movie.name}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        sizes="(max-width: 768px) 33vw, 15vw"
                                    />

                                    {/* Badges (Overlaid) */}
                                    <div className="absolute top-2 right-2 flex flex-col gap-1 items-end z-10">
                                        <span className="px-2 py-0.5 rounded bg-[#fbbf24] text-black text-[10px] font-bold shadow-md">
                                            {movie.quality}
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-white/20 text-white text-[10px] font-bold">
                                            {movie.episode_current}
                                        </span>
                                    </div>
                                </div>

                                {/* Info Section (Below Poster) */}
                                <div className="flex items-start gap-3 px-1 mt-2">
                                    {/* Rank Number */}
                                    <div className={cn(
                                        "font-black leading-none drop-shadow-md italic select-none text-4xl md:text-5xl flex-shrink-0",
                                        "text-transparent bg-clip-text bg-gradient-to-t",
                                        index === 0 ? "from-[#fbbf24] to-white" :
                                            index === 1 ? "from-gray-300 to-white" :
                                                index === 2 ? "from-orange-700 to-orange-300" : "from-gray-800 to-gray-600"
                                    )}
                                        style={{
                                            WebkitTextStroke: "1px rgba(255,255,255,0.1)",
                                        }}>
                                        {index + 1}
                                    </div>

                                    {/* Text Info */}
                                    <div className="flex flex-col pt-0.5 min-w-0 flex-1 justify-center">
                                        <h3 className="text-white text-[11px] font-bold line-clamp-2 group-hover:text-[#fbbf24] transition-colors leading-tight">
                                            {decodeHtml(movie.name)}
                                        </h3>
                                        <p className="text-white/50 text-[10px] truncate mt-0.5">
                                            {decodeHtml(movie.origin_name)}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}
