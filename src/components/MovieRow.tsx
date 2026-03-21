"use client";

import MovieCard from "./MovieCard";
import { Movie } from "@/services/api";
import { useRef, memo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MovieRowProps {
    title: string;
    movies: Movie[];
    slug?: string;
    variant?: 'default' | 'sidebar';
    priorityFirst?: boolean;
}

function MovieRowInner({ title, movies, slug, variant = 'default', priorityFirst = false }: MovieRowProps) {
    const rowRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
        if (rowRef.current) {
            const { scrollLeft, clientWidth } = rowRef.current;
            const scrollTo = direction === "left"
                ? scrollLeft - clientWidth / 2
                : scrollLeft + clientWidth / 2;

            rowRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
        }
    };

    if (!movies || movies.length === 0) return null;

    if (variant === 'sidebar') {
        return (
            <div className="group relative py-10 w-full max-w-[1920px] mx-auto px-4 md:px-12">
                <div className="flex flex-col md:flex-row md:items-start gap-8">
                    {/* Sidebar Title Section */}
                    <div className="w-full md:w-[220px] flex-shrink-0 flex flex-col justify-start space-y-4 pt-2">
                        <h2 className="text-lg md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-gray-500 capitalize leading-[1.2] tracking-tight">
                            {title}
                        </h2>
                        {slug && (
                            <a
                                href={slug.startsWith('/') ? slug : `/danh-sach/${slug}`}
                                className="inline-flex items-center gap-2 text-sm font-bold text-[#8FA7C5] hover:text-white transition-all group/link mt-2"
                            >
                                <span className="border-b-2 border-[#8FA7C5] group-hover/link:border-white pb-0.5 transition-colors">Xem tất cả</span>
                                <ChevronRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                            </a>
                        )}
                        <div className="hidden md:block w-16 h-1.5 bg-[#8FA7C5] rounded-full mt-4" />
                    </div>

                    {/* Carousel Section */}
                    <div className="flex-1 min-w-0 relative group/row">
                        {/* Left Arrow */}
                        <button
                            onClick={() => scroll("left")}
                            className="absolute left-0 top-0 bottom-0 z-40 bg-gradient-to-r from-[#0a0a0a]/90 via-[#0a0a0a]/60 to-transparent w-12 md:w-16 flex items-center justify-start pl-1 md:pl-2 opacity-60 md:opacity-0 md:group-hover/row:opacity-100 transition-all duration-300 pointer-events-auto md:pointer-events-none md:group-hover/row:pointer-events-auto"
                        >
                            <ChevronLeft className="w-8 h-8 md:w-10 md:h-10 text-white hover:text-white transition-transform hover:scale-110 drop-shadow-xl" />
                        </button>

                        <div
                            ref={rowRef}
                            className="flex gap-4 overflow-x-auto overflow-y-hidden pb-4 pt-2 no-scrollbar snap-x scroll-smooth"
                            style={{ scrollbarWidth: "none", msOverflowStyle: "none", scrollBehavior: "smooth", contain: "layout paint" }}
                        >
                            {movies.map((movie, idx) => (
                                <div key={movie._id} className="min-w-[200px] md:min-w-[280px] snap-start">
                                    <MovieCard 
                                        movie={movie} 
                                        orientation="landscape" 
                                        priority={priorityFirst && idx < 3}
                                        loading={priorityFirst ? "eager" : "lazy"}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Right Arrow */}
                        <button
                            onClick={() => scroll("right")}
                            className="absolute right-0 top-0 bottom-0 z-40 bg-gradient-to-l from-[#0a0a0a]/90 via-[#0a0a0a]/60 to-transparent w-12 md:w-16 flex items-center justify-end pr-1 md:pr-2 opacity-60 md:opacity-0 md:group-hover/row:opacity-100 transition-all duration-300 pointer-events-auto md:pointer-events-none md:group-hover/row:pointer-events-auto"
                        >
                            <ChevronRight className="w-8 h-8 md:w-10 md:h-10 text-white hover:text-white transition-transform hover:scale-110 drop-shadow-xl" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Default Layout
    return (
        <section
            className="py-2.5 movie-row-section"
            style={{ contentVisibility: "auto", containIntrinsicSize: "420px" }}
        >
            <div className="w-full max-w-[1920px] mx-auto">
                <div className="space-y-2.5 rounded-[10px] bg-transparent overflow-hidden">
                    <div className="flex items-center justify-between px-3 sm:px-4 pt-2.5">
                        <h2 className="text-[16px] sm:text-[18px] md:text-[20px] font-bold text-white flex items-center gap-2 tracking-tight">
                            <span className="w-1 h-4 sm:h-5 bg-[#8FA7C5] rounded-sm" />
                            <span>{title}</span>
                        </h2>
                        {slug && (
                            <a
                                href={slug.startsWith('/') ? slug : `/danh-sach/${slug}`}
                                className="text-xs sm:text-sm font-semibold text-[#8FA7C5] hover:text-white flex items-center gap-1 transition-colors group/link"
                            >
                                Xem tất cả
                                <ChevronRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                            </a>
                        )}
                    </div>

                    <div className="relative group/row pb-3">
                        {/* Left Arrow */}
                        <button
                            onClick={() => scroll("left")}
                            className="absolute left-0 top-0 bottom-3 z-40 bg-gradient-to-r from-[#0a0a0a]/90 via-[#0a0a0a]/60 to-transparent w-12 md:w-16 flex items-center justify-start pl-1 md:pl-2 opacity-60 md:opacity-0 md:group-hover/row:opacity-100 transition-all duration-300 pointer-events-auto md:pointer-events-none md:group-hover/row:pointer-events-auto"
                        >
                            <ChevronLeft className="w-8 h-8 md:w-10 md:h-10 text-white hover:text-white transition-transform hover:scale-110 drop-shadow-xl" />
                        </button>

                        <div
                            ref={rowRef}
                            className="flex gap-2.5 overflow-x-auto overflow-y-hidden px-1.5 sm:px-2.5 pb-2.5 pt-1 no-scrollbar snap-x scroll-smooth"
                            style={{ scrollbarWidth: "none", msOverflowStyle: "none", scrollBehavior: "smooth", contain: "layout paint" }}
                        >
                            {movies.map((movie, idx) => (
                                <div key={movie._id} className="min-w-[156px] sm:min-w-[176px] md:min-w-[196px] xl:min-w-[226px] snap-center">
                                    <MovieCard 
                                        movie={movie} 
                                        priority={priorityFirst && idx < 4}
                                        loading={priorityFirst ? "eager" : "lazy"}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Right Arrow */}
                        <button
                            onClick={() => scroll("right")}
                            className="absolute right-0 top-0 bottom-3 z-40 bg-gradient-to-l from-[#0a0a0a]/90 via-[#0a0a0a]/60 to-transparent w-12 md:w-16 flex items-center justify-end pr-1 md:pr-2 opacity-60 md:opacity-0 md:group-hover/row:opacity-100 transition-all duration-300 pointer-events-auto md:pointer-events-none md:group-hover/row:pointer-events-auto"
                        >
                            <ChevronRight className="w-8 h-8 md:w-10 md:h-10 text-white hover:text-white transition-transform hover:scale-110 drop-shadow-xl" />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default memo(MovieRowInner);
