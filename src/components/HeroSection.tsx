"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { Movie } from "@/services/api";
import { getImageUrl, decodeHtml, cn } from "@/lib/utils";
import { shouldUseTmdbMedia } from "@/lib/movie-list";
import { detectImageOrientation, resolveMovieImages } from "@/lib/movie-media";
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

function getHeroYear(movie: any) {
    const rawYear = Number.parseInt(String(movie?.year || "").match(/\d{4}/)?.[0] || "", 10);
    return Number.isFinite(rawYear) && rawYear > 1900 ? String(rawYear) : "";
}

function getHeroCountry(movie: any) {
    const name = String(movie?.country?.[0]?.name || "").trim();
    return name && name !== "0" ? decodeHtml(name) : "";
}

function getHeroEpisodeLabel(movie: any) {
    const current = String(movie?.episode_current || "").trim();
    if (current && current !== "0") return current;
    const total = Number.parseInt(String(movie?.episode_total || "").replace(/[^\d]/g, ""), 10);
    if (Number.isFinite(total) && total > 1) return `${total} tập`;
    return "Full";
}

function tmdbImage(path: string, size: string) {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const p = path.startsWith("/") ? path : `/${path}`;
    return `https://image.tmdb.org/t/p/${size}${p}`;
}

function getStrictLandscapeFromMovie(movie: any) {
    const normalized = resolveMovieImages(movie);
    const thumb = String(normalized.thumb_url || "").trim();
    return thumb && detectImageOrientation(thumb) === "landscape" ? thumb : "";
}

function getHeroImage(movie: any, type: "poster" | "backdrop" | "character" | "logo", variant: "mobile" | "desktop") {
    if (movie.isCustomHero) {
        if (type === "backdrop") return movie.layer_bg;
        if (type === "character") return movie.layer_character;
        if (type === "logo") return movie.layer_logo;
        if (type === "poster") return movie.layer_character || movie.layer_bg;
    }

    const tmdb = shouldUseTmdbMedia(movie, movie?.tmdbData) ? movie.tmdbData : null;
    const normalized = resolveMovieImages(movie);
    const poster = String(normalized.poster_url || "").trim();
    const backdrop = String(normalized.thumb_url || "").trim();

    if (tmdb) {
        if (type === "poster" && tmdb.poster_path)
            return tmdbImage(tmdb.poster_path, variant === "desktop" ? "w500" : "w780");
        if (type === "backdrop" && tmdb.backdrop_path)
            return tmdbImage(tmdb.backdrop_path, variant === "desktop" ? "original" : "w780");
    }

    if (type === "backdrop") {
        return getStrictLandscapeFromMovie(movie);
    }

    if (poster) {
        return poster;
    }

    if (variant === "mobile") {
        if (backdrop) {
            return backdrop;
        }
    }

    return "/placeholder.jpg";
}

function hasDesktopHeroBackdrop(movie: any) {
    if (!movie) return false;
    if (movie.isCustomHero) return Boolean(movie.layer_bg);

    const tmdb = shouldUseTmdbMedia(movie, movie?.tmdbData) ? movie.tmdbData : null;
    if (tmdb?.backdrop_path) return true;

    return Boolean(getStrictLandscapeFromMovie(movie));
}

function HeroBackdropFrame({
    src,
    alt,
    priority = false,
}: {
    src: string;
    alt: string;
    priority?: boolean;
}) {
    const [failed, setFailed] = useState(false);
    const finalSrc = !failed && src ? src : "";

    return (
        <>
            {finalSrc ? (
                <Image
                    src={getImageUrl(finalSrc)}
                    alt={alt}
                    fill
                    className="object-cover object-[center_20%]"
                    priority={priority}
                    sizes="100vw"
                    decoding="async"
                    onError={() => setFailed(true)}
                />
            ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(143,167,197,0.18),transparent_30%),linear-gradient(180deg,#121212_0%,#0a0a0a_55%,#050505_100%)]" />
            )}
        </>
    );
}

function HeroThumbTile({
    movie,
    active,
    onClick,
}: {
    movie: any;
    active: boolean;
    onClick: () => void;
}) {
    const [failed, setFailed] = useState(false);
    const thumbSrc = getHeroImage(movie, "backdrop", "desktop") || getHeroImage(movie, "poster", "desktop");
    const displayTitle = decodeHtml(movie?.name || movie?.origin_name || "Phim");

    return (
        <div
            onClick={onClick}
            className={cn(
                "relative w-[90px] md:w-[110px] lg:w-[130px] xl:w-[140px] aspect-[16/9] rounded-lg overflow-hidden cursor-pointer flex-shrink-0 transition-all duration-300 box-border group snap-center",
                active
                    ? "ring-[2.5px] ring-primary scale-105 opacity-100 shadow-[0_0_25px_rgba(143,167,197,0.5)] z-10"
                    : "ring-1 ring-white/10 scale-95 opacity-50 hover:opacity-100 hover:scale-100 z-0 bg-black/40"
            )}
        >
            {thumbSrc && !failed ? (
                <Image
                    src={getImageUrl(thumbSrc)}
                    alt={displayTitle}
                    fill
                    className="object-cover"
                    sizes="200px"
                    placeholder="blur"
                    blurDataURL={blurData}
                    onError={() => setFailed(true)}
                />
            ) : (
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(22,22,28,0.96),rgba(10,10,10,0.98))]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(143,167,197,0.18),transparent_55%)]" />
                    <div className="absolute inset-x-3 bottom-2 text-[10px] font-bold text-white/65 line-clamp-2 leading-tight">
                        {displayTitle}
                    </div>
                </div>
            )}
            {active && (
                <div className="absolute inset-0 bg-primary/10 animate-pulse pointer-events-none" />
            )}
        </div>
    );
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

// ─── MOBILE HERO ──────────────────────────────────────────────────────────────

function MobileHero({ movies, active = true }: { movies: Movie[], active?: boolean }) {
const { index, go, next, prev } = useAutoplay(movies.length, 5000, !active);
const movie = movies[index] as any;

const touchRef = useRef({ startX: 0, endX: 0 });
const handleTouchStart = (e: React.TouchEvent) => touchRef.current.startX = e.touches[0].clientX;
const handleTouchMove = (e: React.TouchEvent) => touchRef.current.endX = e.touches[0].clientX;
const handleTouchEnd = () => {
    const { startX, endX } = touchRef.current;
    if (startX - endX > 50) next();
    if (endX - startX > 50) prev();
};

return (
    <div 
        className="relative w-full aspect-[9/13] sm:aspect-[16/10] overflow-hidden bg-[#0a0a0a]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
    >
        <AnimatePresence mode="popLayout" initial={false}>
            <motion.div 
                key={`mobile-slide-${movie._id || index}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="absolute inset-0"
                style={{ willChange: "transform, opacity" }}
            >
                <div className="absolute inset-0">
                    <div className="absolute inset-0 opacity-40 blur-3xl scale-110 pointer-events-none">
                        <Image
                            src={getImageUrl(getHeroImage(movie, "backdrop", "mobile"))}
                            alt=""
                            fill
                            className="object-cover"
                            decoding="async"
                        />
                    </div>

                        <Image
                            src={getImageUrl(getHeroImage(movie, "poster", "mobile"))}
                            alt=""
                            fill
                            className="object-cover"
                            priority={index === 0}
                            decoding="async"
                        />
                        
                        <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
                        <div className="absolute inset-0 bg-[#0a0a0a]/20" />
                    </div>

                    <div className="absolute inset-x-0 bottom-0 z-[10] px-6 pb-16 flex flex-col items-center gap-2 text-center">
                        <div className="flex flex-col items-center gap-2 text-center">
                            {movie.isCustomHero && movie.layer_logo ? (
                                <div className="relative w-[180px] h-[54px] mb-2 mx-auto">
                                    <Image
                                        src={getImageUrl(movie.layer_logo)}
                                        alt={decodeHtml(movie.name)}
                                        fill
                                        className="object-contain"
                                        unoptimized={!movie.layer_logo.startsWith('http')}
                                    />
                                </div>
                            ) : (
                                <h1 className="text-[24px] md:text-[28px] font-black text-white leading-tight mb-1 uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] px-4">
                                    {decodeHtml(movie.name)}
                                </h1>
                            )}
                        </div>

                        <div className="flex items-center gap-3 text-[13px] font-bold text-white/90">
                            <div className="bg-[#8FA7C5] text-[#0a0a0a] px-2 py-0.5 rounded-sm text-[10px] md:text-[11px] font-black tracking-tighter uppercase">
                                TOP 10
                            </div>
                            <div className="flex items-center gap-2">
                                {getHeroYear(movie) && <span>{getHeroYear(movie)}</span>}
                                {getHeroYear(movie) && getHeroCountry(movie) && <span className="text-white/30 font-light">|</span>}
                                <span>{getHeroCountry(movie) || "Phim"}</span>
                                <span className="text-white/30 font-light">|</span>
                                <span className="text-[#8FA7C5]">{getHeroEpisodeLabel(movie)}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-4">
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
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

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
    const desktopBackdrop = getHeroImage(movie, "backdrop", "desktop");

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

    return (
        <div
            className="relative w-full h-[500px] md:h-[600px] lg:h-[700px] xl:h-[800px] overflow-hidden bg-[#0a0a0a]"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            style={{ contain: "layout size" }}
        >
            <AnimatePresence mode="popLayout" initial={false}>
                <motion.div 
                    key={`slide-${movie._id || index}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    className="absolute inset-0"
                >
                    <div className="absolute inset-0 z-0 overflow-hidden">
                        <HeroBackdropFrame
                            src={desktopBackdrop}
                            alt={decodeHtml(movie.name)}
                            priority={index === 0}
                        />
                    </div>

                    {movie.isCustomHero && movie.layer_character && (
                        <div className="absolute inset-0 z-[1] pointer-events-none">
                            <div className="relative w-full h-full">
                                <Image
                                    src={getImageUrl(movie.layer_character)}
                                    alt=""
                                    fill
                                    className="object-cover object-[center_bottom]"
                                    sizes="100vw"
                                    priority
                                />
                            </div>
                        </div>
                    )}

                    <div className="absolute inset-0 z-[2] pointer-events-none">
                        <div className="absolute inset-y-0 left-0 w-[80%] lg:w-[60%] bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
                        <div className="absolute inset-0 bg-[#0a0a0a]/10" />
                        <div className="absolute inset-x-0 bottom-0 z-30 pt-40 pb-12 md:pb-20 lg:pb-32 px-4 md:px-8 lg:pl-26 xl:pl-34 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
                    </div>

                    <div className="relative z-[10] h-full w-full max-w-[1920px] mx-auto px-6 md:pl-24 md:pr-14 lg:pl-32 lg:pr-12 xl:pl-[140px] flex items-end pb-20 md:pb-28 lg:pb-36 xl:pb-48 pointer-events-none">
                        <div className="w-full flex justify-between items-end">
                            <div className="w-full md:w-[75%] lg:w-[65%] xl:w-[60%] space-y-3 lg:space-y-4 pointer-events-auto pr-0 lg:pr-[300px] xl:pr-[400px]">
                                
                                <div>
                                    {movie.isCustomHero && movie.layer_logo ? (
                                        <div className="relative w-full max-w-[400px] md:max-w-[500px] lg:max-w-[600px] h-[100px] md:h-[130px] lg:h-[160px] mb-4">
                                            <Image
                                                src={getImageUrl(movie.layer_logo)}
                                                alt={decodeHtml(movie.name)}
                                                fill
                                                className="object-contain object-left-bottom drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]"
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
                                </div>

                                <div className="flex flex-wrap items-center gap-3 lg:gap-4 font-bold text-[14px] lg:text-[15px] text-white/90">
                                    <div className="bg-[#8FA7C5] text-[#0a0a0a] px-2 py-0.5 rounded-sm text-[11px] lg:text-[12px] font-black tracking-tighter uppercase shadow-lg shadow-blue-900/20">
                                        TOP 10
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {getHeroYear(movie) && <span>{getHeroYear(movie)}</span>}
                                        {getHeroYear(movie) && getHeroCountry(movie) && <span className="text-white/20 font-light">|</span>}
                                        {getHeroCountry(movie) && <span>{getHeroCountry(movie)}</span>}
                                        {getHeroCountry(movie) && <span className="text-white/20 font-light">|</span>}
                                        <span className="text-[#8FA7C5]">{getHeroEpisodeLabel(movie)}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap pt-1">
                                    {movie.category?.slice(0, 3).map((c: any) => (
                                        <Link
                                            key={c.id || c.name}
                                            href={`/the-loai/${c.slug}`}
                                            className="text-[12px] lg:text-[13px] font-bold text-white/80 bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md rounded-full px-4 py-1.5 shadow-sm"
                                        >
                                            {c.name}
                                        </Link>
                                    ))}
                                    {movie.quality && (
                                        <span className="text-[12px] lg:text-[13px] font-black text-white/60 border border-white/20 rounded-full px-4 py-1.5 uppercase tracking-tight">
                                            {formatQualityLabel(movie.quality) || movie.quality}
                                        </span>
                                    )}
                                </div>

                                {movie.content && (
                                    <p className="text-white/80 text-[14px] lg:text-[15px] xl:text-[16px] leading-[1.6] line-clamp-2 md:line-clamp-3 lg:line-clamp-2 xl:line-clamp-3 max-w-2xl drop-shadow-md font-medium">
                                        {decodeHtml(stripHtml(movie.content))}
                                    </p>
                                )}

                                <div className="flex flex-wrap items-center gap-4 pt-4 lg:pt-6 pointer-events-auto">
                                    <Link
                                        href={`/phim/${movie.slug}`}
                                        className="flex items-center justify-center gap-2 h-12 md:h-14 px-8 md:px-10 rounded-full bg-[#8FA7C5] text-[#0a0a0a] font-black text-[15px] lg:text-[16px] uppercase tracking-wide group shadow-xl shadow-[#8FA7C5]/30"
                                    >
                                        <Play className="w-5 h-5 fill-current shrink-0" />
                                        Xem Ngay
                                    </Link>
                                    <WatchlistButton
                                        slug={movie.slug}
                                        className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-md shadow-xl flex items-center justify-center group"
                                        showLabel={false}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[30] w-full max-w-[90vw] md:max-w-3xl lg:max-w-5xl">
                <div 
                    ref={navRef}
                    className="flex items-center gap-2 md:gap-3 overflow-x-auto no-scrollbar py-3 px-2 scroll-smooth snap-x snap-mandatory min-w-0 w-full"
                    style={{ maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}
                >
                    {movies.map((m: any, idx) => {
                        const isActive = idx === index;
                        return (
                            <HeroThumbTile
                                key={`thumb-${m._id || idx}`}
                                movie={m}
                                active={isActive}
                                onClick={() => go(idx)}
                            />
                        );
                    })}
                </div>
            </div>

            <div className="absolute top-[35%] md:top-[40%] -translate-y-1/2 left-0 right-0 z-[35] pointer-events-none flex items-center justify-between px-2 md:px-8 lg:pl-32 lg:pr-10 xl:pl-40 xl:pr-16">
                <button 
                    onClick={prev}
                    className="h-8 w-8 md:h-9 md:w-9 lg:h-10 lg:w-10 rounded-full bg-transparent border border-transparent flex items-center justify-center text-white/15 hover:text-white/45 hover:bg-white/[0.04] active:scale-95 transition-all duration-300 pointer-events-auto shadow-none"
                    aria-label="Previous slide"
                >
                    <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
                </button>
                <button 
                    onClick={next}
                    className="h-8 w-8 md:h-9 md:w-9 lg:h-10 lg:w-10 rounded-full bg-transparent border border-transparent flex items-center justify-center text-white/15 hover:text-white/45 hover:bg-white/[0.04] active:scale-95 transition-all duration-300 pointer-events-auto shadow-none"
                    aria-label="Next slide"
                >
                    <ChevronRight className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
                </button>
            </div>
        </div>
    );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function HeroSection({ movies }: { movies: Movie[] }) {
    if (!movies || movies.length === 0) return null;
    const desktopMovies = movies.filter(hasDesktopHeroBackdrop).slice(0, 10);
    const mobileMovies = movies.slice(0, 10);
    if (mobileMovies.length === 0) return null;

    return (
        <div className="relative w-full bg-[#0a0a0a] font-sans" style={{ minHeight: '400px', contain: "layout transition", willChange: "transform" }}>
            <div className="md:hidden">
                <MobileHero movies={mobileMovies} active={true} />
            </div>
            {desktopMovies.length > 0 && (
                <div className="hidden md:block">
                    <DesktopHero movies={desktopMovies} active={true} />
                </div>
            )}
        </div>
    );
}
