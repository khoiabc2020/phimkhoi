"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import Link from "next/link";
import { cn, getImageUrl, stripHtml } from "@/lib/utils";
import WatchlistButton from "./WatchlistButton";

interface MovieSlideAssets {
    bg: string;
    logo: string;
}

const ASSETS_MAP: Record<string, MovieSlideAssets> = {
    "nghe-thuat-lua-doi-cua-sarah": {
        bg: "/images/korea-hero/nghe-thuat-lua-doi-cua-sarah-bg.webp?v=2.0",
        logo: "/images/korea-hero/nghe-thuat-lua-doi-cua-sarah-logo.webp?v=2.0",
    },
    "khi-cuoc-doi-cho-ban-qua-quyt": {
        bg: "/images/korea-hero/khi-cuoc-doi-cho-ban-qua-quyt-bg.webp?v=2.0",
        logo: "/images/korea-hero/khi-cuoc-doi-cho-ban-qua-quyt-logo.png?v=2.0",
    },
    "tieng-yeu-nay-anh-dich-duoc-khong": {
        bg: "/images/korea-hero/tieng-yeu-nay-anh-dich-duoc-khong-bg.webp?v=2.1",
        logo: "/images/korea-hero/tieng-yeu-nay-anh-dich-duoc-khong-logo.webp?v=2.1",
    },
    "ban-trai-theo-yeu-cau": {
        bg: "/images/korea-hero/ban-trai-theo-yeu-cau-bg.webp?v=2.0",
        logo: "/images/korea-hero/ban-trai-theo-yeu-cau-logo.webp?v=2.0",
    },
    "trao-em-ca-vu-tru": {
        bg: "/images/korea-hero/trao-em-ca-vu-tru-bg.webp?v=2.0",
        logo: "/images/korea-hero/trao-em-ca-vu-tru-logo.png?v=2.0",
    }
};

interface KoreaHeroProps {
    initialMovies?: any[];
}

export default function KoreaHero({ initialMovies = [] }: KoreaHeroProps) {
    const [current, setCurrent] = useState(0);
    const [isAutoPlay, setIsAutoPlay] = useState(true);

    const slides = useMemo((): (any & { bg: string; logo: string; actor?: string; displayTitle: string; displayDesc: string; displayTags: string[]; displayEpisodes: string })[] => {
        return (initialMovies || [])
            .map(movie => {
                const assets = ASSETS_MAP[movie.slug] || {
                    bg: movie.thumb_url || movie.poster_url,
                    logo: "",
                };
                
                return {
                    ...movie,
                    ...assets,
                    displayTitle: movie.name,
                    displayDesc: movie.content 
                        ? stripHtml(movie.content)
                        : "Đang cập nhật nội dung...",
                    displayTags: movie.category?.slice(0, 3).map((c: any) => c?.name).filter(Boolean) || ["Phim Hàn"],
                    displayEpisodes: movie.episode_current || "Full"
                };
            });
    }, [initialMovies]);

    useEffect(() => {
        if (!isAutoPlay || slides.length === 0) return;
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length);
        }, 8000);
        return () => clearInterval(timer);
    }, [isAutoPlay, slides.length]);

    const next = () => {
        setIsAutoPlay(false);
        setCurrent((prev) => (prev + 1) % slides.length);
    };

    const prev = () => {
        setIsAutoPlay(false);
        setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
    };

    if (slides.length === 0) return null;

    const currentMovie = slides[current];

    return (
        <section 
            className="relative w-full h-[500px] md:h-[600px] lg:h-[700px] xl:h-[800px] overflow-hidden bg-black"
            style={{ contain: "layout style paint" }}
        >
            <AnimatePresence mode="popLayout" initial={false}>
                <motion.div 
                    key={current}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0"
                >
                    {/* Background Layer (Main Crossfade) */}
                    <div className="absolute inset-0 z-0 optimize-gpu">
                        <div className="md:hidden absolute inset-0 overflow-hidden">
                            <Image 
                                src={getImageUrl(currentMovie.bg || currentMovie.poster_url || "")}
                                alt={currentMovie.displayTitle}
                                fill
                                className="object-cover brightness-[0.45] contrast-[1.15]"
                                priority
                                decoding="async"
                                quality={85}
                                sizes="100vw"
                            />
                        </div>

                        <div className="hidden md:block absolute inset-0 overflow-hidden">
                            <Image 
                                src={getImageUrl(currentMovie.bg || "")}
                                alt={currentMovie.displayTitle}
                                fill
                                className="object-cover brightness-[0.45] contrast-[1.15]"
                                priority
                                decoding="async"
                                quality={85}
                                sizes="100vw"
                            />
                        </div>

                        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/20 to-transparent z-10" />
                        <div className="absolute inset-y-0 left-0 w-[50%] bg-gradient-to-r from-black via-black/60 to-transparent z-10" />
                        
                        <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-black via-transparent to-transparent z-10 opacity-60" />
                        <div className="absolute inset-x-0 bottom-0 z-30 pt-40 pb-12 md:pb-20 lg:pb-32 px-4 md:px-8 lg:pl-26 xl:pl-34 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent z-20" />
                    </div>

                    {/* Info Layer (Slide-up) */}
                    <div className="absolute inset-0 z-30 flex items-end lg:items-center px-6 pb-20 md:pb-0 md:pl-24 md:pr-14 lg:pl-32 xl:pl-[140px] max-w-[1920px] mx-auto">
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                            className="max-w-[90%] sm:max-w-xl md:max-w-2xl flex flex-col items-start gap-2.5 md:gap-5"
                        >
                            <div className="relative w-full max-w-[200px] sm:max-w-[280px] md:max-w-[420px] lg:max-w-[480px] aspect-[4/1.5]">
                                {currentMovie.logo ? (
                                    <Image 
                                        src={currentMovie.logo}
                                        alt={currentMovie.displayTitle}
                                        fill
                                        className="object-contain object-left drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)]"
                                        priority
                                    />
                                ) : (
                                    <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white drop-shadow-xl font-display uppercase tracking-tighter line-clamp-2">
                                        {currentMovie.displayTitle}
                                    </h2>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-[13px] md:text-[15px] font-bold text-white/90">
                                <div className="bg-[#8FA7C5] text-[#0a0a0a] px-2 py-0.5 rounded-sm text-[10px] md:text-[11px] font-black tracking-tighter uppercase">
                                    TOP 10
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>{currentMovie.year}</span>
                                    <span className="text-white/30 font-light">|</span>
                                    <span>Hàn Quốc</span>
                                    <span className="text-white/30 font-light">|</span>
                                    <span className="text-[#8FA7C5]">{currentMovie.displayEpisodes}</span>
                                </div>
                            </div>

                            <div className="hidden sm:flex flex-wrap gap-2">
                                {currentMovie.displayTags.map((tag: string) => (
                                    <span key={tag} className="px-3 py-1 bg-white/10 border border-white/10 rounded-full text-[11px] md:text-[12px] font-bold text-white/80 cursor-default shadow-sm backdrop-blur-md transition-all duration-300 hover:bg-white/20">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <p className="text-[13px] md:text-[14px] lg:text-[16px] text-white/70 line-clamp-2 md:line-clamp-3 leading-relaxed max-w-lg drop-shadow relative">
                                {currentMovie.displayDesc}
                            </p>

                            <div className="flex items-center gap-3 md:gap-4 pt-2 pointer-events-auto">
                                <Link 
                                    href={`/phim/${currentMovie.slug}`}
                                    className="flex items-center gap-2 md:gap-3 px-6 md:px-10 h-11 md:h-14 bg-[#8FA7C5] text-[#0a0a0a] rounded-full font-black text-[14px] md:text-[16px] active:scale-95 shadow-2xl shadow-[#8FA7C5]/20 uppercase tracking-wider transition-all duration-300 hover:bg-white hover:scale-105"
                                >
                                    <Play className="w-4 h-4 md:w-5 md:h-5 fill-current" />
                                    Xem Ngay
                                </Link>
                                
                                <WatchlistButton
                                    slug={currentMovie.slug}
                                    className="h-11 w-11 md:h-14 md:w-14 rounded-full bg-white/10 border border-white/20 text-white active:scale-95 backdrop-blur-md shadow-xl flex items-center justify-center transition-all duration-300 hover:bg-white/20 hover:scale-110"
                                    showLabel={false}
                                />
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </AnimatePresence>

            <div className="absolute bottom-12 right-6 md:right-12 lg:right-32 z-40 flex items-center gap-1.5 md:gap-2">
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => { setIsAutoPlay(false); setCurrent(idx); }}
                        className={cn(
                            "rounded-full transition-all duration-300",
                            current === idx 
                                ? "w-8 md:w-10 h-1.5 md:h-2 bg-[#8FA7C5] shadow-[0_0_12px_#8FA7C5]" 
                                : "w-1.5 md:w-2 h-1.5 md:h-2 bg-white/20 hover:bg-white/40 hover:scale-110"
                        )}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>

            <div className="absolute top-[40%] md:top-1/2 -translate-y-1/2 left-0 right-0 z-40 pointer-events-none flex items-center justify-between px-4 md:px-8 lg:pl-32 lg:pr-10 xl:pl-40 xl:pr-16">
                <button 
                    onClick={prev}
                    className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full bg-black/10 hover:bg-black/40 backdrop-blur-md border border-white/5 flex items-center justify-center text-white/20 hover:text-white hover:scale-110 active:scale-95 transition-all duration-300 group pointer-events-auto shadow-lg"
                    aria-label="Previous slide"
                >
                    <ChevronLeft className="w-5 h-5 md:w-7 md:h-7 lg:w-8 lg:h-8" />
                </button>
                <button 
                    onClick={next}
                    className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full bg-black/10 hover:bg-black/40 backdrop-blur-md border border-white/5 flex items-center justify-center text-white/20 hover:text-white hover:scale-110 active:scale-95 transition-all duration-300 group pointer-events-auto shadow-lg"
                    aria-label="Next slide"
                >
                    <ChevronRight className="w-5 h-5 md:w-7 md:h-7 lg:w-8 lg:h-8" />
                </button>
            </div>
        </section>
    );
}
