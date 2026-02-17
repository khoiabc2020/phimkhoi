"use client";

import MovieCard from "./MovieCard";
import { Movie } from "@/services/api";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MovieRowProps {
    title: string;
    movies: Movie[];
    slug?: string;
    variant?: 'default' | 'sidebar';
}

export default function MovieRow({ title, movies, slug, variant = 'default' }: MovieRowProps) {
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
            <div className="group relative py-10 container mx-auto px-4 md:px-12">
                <div className="flex flex-col md:flex-row md:items-start gap-8">
                    {/* Sidebar Title Section */}
                    <div className="w-full md:w-[220px] flex-shrink-0 flex flex-col justify-start space-y-4 pt-2">
                        <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-gray-500 capitalize leading-[1.1] tracking-tight">
                            {title}
                        </h2>
                        {slug && (
                            <a
                                href={slug.startsWith('/') ? slug : `/danh-sach/${slug}`}
                                className="inline-flex items-center gap-2 text-sm font-bold text-[#fbbf24] hover:text-white transition-all group/link mt-2"
                            >
                                <span className="border-b-2 border-[#fbbf24] group-hover/link:border-white pb-0.5 transition-colors">Xem tất cả</span>
                                <ChevronRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                            </a>
                        )}
                        <div className="hidden md:block w-16 h-1.5 bg-[#fbbf24] rounded-full mt-4 shadow-[0_0_10px_rgba(251,191,36,0.3)]" />
                    </div>

                    {/* Carousel Section */}
                    <div className="flex-1 min-w-0 relative group/row">
                        {/* Left Arrow */}
                        <button
                            onClick={() => scroll("left")}
                            className="absolute left-0 top-0 bottom-0 z-40 w-12 bg-gradient-to-r from-black via-black/50 to-transparent flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all duration-300 -translate-x-full group-hover/row:translate-x-0"
                        >
                            <ChevronLeft className="w-8 h-8 text-white hover:text-[#fbbf24] transition-colors" />
                        </button>

                        <div
                            ref={rowRef}
                            className="flex gap-4 overflow-x-auto pb-4 pt-2 no-scrollbar snap-x scroll-smooth"
                            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                        >
                            {movies.map((movie) => (
                                <div key={movie._id} className="min-w-[200px] md:min-w-[280px] snap-start">
                                    <MovieCard movie={movie} orientation="landscape" />
                                </div>
                            ))}
                        </div>

                        {/* Right Arrow */}
                        <button
                            onClick={() => scroll("right")}
                            className="absolute right-0 top-0 bottom-0 z-40 w-12 bg-gradient-to-l from-black via-black/50 to-transparent flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all duration-300 translate-x-full group-hover/row:translate-x-0"
                        >
                            <ChevronRight className="w-8 h-8 text-white hover:text-[#fbbf24] transition-colors" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Default Layout
    return (
        <div className="space-y-6 group relative py-4">
            <div className="flex items-center justify-between px-4 md:px-12">
                <h2 className="text-lg md:text-2xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
                    <span className="w-1.5 h-6 md:h-8 bg-gradient-to-t from-[#fbbf24] to-yellow-200 rounded-sm shadow-[0_0_15px_rgba(251,191,36,0.5)]"></span>
                    <span className="drop-shadow-lg">{title}</span>
                </h2>
                {slug && (
                    <a
                        href={slug.startsWith('/') ? slug : `/danh-sach/${slug}`}
                        className="text-xs md:text-sm font-medium text-[#fbbf24] hover:text-white flex items-center gap-1 transition-colors group/link"
                    >
                        Xem tất cả
                        <ChevronRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                    </a>
                )}
            </div>

            <div className="relative group/row">
                {/* Left Arrow - Glassmorphism */}
                <button
                    onClick={() => scroll("left")}
                    className="absolute left-0 top-0 bottom-0 z-40 bg-gradient-to-r from-black/80 to-transparent w-16 flex items-center justify-start pl-4 opacity-0 group-hover/row:opacity-100 transition-all duration-300 pointer-events-none group-hover/row:pointer-events-auto"
                >
                    <ChevronLeft className="w-10 h-10 text-white hover:text-[#fbbf24] transition-colors drop-shadow-lg transform hover:scale-110" />
                </button>

                {/* Scroll Container */}
                <div
                    ref={rowRef}
                    className="flex gap-3 overflow-x-auto px-4 md:px-12 pb-10 pt-2 no-scrollbar snap-x scroll-smooth"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {movies.map((movie) => (
                        <div key={movie._id} className="min-w-[140px] md:min-w-[160px] snap-center">
                            <MovieCard movie={movie} />
                        </div>
                    ))}
                </div>

                {/* Right Arrow - Glassmorphism */}
                <button
                    onClick={() => scroll("right")}
                    className="absolute right-0 top-0 bottom-0 z-40 bg-gradient-to-l from-black/80 to-transparent w-16 flex items-center justify-end pr-4 opacity-0 group-hover/row:opacity-100 transition-all duration-300 pointer-events-none group-hover/row:pointer-events-auto"
                >
                    <ChevronRight className="w-10 h-10 text-white hover:text-[#fbbf24] transition-colors drop-shadow-lg transform hover:scale-110" />
                </button>
            </div>
        </div>
    );
}
