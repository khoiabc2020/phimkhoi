"use client";

import Link from "next/link";
import MovieCard from "./MovieCard";
import { Movie } from "@/services/api";
import { useRef, memo, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { sanitizeMovieList } from "@/lib/movie-list";

interface MovieRowProps {
    title: string;
    movies: Movie[];
    slug?: string;
    variant?: "default" | "sidebar";
    priorityFirst?: boolean;
}

function MovieRowInner({ title, movies, slug, variant = "default", priorityFirst = false }: MovieRowProps) {
    const rowRef = useRef<HTMLDivElement>(null);
    const safeMovies = useMemo(
        () => sanitizeMovieList(movies || [], { limit: Math.max(1, (movies || []).length || 1) }),
        [movies]
    );

    const scroll = (direction: "left" | "right") => {
        if (rowRef.current) {
            const { scrollLeft, clientWidth } = rowRef.current;
            const scrollTo =
                direction === "left" ? scrollLeft - clientWidth / 2 : scrollLeft + clientWidth / 2;

            rowRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
        }
    };

    if (!safeMovies || safeMovies.length === 0) return null;

    if (variant === "sidebar") {
        return (
            <div className="group relative mx-auto w-full max-w-[1920px] py-10 px-4 md:px-12">
                <div className="flex flex-col gap-8 md:flex-row md:items-start">
                    <div className="flex w-full flex-shrink-0 flex-col justify-start space-y-4 pt-2 md:w-[220px]">
                        <h2 className="bg-gradient-to-br from-white via-gray-200 to-gray-500 bg-clip-text text-lg font-bold capitalize leading-[1.2] tracking-tight text-transparent md:text-xl">
                            {title}
                        </h2>
                        {slug && (
                            <Link
                                href={slug.startsWith("/") ? slug : `/danh-sach/${slug}`}
                                className="group/link mt-2 inline-flex items-center gap-2 text-sm font-bold text-[#8FA7C5] transition-all hover:text-white"
                            >
                                <span className="border-b-2 border-[#8FA7C5] pb-0.5 transition-colors group-hover/link:border-white">
                                    Xem tất cả
                                </span>
                                <ChevronRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                            </Link>
                        )}
                        <div className="mt-4 hidden h-1.5 w-16 rounded-full bg-[#8FA7C5] md:block" />
                    </div>

                    <div className="group/row relative min-w-0 flex-1">
                        <button
                            onClick={() => scroll("left")}
                            className="absolute left-0 top-0 bottom-0 z-40 flex w-12 items-center justify-start bg-gradient-to-r from-[#0a0a0a]/90 via-[#0a0a0a]/60 to-transparent pl-1 opacity-60 transition-all duration-300 pointer-events-auto md:w-16 md:pl-2 md:opacity-0 md:pointer-events-none md:group-hover/row:opacity-100 md:group-hover/row:pointer-events-auto"
                        >
                            <ChevronLeft className="h-8 w-8 text-white drop-shadow-xl transition-transform hover:scale-110 hover:text-white md:h-10 md:w-10" />
                        </button>

                        <div
                            ref={rowRef}
                            className="no-scrollbar flex snap-x gap-4 overflow-x-auto overflow-y-hidden pb-4 pt-2 scroll-smooth"
                            style={{ scrollbarWidth: "none", msOverflowStyle: "none", scrollBehavior: "smooth", contain: "layout paint" }}
                        >
                            {safeMovies.map((movie, idx) => (
                                <div key={movie._id} className="min-w-[200px] snap-start md:min-w-[280px]">
                                    <MovieCard
                                        movie={movie}
                                        orientation="landscape"
                                        priority={priorityFirst && idx < 2}
                                        loading={priorityFirst && idx < 2 ? "eager" : "lazy"}
                                    />
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => scroll("right")}
                            className="absolute right-0 top-0 bottom-0 z-40 flex w-12 items-center justify-end bg-gradient-to-l from-[#0a0a0a]/90 via-[#0a0a0a]/60 to-transparent pr-1 opacity-60 transition-all duration-300 pointer-events-auto md:w-16 md:pr-2 md:opacity-0 md:pointer-events-none md:group-hover/row:opacity-100 md:group-hover/row:pointer-events-auto"
                        >
                            <ChevronRight className="h-8 w-8 text-white drop-shadow-xl transition-transform hover:scale-110 hover:text-white md:h-10 md:w-10" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <section className="movie-row-section py-2.5">
            <div className="mx-auto w-full max-w-[1920px]">
                <div className="space-y-2.5 rounded-[10px] bg-transparent">
                    <div className="flex items-center justify-between gap-3 px-3 pt-2.5 sm:px-4">
                        <h2 className="flex flex-1 items-center gap-2 text-[16px] font-bold tracking-tight text-white sm:text-[18px] md:text-[20px] min-w-0">
                            <span className="h-4 w-1 flex-shrink-0 rounded-sm bg-[#8FA7C5] sm:h-5" />
                            <span className="truncate">{title}</span>
                        </h2>
                        {slug && (
                            <Link
                                href={slug.startsWith("/") ? slug : `/danh-sach/${slug}`}
                                className="group/link flex flex-shrink-0 whitespace-nowrap items-center gap-1 text-xs font-semibold text-[#8FA7C5] transition-colors hover:text-white sm:text-sm"
                            >
                                Xem tất cả
                                <ChevronRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                            </Link>
                        )}
                    </div>

                    <div className="group/row relative pb-3">
                        <button
                            onClick={() => scroll("left")}
                            className="absolute left-0 top-0 bottom-3 z-40 flex w-12 items-center justify-start bg-gradient-to-r from-[#0a0a0a]/90 via-[#0a0a0a]/60 to-transparent pl-1 opacity-60 transition-all duration-300 pointer-events-auto md:w-16 md:pl-2 md:opacity-0 md:pointer-events-none md:group-hover/row:opacity-100 md:group-hover/row:pointer-events-auto"
                        >
                            <ChevronLeft className="h-8 w-8 text-white drop-shadow-xl transition-transform hover:scale-110 hover:text-white md:h-10 md:w-10" />
                        </button>

                        <div
                            ref={rowRef}
                            className="no-scrollbar flex snap-x gap-2.5 overflow-x-auto overflow-y-hidden px-1.5 pb-2.5 pt-1 scroll-smooth sm:px-2.5"
                            style={{ scrollbarWidth: "none", msOverflowStyle: "none", scrollBehavior: "smooth", contain: "layout paint" }}
                        >
                            {safeMovies.map((movie, idx) => (
                                <div
                                    key={movie._id}
                                    className="min-w-[156px] snap-center sm:min-w-[176px] md:min-w-[196px] xl:min-w-[226px]"
                                >
                                    <MovieCard
                                        movie={movie}
                                        priority={priorityFirst && idx < 3}
                                        loading={priorityFirst && idx < 3 ? "eager" : "lazy"}
                                    />
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => scroll("right")}
                            className="absolute right-0 top-0 bottom-3 z-40 flex w-12 items-center justify-end bg-gradient-to-l from-[#0a0a0a]/90 via-[#0a0a0a]/60 to-transparent pr-1 opacity-60 transition-all duration-300 pointer-events-auto md:w-16 md:pr-2 md:opacity-0 md:pointer-events-none md:group-hover/row:opacity-100 md:group-hover/row:pointer-events-auto"
                        >
                            <ChevronRight className="h-8 w-8 text-white drop-shadow-xl transition-transform hover:scale-110 hover:text-white md:h-10 md:w-10" />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default memo(MovieRowInner);
