"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, Info, Star, Calendar, Bookmark } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface MovieSlideAssets {
    bg: string;
    actor: string;
    logo: string;
    actorScale?: number;
    actorTranslateY?: string;
}

const ASSETS_MAP: Record<string, MovieSlideAssets> = {
    "nghe-thuat-lua-doi-cua-sarah": {
        bg: "/images/korea-hero/nghe-thuat-lua-doi-cua-sarah-bg.webp?v=1.7",
        actor: "/images/korea-hero/nghe-thuat-lua-doi-cua-sarah-actor.webp?v=1.7",
        logo: "/images/korea-hero/nghe-thuat-lua-doi-cua-sarah-logo.webp?v=1.7",
        actorScale: 0.82,     // Thu bé lại 1 chút
        actorTranslateY: "-5%" // Đẩy lên cao hơn 1 chút
    },
    "khi-cuoc-doi-cho-ban-qua-quyt": {
        bg: "/images/korea-hero/khi-cuoc-doi-cho-ban-qua-quyt-bg.webp?v=1.7",
        actor: "/images/korea-hero/khi-cuoc-doi-cho-ban-qua-quyt-actor.png?v=1.7",
        logo: "/images/korea-hero/khi-cuoc-doi-cho-ban-qua-quyt-logo.png?v=1.7",
        actorScale: 1.05,
        actorTranslateY: "-10%" // Đẩy lên cao nhất để che phần chân lỗi (user đã cắt)
    },
    "tieng-yeu-nay-anh-dich-duoc-khong": {
        bg: "/images/korea-hero/tieng-yeu-nay-anh-dich-duoc-khong-bg.png?v=1.7",
        actor: "/images/korea-hero/tieng-yeu-nay-anh-dich-duoc-khong-actor.png?v=1.7",
        logo: "/images/korea-hero/tieng-yeu-nay-anh-dich-duoc-khong-logo.webp?v=1.7",
        actorScale: 1.25,     // To hơn chút
        actorTranslateY: "-15%" // Đẩy lên cao hẳn trên background cho đẹp
    },
    "ban-trai-theo-yeu-cau": {
        bg: "/images/korea-hero/ban-trai-theo-yeu-cau-bg.webp?v=1.7",
        actor: "/images/korea-hero/ban-trai-theo-yeu-cau-actor.webp?v=1.7",
        logo: "/images/korea-hero/ban-trai-theo-yeu-cau-logo.webp?v=1.7",
        actorScale: 1.35,     // To hơn chút (yêu cầu phim 4)
        actorTranslateY: "-8%"  // Đẩy lên
    },
    "trao-em-ca-vu-tru": {
        bg: "/images/korea-hero/trao-em-ca-vu-tru-bg.webp?v=1.7",
        actor: "/images/korea-hero/trao-em-ca-vu-tru-actor.webp?v=1.7",
        logo: "/images/korea-hero/trao-em-ca-vu-tru-logo.png?v=1.7",
        actorScale: 1.15,     // To hơn chút (yêu cầu phim 5)
        actorTranslateY: "-12%" // Đẩy lên (yêu cầu phim 5)
    }
};

interface KoreaHeroProps {
    initialMovies?: any[];
}

export default function KoreaHero({ initialMovies = [] }: KoreaHeroProps) {
    const [current, setCurrent] = useState(0);
    const [isAutoPlay, setIsAutoPlay] = useState(true);

    const slides = useMemo(() => {
        if (!initialMovies || initialMovies.length === 0) return [];
        
        return initialMovies.map(movie => {
            const assets = ASSETS_MAP[movie.slug] || {
                bg: movie.thumb_url || movie.poster_url,
                actor: "",
                logo: "",
                actorScale: 0.85,
                actorTranslateY: "0%"
            };
            
            return {
                ...movie,
                ...assets,
                displayTitle: movie.name,
                displayDesc: movie.content 
                    ? movie.content
                        .replace(/<[^>]*>?/gm, '')
                        .replace(/&quot;/g, '"')
                        .replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&#39;/g, "'")
                    : "Đang cập nhật nội dung...",
                displayTags: movie.category?.slice(0, 3).map((c: any) => c.name) || ["Phim Hàn"],
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

    const slideEase = [0.22, 1, 0.36, 1] as const;

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
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="absolute inset-0"
                >
                    {/* Layer 1: Background Parallax */}
                    <motion.div 
                        initial={{ scale: 1.03 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 8, ease: "linear" }}
                        className="absolute inset-0 z-0"
                    >
                        <Image 
                            src={currentMovie.bg}
                            alt={currentMovie.displayTitle}
                            fill
                            className="object-cover brightness-[0.5] contrast-[1.1]"
                            priority
                            quality={90}
                        />
                        {/* IQIYI/Netflix Style Masks */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/20 to-transparent z-10" />
                        <div className="absolute inset-y-0 left-0 w-[50%] bg-gradient-to-r from-black via-black/60 to-transparent z-10" />
                        
                        {/* THE "ONFLIX" BOTTOM FADE */}
                        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black via-black/80 to-transparent z-10" />
                        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent z-20" />
                    </motion.div>

                    {/* Layer 2: Actor Cutout (Parallax) */}
                    {currentMovie.actor && (
                        <div className="absolute inset-0 z-20 pointer-events-none flex items-end justify-end overflow-hidden">
                            <motion.div
                                initial={{ x: 40, opacity: 0, scale: (currentMovie.actorScale || 0.85) + 0.05 }}
                                animate={{ x: 0, opacity: 0.9, scale: currentMovie.actorScale || 0.85 }}
                                transition={{ delay: 0.1, duration: 1.2, ease: slideEase }}
                                className="relative w-[70%] h-[80%] md:w-[60%] md:h-[90%] lg:w-[45%] lg:h-[100%] mr-[5%] md:mr-[8%] lg:mr-[12%]"
                            >
                                <Image 
                                    src={currentMovie.actor}
                                    alt="Characters"
                                    fill
                                    className="object-contain object-right-bottom drop-shadow-[0_25px_50px_rgba(0,0,0,0.9)]"
                                    style={{ 
                                        transform: `scale(${currentMovie.actorScale || 0.85}) translateY(${currentMovie.actorTranslateY || "0%"})`,
                                        transformOrigin: "bottom right" 
                                    }}
                                    priority
                                    quality={95}
                                />
                            </motion.div>
                        </div>
                    )}

                    {/* Layer 3: IQIYI Style Content */}
                    <div className="absolute inset-0 z-30 flex items-center px-6 md:pl-24 md:pr-14 lg:pl-32 xl:pl-[140px] max-w-[1920px] mx-auto">
                        <div className="max-w-[85%] sm:max-w-xl md:max-w-2xl flex flex-col items-start gap-3 md:gap-5">
                            
                            {/* Movie Logo or Styled Title */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2, duration: 0.8, ease: slideEase }}
                                className="relative w-full max-w-[200px] sm:max-w-[280px] md:max-w-[420px] lg:max-w-[480px] aspect-[4/1.5]"
                            >
                                {currentMovie.logo ? (
                                    <Image 
                                        src={currentMovie.logo}
                                        alt={currentMovie.displayTitle}
                                        fill
                                        className="object-contain object-left drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)]"
                                        priority
                                    />
                                ) : (
                                    <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white drop-shadow-xl font-display uppercase italic tracking-tighter line-clamp-2">
                                        {currentMovie.displayTitle}
                                    </h2>
                                )}
                            </motion.div>

                            {/* Metadata Badges */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4, duration: 0.8 }}
                                className="flex flex-wrap items-center gap-2 md:gap-3"
                            >
                                <div className="flex items-center gap-1.5 bg-primary/20 backdrop-blur-md px-2 py-0.5 md:px-2.5 md:py-1 rounded-md border border-primary/30 shadow-lg shadow-primary/10">
                                    <Star className="w-3 md:w-3.5 h-3 md:h-3.5 fill-primary text-primary" />
                                    <span className="text-[11px] md:text-[13px] font-bold text-primary">10.0</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2 py-0.5 md:px-2.5 md:py-1 rounded-md border border-white/10">
                                    <Calendar className="w-3 md:w-3.5 h-3 md:h-3.5 text-white/60" />
                                    <span className="text-[11px] md:text-[13px] font-semibold text-white/90">{currentMovie.year}</span>
                                </div>
                                <span className="px-2 py-0.5 rounded border border-white/20 text-[10px] md:text-[11px] font-bold text-white/70 uppercase tracking-wider">Vietsub</span>
                                <span className="text-[12px] md:text-[14px] font-bold text-white/90">{currentMovie.displayEpisodes}</span>
                            </motion.div>

                            {/* Tags */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5, duration: 0.8 }}
                                className="hidden sm:flex flex-wrap gap-2"
                            >
                                {currentMovie.displayTags.map((tag: string) => (
                                    <span key={tag} className="text-[11px] md:text-[12px] font-medium text-white/50 hover:text-white transition-colors cursor-default">
                                        {tag}
                                    </span>
                                ))}
                            </motion.div>

                            {/* Description */}
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6, duration: 0.8 }}
                                className="text-[13px] md:text-[14px] lg:text-[16px] text-white/70 line-clamp-2 md:line-clamp-3 leading-relaxed max-w-lg drop-shadow relative"
                            >
                                {currentMovie.displayDesc}
                            </motion.p>

                            {/* Action Buttons - Standardized with Home */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.7, duration: 0.8 }}
                                className="flex items-center gap-3 md:gap-4 pt-2 pointer-events-auto"
                            >
                                <Link 
                                    href={`/phim/${currentMovie.slug}`}
                                    className="flex items-center gap-2 md:gap-3 px-6 md:px-10 h-11 md:h-14 bg-primary text-black rounded-full font-black text-[14px] md:text-[16px] hover:bg-yellow-400 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/30 group uppercase tracking-wider"
                                >
                                    <Play className="w-4 h-4 md:w-5 md:h-5 fill-current" />
                                    Xem Ngay
                                </Link>
                                
                                <WatchlistButton
                                    slug={currentMovie.slug}
                                    className="h-11 w-11 md:h-14 md:w-14 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all hover:scale-110 active:scale-95 backdrop-blur-md shadow-xl flex items-center justify-center group"
                                    showLabel={false}
                                />
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Pagination Indicators */}
            <div className="absolute bottom-12 left-6 md:left-12 lg:left-32 xl:left-40 z-40 flex items-center gap-2">
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => { setIsAutoPlay(false); setCurrent(idx); }}
                        className={cn(
                            "h-1 rounded-full transition-all duration-500",
                            current === idx ? "w-10 bg-primary" : "w-4 bg-white/20 hover:bg-white/40"
                        )}
                    />
                ))}
            </div>

            {/* Side Navigation Buttons - Onflix Style */}
            <div className="absolute inset-y-0 left-0 lg:left-20 right-0 z-40 pointer-events-none flex items-center justify-between px-2 md:px-4 lg:px-8">
                <button 
                    onClick={prev}
                    className="w-10 h-10 md:w-11 md:h-11 lg:w-14 lg:h-14 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all group pointer-events-auto hover:scale-110 active:scale-95 shadow-2xl"
                    aria-label="Previous slide"
                >
                    <ChevronLeft className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 group-hover:-translate-x-0.5 transition-transform" />
                </button>
                <button 
                    onClick={next}
                    className="w-10 h-10 md:w-11 md:h-11 lg:w-14 lg:h-14 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all group pointer-events-auto hover:scale-110 active:scale-95 shadow-2xl"
                    aria-label="Next slide"
                >
                    <ChevronRight className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 group-hover:translate-x-0.5 transition-transform" />
                </button>
            </div>
        </section>
    );
}
