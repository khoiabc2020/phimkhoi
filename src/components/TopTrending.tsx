"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Movie } from "@/services/api";
import { getImageUrl, decodeHtml, cn } from "@/lib/utils";

interface TopTrendingProps {
    title: string;
    movies: Movie[];
    slug: string;
    className?: string;
}

export default function TopTrending({ title, movies, slug, className }: TopTrendingProps) {
    // Top 10 only
    const topMovies = movies.slice(0, 10);

    return (
        <div className={cn("w-full relative py-4", className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white capitalize flex items-center gap-3">
                    <span className="w-1 h-6 bg-[#fbbf24] rounded-full shadow-[0_0_15px_#fbbf24]"></span>
                    <span className="leading-tight">{title}</span>
                </h2>
                {slug && (
                    <Link href={slug} className="text-xs font-medium text-[#fbbf24] hover:text-white flex items-center gap-1 transition-colors group">
                        Xem tất cả <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                )}
            </div>

            {/* List Container */}
            <div className="flex flex-col gap-4">
                {topMovies.map((movie, index) => (
                    <Link
                        key={movie._id}
                        href={`/phim/${movie.slug}`}
                        className="group flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
                    >
                        {/* Rank Number */}
                        <div className={cn(
                            "w-8 text-center font-black text-2xl md:text-3xl italic",
                            "text-transparent bg-clip-text bg-gradient-to-br",
                            index === 0 ? "from-[#fbbf24] to-yellow-200" :
                                index === 1 ? "from-gray-300 to-white" :
                                    index === 2 ? "from-orange-600 to-orange-300" : "from-gray-700 to-gray-500"
                        )} style={{ fontFamily: 'var(--font-outfit)' }}>
                            {index + 1}
                        </div>

                        {/* Poster */}
                        <div className="relative w-[50px] aspect-[2/3] rounded-md overflow-hidden flex-shrink-0 shadow-sm group-hover:shadow-[#fbbf24]/20">
                            <Image
                                src={getImageUrl(movie.poster_url || movie.thumb_url)}
                                alt={movie.name}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-110"
                                sizes="50px"
                            />
                        </div>

                        {/* Metadata */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                            <h3 className="text-white text-sm font-bold line-clamp-1 group-hover:text-[#fbbf24] transition-colors">
                                {decodeHtml(movie.name)}
                            </h3>
                            <p className="text-white/50 text-xs truncate">
                                {decodeHtml(movie.origin_name)}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] items-center px-1.5 py-0.5 rounded-sm bg-white/10 text-white/70 border border-white/5">
                                    {movie.year}
                                </span>
                                <span className="text-[10px] items-center px-1.5 py-0.5 rounded-sm bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/20 font-bold">
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
