"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, Info, Star, Calendar, Clock, Bookmark } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface MovieSlideAssets {
    bg: string;
    actor: string;
    logo: string;
    actorScale?: number;
}

const ASSETS_MAP: Record<string, MovieSlideAssets> = {
    "bach-nguyet-phan-tinh": {
        bg: "/images/china-hero/bach-nguyet-bg.webp?v=1.6",
        actor: "/images/china-hero/bach-nguyet-actor.webp?v=1.6",
        logo: "/images/china-hero/bach-nguyet-logo.webp?v=1.6",
    },
    "bui-hoa-hong": {
        bg: "/images/china-hero/bui-hoa-hong-bg.webp?v=1.6",
        actor: "/images/china-hero/bui-hoa-hong-actor.webp?v=1.6",
        logo: "/images/china-hero/bui-hoa-hong-logo.webp?v=1.6",
        actorScale: 1.05,
    },
    "dai-mong-quy-ly": {
        bg: "/images/china-hero/dai-mong-bg.webp?v=1.6",
        actor: "/images/china-hero/dai-mong-actor.webp?v=1.6",
        logo: "/images/china-hero/dai-mong-logo.webp?v=1.6",
        actorScale: 0.95,
    },
    "giang-ho-da-vu-thap-nien-dang": {
        bg: "/images/china-hero/giang-ho-bg.webp?v=1.6",
        actor: "/images/china-hero/giang-ho-actor.webp?v=1.6",
        logo: "/images/china-hero/giang-ho-logo.png?v=1.6",
        actorScale: 1.15,
    },
    "mac-nhan-tang-kieu": {
        bg: "/images/china-hero/mac-nhan-bg.webp?v=1.6",
        actor: "/images/china-hero/mac-nhan-actor.webp?v=1.6",
        logo: "/images/china-hero/mac-nhan-logo.webp?v=1.6",
    },
    "ngoc-minh-tra-cot": {
        bg: "/images/china-hero/ngoc-minh-bg.webp?v=1.6",
        actor: "/images/china-hero/ngoc-minh-actor.webp?v=1.6",
        logo: "/images/china-hero/ngoc-minh-logo.webp?v=1.6",
    },
    "con-ra-the-thong-gi-nua": {
        bg: "/images/china-hero/the-thong-bg.webp?v=1.6",
        actor: "/images/china-hero/the-thong-actor.webp?v=1.6",
        logo: "/images/china-hero/the-thong-logo.webp?v=1.6",
    },
    "truc-ngoc": {
        bg: "/images/china-hero/truc-ngoc-bg.webp?v=1.6",
        actor: "/images/china-hero/truc-ngoc-actor.webp?v=1.6",
        logo: "/images/china-hero/truc-ngoc-logo.webp?v=1.6",
    },
    "xin-chao-1983": {
        bg: "/images/china-hero/xin-chao-bg.webp?v=1.6",
        actor: "/images/china-hero/xin-chao-actor.webp?v=1.6",
        logo: "/images/china-hero/xin-chao-logo.webp?v=1.6",
    },
    "duong-cung-ky-an-thanh-vu-phong-minh": {
        bg: "/images/china-hero/tang-cung-bg.png?v=1.6",
        actor: "/images/china-hero/tang-cung-actor.png?v=1.6",
        logo: "/images/china-hero/tang-cung-logo.png?v=1.6",
    }
};

interface ChinaHeroProps {
    initialMovies?: any[];
}

export default function ChinaHero({ initialMovies = [] }: ChinaHeroProps) {
    const [current, setCurrent] = useState(0);
    const [isAutoPlay, setIsAutoPlay] = useState(true);

    // Merge API data with high-quality local assets
    const slides = useMemo(() => {
        if (!initialMovies || initialMovies.length === 0) return [];
        
        return initialMovies.map(movie => {
            const assets = ASSETS_MAP[movie.slug] || {
                bg: movie.thumb_url || movie.poster_url,
                actor: "",
                logo: "",
                actorScale: 0.85
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
                displayTags: movie.category?.slice(0, 3).map((c: any) => c.name) || ["Phim Trung"],
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
        <section className="relative w-full h-[500px] md:h-[600px] lg:h-[700px] xl:h-[800px] overflow-hidden bg-black">
            <AnimatePresence mode="popLayout">
                <motion.div
                    key={current}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                    className="absolute inset-0"
                >
                    {/* Layer 1: Background Parallax */}
                    <motion.div 
                        initial={{ scale: 1.05 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 10, ease: "linear" }}
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
                        
                        {/* THE "ONFLIX" BOTTOM FADE - Multi-layered for maximum smoothness */}
                        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black via-black/80 to-transparent z-10" />
                        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent z-20" />
                    </motion.div>

                    {/* Layer 2: Actor Cutout (Parallax) */}
                    {currentMovie.actor && (
                        <div className="absolute inset-0 z-20 pointer-events-none flex items-end justify-end overflow-hidden">
                            <motion.div
                                initial={{ x: 60, opacity: 0, scale: (currentMovie.actorScale || 0.85) + 0.1 }}
                                animate={{ x: 0, opacity: 0.9, scale: currentMovie.actorScale || 0.85 }}
                                transition={{ delay: 0.2, duration: 1.5, ease: "easeOut" }}
                                className="relative w-[70%] h-[80%] md:w-[60%] md:h-[90%] lg:w-[45%] lg:h-[100%] mr-[5%] md:mr-[8%] lg:mr-[12%]"
                            >
                                <Image 
                                    src={currentMovie.actor}
                                    alt="Characters"
                                    fill
                                    className="object-contain object-right-bottom drop-shadow-[0_25px_50px_rgba(0,0,0,0.9)]"
                                    priority
                                    quality={95}
                                />
                            </motion.div>
                        </div>
                    )}

                    {/* Layer 3: IQIYI Style Content */}
                    <div className="absolute inset-0 z-30 flex items-center px-6 md:px-12 lg:pl-32 xl:pl-40 max-w-[1920px] mx-auto">
                        <div className="max-w-xl md:max-w-2xl flex flex-col items-start gap-3 md:gap-5">
                            
                            {/* Movie Logo or Styled Title */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3, duration: 0.8 }}
                                className="relative w-full max-w-[280px] md:max-w-[420px] lg:max-w-[480px] aspect-[4/1.5]"
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
                                    <h2 className="text-4xl md:text-6xl font-bold text-white drop-shadow-xl font-display uppercase italic tracking-tighter">
                                        {currentMovie.displayTitle}
                                    </h2>
                                )}
                            </motion.div>

                            {/* Metadata Badges */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4, duration: 0.8 }}
                                className="flex flex-wrap items-center gap-3"
                            >
                                <div className="flex items-center gap-1.5 bg-primary/20 backdrop-blur-md px-2.5 py-1 rounded-md border border-primary/30 shadow-lg shadow-primary/10">
                                    <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                                    <span className="text-[13px] font-bold text-primary">10.0</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10">
                                    <Calendar className="w-3.5 h-3.5 text-white/60" />
                                    <span className="text-[13px] font-semibold text-white/90">{currentMovie.year}</span>
                                </div>
                                <span className="px-2 py-0.5 rounded border border-white/20 text-[11px] font-bold text-white/70 uppercase">Vietsub</span>
                                <span className="text-[14px] font-bold text-white/90">{currentMovie.displayEpisodes}</span>
                            </motion.div>

                            {/* Tags */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5, duration: 0.8 }}
                                className="flex flex-wrap gap-2"
                            >
                                {currentMovie.displayTags.map((tag: string) => (
                                    <span key={tag} className="text-[12px] font-medium text-white/50 hover:text-white transition-colors cursor-default">
                                        {tag}
                                    </span>
                                ))}
                            </motion.div>

                            {/* Description */}
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6, duration: 0.8 }}
                                className="text-[14px] md:text-[16px] text-white/70 line-clamp-2 md:line-clamp-3 leading-relaxed max-w-lg drop-shadow relative"
                            >
                                {currentMovie.displayDesc}
                            </motion.p>

                            {/* Action Buttons */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.7, duration: 0.8 }}
                                className="flex items-center gap-4 pt-2"
                            >
                                <Link 
                                    href={`/phim/${currentMovie.slug}`}
                                    className="flex items-center gap-3 px-8 md:px-10 py-3.5 bg-primary text-black rounded-full font-black text-[15px] md:text-[16px] hover:bg-yellow-400 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/30 group"
                                >
                                    <Play className="w-5 h-5 fill-current" />
                                    Phát ngay
                                </Link>
                                <button 
                                    className="flex items-center gap-2 px-6 py-3.5 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-full hover:bg-white/20 transition-all shadow-xl group font-bold text-[14px]"
                                    title="Thêm vào danh sách"
                                >
                                    <Bookmark className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    <span className="hidden md:block">Danh sách</span>
                                </button>
                                <Link 
                                    href={`/phim/${currentMovie.slug}`}
                                    className="w-13 h-13 flex items-center justify-center bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-full hover:bg-white/20 transition-all shadow-xl group"
                                    title="Thông tin chi tiết"
                                >
                                    <Info className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                </Link>
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

            {/* Slide Navigation Buttons */}
            <div className="absolute right-8 md:right-16 bottom-12 z-40 flex items-center gap-4">
                <button 
                    onClick={prev}
                    className="w-12 h-12 rounded-full border border-white/10 bg-black/20 backdrop-blur-xl flex items-center justify-center text-white/50 hover:bg-white hover:text-black hover:border-white transition-all group shadow-2xl"
                >
                    <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
                </button>
                <button 
                    onClick={next}
                    className="w-12 h-12 rounded-full border border-white/10 bg-black/20 backdrop-blur-xl flex items-center justify-center text-white/50 hover:bg-white hover:text-black hover:border-white transition-all group shadow-2xl"
                >
                    <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
                </button>
            </div>
        </section>
    );
}
