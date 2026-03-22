"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { Movie } from "@/services/api";
import { getImageUrl, decodeHtml, cn } from "@/lib/utils";
import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import WatchlistButton from "./WatchlistButton";

// ─── Utils ────────────────────────────────────────────────────────────────────

function useMediaQuery(query: string) {
    return useSyncExternalStore(
        (cb) => {
            if (typeof window === "undefined") return () => { };
            const mql = window.matchMedia(query);
            mql.addEventListener("change", cb);
            return () => mql.removeEventListener("change", cb);
        },
        () => (typeof window !== "undefined" ? window.matchMedia(query).matches : false),
        () => false
    );
}

const stripHtml = (html: string) => (html ? html.replace(/<[^>]*>/g, "").trim() : "");

const blurData =
    "data:image/webp;base64,UklGRmIAAABXRUJQVlA4IFYAAAAwAQCdASoIAAUAAUAmJaQAA3AA/vx5nAAA/uX3L5B5mR5s3h9n189o9D0Nnv/qJ/93sAf//1kP/+cIIf//2I//97kf///eP///zGf//42gAA==";

function formatQualityLabel(quality?: string) {
    if (!quality) return null;
    const q = String(quality).trim().toUpperCase();
    if (q.includes("FULL") && q.includes("HD")) return "FHD";
    if (q === "FULLHD") return "FHD";
    if (q.includes("BLURAY")) return "BR";
    if (q.includes("WEB-DL") || q.includes("WEBDL")) return "WEB";
    if (q === "FHD" || q === "HD" || q === "4K" || q === "CAM") return q;
    const orig = String(quality).trim();
    return orig.length > 6 ? orig.slice(0, 6) : orig;
}

function getFavoriteData(movie: Movie) {
    return {
        movieId: movie._id || "",
        movieSlug: movie.slug,
        movieName: movie.name,
        movieOriginName: movie.origin_name,
        moviePoster: movie.poster_url || movie.thumb_url,
        movieYear: Number(movie.year) || new Date().getFullYear(),
        movieQuality: movie.quality || "HD",
        movieCategories: movie.category?.map((c) => c.name) || [],
    };
}

function tmdbImage(path: string, size: string) {
    if (!path) return "";
    // If it's already a full URL, don't prepend tmdb domain
    if (path.startsWith("http")) return path;
    const p = path.startsWith("/") ? path : `/${path}`;
    return `https://image.tmdb.org/t/p/${size}${p}`;
}

function getHeroImage(movie: any, type: "poster" | "backdrop" | "character" | "logo", variant: "mobile" | "desktop") {
    if (movie.isCustomHero) {
        if (type === "backdrop") return movie.layer_bg;
        if (type === "character") return movie.layer_character;
        if (type === "logo") return movie.layer_logo;
        if (type === "poster") return movie.layer_character || movie.layer_bg;
    }

    const tmdb = movie?.tmdbData;
    if (tmdb) {
        if (type === "poster" && tmdb.poster_path)
            return getImageUrl(tmdbImage(tmdb.poster_path, variant === "desktop" ? "w500" : "w342"), true);
        if (type === "backdrop" && tmdb.backdrop_path)
            return getImageUrl(tmdbImage(tmdb.backdrop_path, variant === "desktop" ? "original" : "w780"), true);
    }
    // Backdrop must stay landscape-only, do not fallback to poster here.
    const api = type === "backdrop" ? movie.thumb_url : movie.poster_url || movie.thumb_url;
    return api ? getImageUrl(api, true) : "/placeholder.jpg";
}

// ─── Autoplay hook ────────────────────────────────────────────────────────────

function useAutoplay(count: number, delay: number, paused: boolean) {
    const [index, setIndex] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const go = useCallback((i: number) => setIndex((i + count) % count), [count]);

    useEffect(() => {
        if (paused || count <= 1) return;
        timerRef.current = setInterval(() => setIndex((p) => (p + 1) % count), delay);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [count, delay, paused]);

    const next = useCallback(() => {
        setIndex((p) => (p + 1) % count);
    }, [count]);

    const prev = useCallback(() => {
        setIndex((p) => (p - 1 + count) % count);
    }, [count]);

    return { index, go, next, prev };
}

// ─── Dot indicators ───────────────────────────────────────────────────────────

function Dots({ count, active, onGo }: { count: number; active: number; onGo: (i: number) => void }) {
    if (count <= 1) return null;
    return (
        <div className="flex items-center gap-2">
            {Array.from({ length: count }).map((_, i) => (
                <button
                    key={i}
                    onClick={() => onGo(i)}
                    aria-label={`Slide ${i + 1}`}
                    className={cn(
                        "rounded-full transition-all duration-400 ease-out",
                        i === active ? "w-7 h-1.5 bg-[#8FA7C5]" : "w-1.5 h-1.5 bg-white/30 hover:bg-white/60"
                    )}
                />
            ))}
        </div>
    );
}

// ─── MOBILE HERO ──────────────────────────────────────────────────────────────

function MobileHero({ movies, active = true }: { movies: Movie[], active?: boolean }) {
    const { index, go, next, prev } = useAutoplay(movies.length, 5000, !active);
    const movie = movies[index] as any;
    
    // touch swipe
    const touchRef = useRef({ startX: 0, endX: 0 });
    const handleTouchStart = (e: React.TouchEvent) => touchRef.current.startX = e.touches[0].clientX;
    const handleTouchMove = (e: React.TouchEvent) => touchRef.current.endX = e.touches[0].clientX;
    const handleTouchEnd = () => {
        const { startX, endX } = touchRef.current;
        if (startX - endX > 50) next();
        if (endX - startX > 50) prev();
    };

    const ease = [0.22, 1, 0.36, 1] as const;

    return (
        <div 
            className="relative w-full aspect-[10/14] sm:aspect-[16/10] overflow-hidden bg-[#0a0a0a]"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <AnimatePresence initial={false}>
                <motion.div
                    key={`mobile-slide-${movie._id || index}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    className="absolute inset-0"
                >
                    {/* Background Backdrop (Full Screen) */}
                    <div className="absolute inset-0">
                        <Image
                            src={`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/img-proxy?url=${encodeURIComponent(getHeroImage(movie, "backdrop", "mobile"))}&w=1080&q=75`}
                            alt=""
                            fill
                            className="object-cover"
                            priority
                            decoding="async"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-black/20" />
                    </div>

                    {/* Content Block */}
                    <div className="absolute inset-x-0 bottom-0 z-[10] px-6 pb-12 flex flex-col items-center gap-2 text-center">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1, duration: 0.5, ease }}
                        >
                            {movie.isCustomHero && movie.layer_logo ? (
                                <div className="relative w-[180px] h-[54px] mb-2 mx-auto">
                                    <Image
                                        src={movie.layer_logo}
                                        alt={decodeHtml(movie.name)}
                                        fill
                                        className="object-contain"
                                        unoptimized
                                    />
                                </div>
                            ) : (
                                <h1 className="text-[24px] md:text-[28px] font-black text-white leading-tight mb-1 uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] px-4">
                                    {decodeHtml(movie.name)}
                                </h1>
                            )}
                        </motion.div>

                        <motion.div 
                            initial={{ y: 15, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.5, ease }}
                            className="flex items-center gap-3 text-[13px] font-bold text-white/90"
                        >
                            <div className="bg-[#8FA7C5] text-[#0a0a0a] px-2 py-0.5 rounded-sm text-[10px] md:text-[11px] font-black tracking-tighter uppercase">
                                TOP 10
                            </div>
                            <div className="flex items-center gap-2">
                                <span>{movie.year}</span>
                                <span className="text-white/30 font-light">|</span>
                                <span>{movie.country?.[0]?.name || "Phim"}</span>
                                <span className="text-white/30 font-light">|</span>
                                <span className="text-[#8FA7C5]">{movie.episode_current || "Full"}</span>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ y: 15, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.5, ease }}
                            className="flex items-center gap-3 pt-4"
                        >
                            <Link
                                href={`/phim/${movie.slug}`}
                                className="h-12 px-10 rounded-full bg-[#8FA7C5] text-[#0a0a0a] font-black text-[14px] uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-[#8FA7C5]/20 active:scale-95 transition-all"
                            >
                                <Play className="w-5 h-5 fill-current" />
                                Xem Ngay
                            </Link>
                            <WatchlistButton
                                slug={movie.slug}
                                className="h-12 w-12 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center p-0 backdrop-blur-md"
                                showLabel={false}
                            />
                        </motion.div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Indicators - Pill Style */}
            <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-1.5 px-4 overflow-hidden">
                {movies.slice(0, 10).map((_, i) => (
                    <button 
                        key={i} 
                        onClick={() => go(i)}
                        className={cn(
                            "h-1.5 rounded-full transition-all duration-300",
                            i === index ? "w-6 bg-[#8FA7C5] shadow-[0_0_8px_#8FA7C5]" : "w-1.5 bg-white/30"
                        )} 
                    />
                ))}
            </div>
        </div>
    );
}

// ─── DESKTOP HERO ─────────────────────────────────────────────────────────────

function DesktopHero({ movies, active = true }: { movies: Movie[], active?: boolean }) {
    const [paused, setPaused] = useState(false);
    const { index, go, next, prev } = useAutoplay(movies.length, 6000, paused || !active);
    const movie = movies[index] as any;
    const navRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (navRef.current) {
            const container = navRef.current;
            const activeEl = container.children[index] as HTMLElement;
            if (activeEl) {
                const scrollLeft = activeEl.offsetLeft - (container.offsetWidth / 2) + (activeEl.offsetWidth / 2);
                container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
            }
        }
    }, [index]);

    const ease = [0.22, 1, 0.36, 1] as const;

    return (
        <div
            className="relative w-full h-[500px] md:h-[600px] lg:h-[700px] xl:h-[800px] overflow-hidden bg-[#0a0a0a]"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            style={{ contain: "layout size" }}
        >
            {/* ── Crossfade backdrop stack (Cinematic Full Bleed) ── */}
            <AnimatePresence initial={false}>
                <motion.div
                    key={`slide-${movie._id || index}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    className="absolute inset-0"
                >
                    {/* Background Layer with scaling effect */}
                    <motion.div 
                        initial={{ scale: 1.03 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 8, ease: "linear" }}
                        className="absolute inset-0 z-0 optimize-gpu will-change-transform"
                    >
                        <Image
                            src={`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/img-proxy?url=${encodeURIComponent(getHeroImage(movie, "backdrop", "desktop"))}&w=1920&q=80`}
                            alt=""
                            fill
                            className="object-cover object-[center_20%]"
                            priority
                            sizes="100vw"
                            placeholder={movie.isCustomHero ? "empty" : "blur"}
                            blurDataURL={movie.isCustomHero ? undefined : blurData}
                            decoding="async"
                        />
                    </motion.div>

                    {/* Character Overlay (If CustomHero) */}
                    {movie.isCustomHero && movie.layer_character && (
                        <div className="absolute inset-0 z-[1] pointer-events-none">
                            <motion.div
                                initial={{ x: 30, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.1, duration: 1, ease }}
                                className="relative w-full h-full"
                            >
                                <Image
                                    src={`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/img-proxy?url=${encodeURIComponent(movie.layer_character)}&w=1200&q=85`}
                                    alt=""
                                    fill
                                    className="object-cover object-[center_bottom]"
                                    sizes="100vw"
                                    priority
                                />
                            </motion.div>
                        </div>
                    )}

                    {/* Gradient overlays */}
                    <div className="absolute inset-0 z-[2] pointer-events-none">
                        <div className="absolute inset-y-0 left-0 w-[80%] lg:w-[60%] bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
                        <div className="absolute inset-0 bg-[#0a0a0a]/20" />
                        <div className="absolute bottom-0 left-0 right-0 h-40 md:h-56 lg:h-72 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
                    </div>

                    {/* Content Block */}
                    <div className="relative z-[10] h-full w-full max-w-[1920px] mx-auto px-6 md:pl-24 md:pr-14 lg:pl-32 lg:pr-12 xl:pl-[140px] flex items-end pb-12 md:pb-16 lg:pb-24 pointer-events-none">
                        <div className="w-full flex justify-between items-end">
                            <div className="w-full md:w-[75%] lg:w-[65%] xl:w-[60%] space-y-3 lg:space-y-4 pointer-events-auto pr-0 lg:pr-[300px] xl:pr-[400px]">
                                
                                {/* Logo / Title */}
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2, duration: 0.6, ease }}
                                >
                                    {movie.isCustomHero && movie.layer_logo ? (
                                        <div className="relative w-full max-w-[400px] md:max-w-[500px] lg:max-w-[600px] h-[100px] md:h-[130px] lg:h-[160px] mb-4">
                                            <Image
                                                src={movie.layer_logo}
                                                alt={decodeHtml(movie.name)}
                                                fill
                                                className="object-contain object-left-bottom drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]"
                                                unoptimized
                                                priority
                                            />
                                        </div>
                                    ) : (
                                        <h1
                                            className={cn(
                                                "font-display font-black text-white leading-tight tracking-tight pt-1 drop-shadow-[0_8px_24px_rgba(0,0,0,0.9)] pb-2",
                                                "text-balance line-clamp-2 md:line-clamp-3",
                                                movie.name.length > 25 
                                                    ? "text-2xl md:text-3xl lg:text-[40px] xl:text-[46px]" 
                                                    : "text-3xl md:text-[32px] lg:text-[48px] xl:text-[54px]"
                                            )}
                                        >
                                            {decodeHtml(movie.name)}
                                        </h1>
                                    )}
                                </motion.div>

                                {/* Tags & Metadata - Onflix Style */}
                                <motion.div 
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3, duration: 0.6, ease }}
                                    className="flex flex-wrap items-center gap-3 lg:gap-4 font-bold text-[14px] lg:text-[15px] text-white/90"
                                >
                                    <div className="bg-[#8FA7C5] text-[#0a0a0a] px-2 py-0.5 rounded-sm text-[11px] lg:text-[12px] font-black tracking-tighter uppercase shadow-lg shadow-blue-900/20">
                                        TOP 10
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {movie.year && <span>{movie.year}</span>}
                                        {movie.country?.[0] && <span className="text-white/20 font-light">|</span>}
                                        {movie.country?.[0] && <span>{movie.country[0].name}</span>}
                                        {movie.episode_current && <span className="text-white/20 font-light">|</span>}
                                        <span className="text-[#8FA7C5]">{movie.episode_current || "Full"}</span>
                                    </div>
                                </motion.div>

                                {/* Categories - Onflix Style Pills */}
                                <motion.div 
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.4, duration: 0.6, ease }}
                                    className="flex items-center gap-2 flex-wrap pt-1"
                                >
                                    {movie.category?.slice(0, 3).map((c: any) => (
                                        <Link
                                            key={c.id || c.name}
                                            href={`/the-loai/${c.slug}`}
                                            className="text-[12px] lg:text-[13px] font-bold text-white/80 bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md rounded-full px-4 py-1.5 transition-all duration-300 shadow-sm"
                                        >
                                            {c.name}
                                        </Link>
                                    ))}
                                    {movie.quality && (
                                        <span className="text-[12px] lg:text-[13px] font-black text-white/60 border border-white/20 rounded-full px-4 py-1.5 uppercase tracking-tight">
                                            {formatQualityLabel(movie.quality) || movie.quality}
                                        </span>
                                    )}
                                </motion.div>

                                {/* Description */}
                                {movie.content && (
                                    <motion.p
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.5, duration: 0.6, ease }}
                                        className="text-white/80 text-[14px] lg:text-[15px] xl:text-[16px] leading-[1.6] line-clamp-2 md:line-clamp-3 lg:line-clamp-2 xl:line-clamp-3 max-w-2xl drop-shadow-md font-medium"
                                    >
                                        {decodeHtml(stripHtml(movie.content))}
                                    </motion.p>
                                )}

                                {/* Buttons */}
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.6, duration: 0.6, ease }}
                                    className="flex flex-wrap items-center gap-4 pt-4 lg:pt-6 pointer-events-auto"
                                >
                                    <Link
                                        href={`/phim/${movie.slug}`}
                                        className="flex items-center justify-center gap-2 h-12 md:h-14 px-8 md:px-10 rounded-full bg-[#8FA7C5] text-[#0a0a0a] font-black text-[15px] lg:text-[16px] uppercase tracking-wide transition-all duration-300 hover:scale-105 active:scale-95 group shadow-xl shadow-[#8FA7C5]/30"
                                    >
                                        <Play className="w-5 h-5 fill-current shrink-0 group-hover:scale-110 transition-transform" />
                                        Xem Ngay
                                    </Link>
                                    <WatchlistButton
                                        slug={movie.slug}
                                        className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all hover:scale-110 active:scale-95 backdrop-blur-md shadow-xl flex items-center justify-center group"
                                        showLabel={false}
                                    />
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Thumbnail Nav Overlay */}
            <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 lg:bottom-10 lg:right-12 z-[20] flex items-center gap-3 max-w-[calc(100vw-32px)] md:max-w-[40vw] lg:max-w-[60vw]">
                <div 
                    ref={navRef}
                    className="flex items-center gap-2 md:gap-2.5 overflow-x-auto no-scrollbar py-2 px-1 scroll-smooth snap-x snap-mandatory min-w-0 w-full"
                    style={{ maskImage: 'linear-gradient(to right, transparent, black 2%, black 98%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 2%, black 98%, transparent)' }}
                >
                    {movies.map((m: any, idx) => {
                        const isActive = idx === index;
                        return (
                            <div
                                key={`thumb-${m._id || idx}`}
                                onClick={() => go(idx)}
                                className={cn(
                                    "relative w-[85px] md:w-[100px] lg:w-[115px] xl:w-[125px] aspect-[16/9] rounded-lg overflow-hidden cursor-pointer flex-shrink-0 transition-all duration-400 box-border group snap-center",
                                    isActive 
                                        ? "ring-[3px] ring-[#00A859] scale-100 opacity-100 shadow-[0_0_20px_rgba(0,168,89,0.4)] z-10" 
                                        : "ring-1 ring-white/10 scale-95 opacity-50 hover:opacity-100 hover:scale-[0.98] z-0"
                                )}
                            >
                                <Image
                                    src={`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/img-proxy?url=${encodeURIComponent(getHeroImage(m, "backdrop", "mobile"))}&w=300&q=60`}
                                    alt={decodeHtml(m.name)}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                                    sizes="200px"
                                    placeholder="blur"
                                    blurDataURL={blurData}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Side Navigation Buttons - Desktop Onflix Style */}
            <div className="absolute inset-y-0 left-0 lg:left-20 right-0 z-[25] pointer-events-none flex items-center justify-between px-2 md:px-4 lg:px-8">
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
        </div>
    );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function HeroSection({ movies }: { movies: Movie[] }) {
    const [mounted, setMounted] = useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");
    
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!movies || movies.length === 0) return null;
    const heroMovies = movies.slice(0, 10);

    return (
        <div className="relative w-full bg-transparent font-sans" style={{ minHeight: '300px', contain: "layout style paint" }}>
            {/* Mobile View - Render on server and client for stability */}
            <div className={cn("md:hidden", !mounted && "block")}>
                <MobileHero movies={heroMovies} active={mounted && !isDesktop} />
            </div>
            {/* Desktop View - Only truly 'active' after mounting and if screen is large */}
            <div className={cn("hidden md:block", mounted && isDesktop ? "block" : "")}>
                <DesktopHero movies={heroMovies} active={mounted && isDesktop} />
            </div>
        </div>
    );
}
