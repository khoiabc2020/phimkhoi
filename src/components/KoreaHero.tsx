"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
    },
};

interface KoreaHeroProps {
    initialMovies?: any[];
}

function isWeakHeroText(value: string) {
    const normalized = value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

    return (
        !normalized ||
        normalized.length < 28 ||
        normalized.includes("dang cap nhat noi dung") ||
        normalized.includes("dang cap nhat")
    );
}

function buildKoreaFallbackDescription(movie: any) {
    const tags = Array.isArray(movie?.category)
        ? movie.category.map((item: any) => item?.name).filter(Boolean).slice(0, 3)
        : [];
    const title = movie?.name || movie?.origin_name || "Bộ phim";

    if (tags.length > 0) {
        return `${title} mang màu sắc ${tags.join(", ").toLowerCase()}, với nhịp kể cảm xúc, quan hệ nhân vật nhiều biến chuyển và chất liệu rất đặc trưng của phim Hàn Quốc hiện đại.`;
    }

    return `${title} là một bộ phim Hàn Quốc nổi bật với nhịp kể cảm xúc, nhân vật giàu xung đột và hành trình chữa lành, trưởng thành hoặc đối đầu với những lựa chọn lớn trong cuộc sống.`;
}

function normalizeHeroDescription(movie: any) {
    const raw = stripHtml(movie?.content || movie?.description || movie?.tmdbData?.overview || "").trim();
    return isWeakHeroText(raw) ? buildKoreaFallbackDescription(movie) : raw;
}

export default function KoreaHero({ initialMovies = [] }: KoreaHeroProps) {
    const [current, setCurrent] = useState(0);
    const [isAutoPlay, setIsAutoPlay] = useState(true);
    const router = useRouter();

    const slides = useMemo(
        (): (any & {
            bg: string;
            logo: string;
            displayTitle: string;
            displayDesc: string;
            displayTags: string[];
            displayEpisodes: string;
        })[] =>
            (initialMovies || [])
                .filter((movie) => Boolean(movie?.slug && ASSETS_MAP[movie.slug]))
                .map((movie) => {
                    const assets = ASSETS_MAP[movie.slug];

                    return {
                        ...movie,
                        ...assets,
                        displayTitle: movie.name,
                        displayDesc: normalizeHeroDescription(movie),
                        displayTags:
                            movie.category?.slice(0, 3).map((c: any) => c?.name).filter(Boolean) || ["Phim Hàn"],
                        displayEpisodes: movie.episode_current || "Full",
                    };
                }),
        [initialMovies]
    );

    useEffect(() => {
        if (!isAutoPlay || slides.length === 0) return;
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length);
        }, 8000);
        return () => clearInterval(timer);
    }, [isAutoPlay, slides.length]);

    const currentMovie = slides[current] || null;
    const isFirstSlide = current === 0;

    useEffect(() => {
        if (currentMovie?.slug) {
            router.prefetch(`/phim/${currentMovie.slug}`);
        }
    }, [currentMovie?.slug, router]);

    const next = () => {
        setIsAutoPlay(false);
        setCurrent((prev) => (prev + 1) % slides.length);
    };

    const prev = () => {
        setIsAutoPlay(false);
        setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
    };

    if (slides.length === 0 || !currentMovie) return null;

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
                    transition={{ duration: 0.35 }}
                    className="absolute inset-0"
                >
                    <div className="absolute inset-0 z-0 optimize-gpu">
                        <div className="md:hidden absolute inset-0 overflow-hidden">
                            <Image
                                src={getImageUrl(currentMovie.bg || currentMovie.poster_url || "")}
                                alt={currentMovie.displayTitle}
                                fill
                                className="object-cover brightness-[0.45] contrast-[1.1]"
                                priority={isFirstSlide}
                                loading={isFirstSlide ? "eager" : "lazy"}
                                decoding="async"
                                quality={70}
                                sizes="100vw"
                            />
                        </div>

                        <div className="hidden md:block absolute inset-0 overflow-hidden">
                            <Image
                                src={getImageUrl(currentMovie.bg || "")}
                                alt={currentMovie.displayTitle}
                                fill
                                className="object-cover brightness-[0.45] contrast-[1.1]"
                                priority={isFirstSlide}
                                loading={isFirstSlide ? "eager" : "lazy"}
                                decoding="async"
                                quality={70}
                                sizes="100vw"
                            />
                        </div>

                        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/30 to-transparent z-10" />
                        <div className="absolute inset-y-0 left-0 w-[50%] bg-gradient-to-r from-black via-black/65 to-transparent z-10" />
                        <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-black via-transparent to-transparent z-10 opacity-60" />
                        <div className="absolute inset-x-0 bottom-0 z-30 pt-40 pb-12 md:pb-20 lg:pb-32 px-4 md:px-8 lg:pl-26 xl:pl-34 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent z-20" />
                    </div>

                    <div className="absolute inset-0 z-30 flex items-end lg:items-center px-6 pb-20 md:pb-0 md:pl-24 md:pr-14 lg:pl-32 xl:pl-[140px] max-w-[1920px] mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45, delay: 0.08, ease: "easeOut" }}
                            className="max-w-[90%] sm:max-w-xl md:max-w-2xl flex flex-col items-start gap-2.5 md:gap-5"
                        >
                            {currentMovie.logo ? (
                                <div className="relative w-full max-w-[200px] sm:max-w-[280px] md:max-w-[420px] lg:max-w-[480px] aspect-[4/1.5]">
                                    <Image
                                        src={currentMovie.logo}
                                        alt={currentMovie.displayTitle}
                                        fill
                                        sizes="(max-width: 768px) 300px, 500px"
                                        className="object-contain object-left drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)]"
                                        priority={isFirstSlide}
                                        loading={isFirstSlide ? "eager" : "lazy"}
                                    />
                                </div>
                            ) : (
                                <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white drop-shadow-xl font-display uppercase tracking-tighter line-clamp-3 break-words">
                                    {currentMovie.displayTitle}
                                </h2>
                            )}

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

                            <div className="flex flex-wrap gap-1.5 md:gap-2">
                                {currentMovie.displayTags.map((tag: string) => (
                                    <span
                                        key={tag}
                                        className="px-2.5 py-0.5 md:px-3 md:py-1 bg-white/10 border border-white/[0.12] rounded-full text-[10px] md:text-[12px] font-semibold text-white/75 backdrop-blur-md"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            {/* Description — desktop only, too cluttered on mobile */}
                            <p className="hidden md:block text-[14px] lg:text-[16px] text-white/65 line-clamp-3 leading-relaxed max-w-lg drop-shadow">
                                {currentMovie.displayDesc}
                            </p>

                            <div className="flex items-center gap-3 md:gap-4 pt-1 md:pt-2 pointer-events-auto">
                                <Link
                                    href={`/phim/${currentMovie.slug}`}
                                    className="flex items-center gap-2 md:gap-3 px-6 md:px-10 h-11 md:h-14 bg-[#8FA7C5] text-[#0a0a0a] rounded-full font-black text-[14px] md:text-[16px] active:scale-95 shadow-2xl shadow-[#8FA7C5]/20 uppercase tracking-wider transition-all duration-300 hover:bg-white hover:scale-105"
                                >
                                    <Play className="w-4 h-4 md:w-5 md:h-5 fill-current" />
                                    Xem ngay
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
                        onClick={() => {
                            setIsAutoPlay(false);
                            setCurrent(idx);
                        }}
                        className={cn(
                            "transition-all duration-300 rounded-full",
                            idx === current ? "w-8 md:w-10 h-2 bg-[#8FA7C5]" : "w-2 h-2 bg-white/30 hover:bg-white/60"
                        )}
                        aria-label={`Chuyển đến slide ${idx + 1}`}
                    />
                ))}
            </div>

            <button
                onClick={prev}
                className="absolute left-4 md:left-6 lg:left-10 top-1/2 -translate-y-1/2 z-40 w-11 h-11 md:w-14 md:h-14 rounded-full bg-black/25 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:bg-black/40 transition-all"
                aria-label="Slide trước"
            >
                <ChevronLeft className="w-5 h-5 md:w-7 md:h-7 mx-auto" />
            </button>

            <button
                onClick={next}
                className="absolute right-4 md:right-6 lg:right-10 top-1/2 -translate-y-1/2 z-40 w-11 h-11 md:w-14 md:h-14 rounded-full bg-black/25 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:bg-black/40 transition-all"
                aria-label="Slide sau"
            >
                <ChevronRight className="w-5 h-5 md:w-7 md:h-7 mx-auto" />
            </button>
        </section>
    );
}
