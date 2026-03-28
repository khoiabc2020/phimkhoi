"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { memo } from "react";
import { Movie } from "@/services/api";
import { cn, decodeHtml, getPosterImageUrl } from "@/lib/utils";

interface TopTrendingProps {
    title: string;
    movies: Movie[];
    slug: string;
    className?: string;
}

function getYearLabel(movie: Movie) {
    const year = Number.parseInt(String(movie?.year || "").match(/\d{4}/)?.[0] || "", 10);
    return Number.isFinite(year) && year > 1900 ? String(year) : "";
}

function getQualityLabel(movie: Movie) {
    const raw = String(movie?.quality || "").trim();
    return raw && raw !== "0" ? raw : "";
}

function TopTrendingInner({ title, movies, slug, className }: TopTrendingProps) {
    const topMovies = movies.slice(0, 10);

    return (
        <div className={cn("relative w-full py-2", className)}>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2.5 text-[20px] font-extrabold capitalize tracking-tight text-white md:text-[24px]">
                    <span className="h-6 w-1 rounded-full bg-[#8FA7C5]" />
                    <span className="leading-tight">{title}</span>
                </h2>
                {slug && (
                    <Link
                        href={slug}
                        className="group flex items-center gap-1 text-sm font-semibold text-[#a8bad3] transition-colors hover:text-white md:text-base"
                    >
                        Xem tất cả <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                )}
            </div>

            <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto pb-3 [contain:layout_paint]">
                {topMovies.map((movie, index) => (
                    <Link
                        key={movie._id}
                        href={`/phim/${movie.slug}`}
                        className="group flex w-[156px] shrink-0 snap-start flex-col gap-2.5 rounded-[10px] border border-white/[0.06] bg-[#07070b]/82 p-2.5 shadow-[0_8px_18px_#00000055] transition-colors hover:border-white/[0.12] hover:bg-white/[0.03] sm:w-[176px] md:w-[192px] lg:w-[210px] xl:w-[228px]"
                    >
                        <div className="relative aspect-[2/3] w-full flex-shrink-0 overflow-hidden rounded-[10px] bg-[#0B0B10] shadow-md">
                            <Image
                                src={getPosterImageUrl(movie) || "/placeholder.svg"}
                                alt={decodeHtml(movie.name)}
                                fill
                                loading="lazy"
                                className="bg-[#0a0f1a] object-cover transition-transform duration-300 group-hover:scale-105"
                                sizes="(max-width: 768px) 48vw, (max-width: 1280px) 220px, 240px"
                            />
                            <div className="absolute left-0 top-0 z-20 flex h-8 w-8 items-center justify-center rounded-br-lg bg-black/75 backdrop-blur-md md:h-9 md:w-9">
                                <span
                                    className={cn(
                                        "text-lg font-black md:text-xl",
                                        index === 0
                                            ? "text-[#c6d6ea]"
                                            : index === 1
                                              ? "text-gray-200"
                                              : index === 2
                                                ? "text-[#8FA7C5]"
                                                : "text-white"
                                    )}
                                    style={{ fontFamily: "var(--font-outfit)" }}
                                >
                                    {index + 1}
                                </span>
                            </div>
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <h3 className="line-clamp-2 text-[13px] font-bold leading-snug text-white transition-colors group-hover:text-[#c6d6ea] sm:text-sm">
                                {decodeHtml(movie.name)}
                            </h3>
                            <p className="truncate text-xs text-white/50">{decodeHtml(movie.origin_name)}</p>
                            <div className="mt-auto flex items-center gap-2 pt-1 lg:mt-1 lg:flex-wrap lg:pt-0">
                                {getYearLabel(movie) && (
                                    <span className="whitespace-nowrap rounded-sm border border-white/5 bg-white/10 px-1.5 py-0.5 text-[10px] text-white/70">
                                        {getYearLabel(movie)}
                                    </span>
                                )}
                                {getQualityLabel(movie) && (
                                    <span className="whitespace-nowrap rounded-sm border border-[#33455f] bg-[#253143] px-1.5 py-0.5 text-[10px] font-bold text-[#c7d7ea]">
                                        {getQualityLabel(movie)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default memo(TopTrendingInner);
