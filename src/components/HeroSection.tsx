"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { Movie } from "@/services/api";
import { getImageUrl, decodeHtml, cn } from "@/lib/utils";
import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from "react";
import FavoriteButton from "./FavoriteButton";

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

function getHeroImage(movie: any, type: "poster" | "backdrop", variant: "mobile" | "desktop") {
    const tmdb = movie?.tmdbData;
    if (tmdb) {
        if (type === "poster" && tmdb.poster_path)
            return getImageUrl(tmdbImage(tmdb.poster_path, variant === "desktop" ? "w500" : "w342"), true);
        if (type === "backdrop" && tmdb.backdrop_path)
            return getImageUrl(tmdbImage(tmdb.backdrop_path, variant === "desktop" ? "original" : "w1280"), true);
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

function MobileHero({ movies }: { movies: Movie[] }) {
    const { index, go, next, prev } = useAutoplay(movies.length, 5500, false);
    const movie = movies[index] as any;

    const backdropImg = getHeroImage(movie, "backdrop", "mobile");
    const posterImg = getHeroImage(movie, "poster", "mobile");
    const rating = movie.tmdbData?.vote_average ? movie.tmdbData.vote_average.toFixed(1) : null;

    // touch swipe
    const touchX = useRef<number | null>(null);
    const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
    const onTouchEnd = (e: React.TouchEvent) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 48) dx < 0 ? next() : prev();
        touchX.current = null;
    };

    return (
        <div
            className="relative w-full select-none mt-[-54px]"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            {/* ── Crossfade slide stack ── */}
            <div className="relative w-full overflow-hidden">
                {movies.map((m: any, i) => {
                    const bg = getHeroImage(m, "backdrop", "mobile");
                    const po = getHeroImage(m, "poster", "mobile");
                    const isPriority = i < 2;
                    const isActive = i === index;

                    return (
                        <div
                            key={m._id || i}
                            className={cn(
                                "absolute inset-0 transition-opacity duration-700 ease-in-out",
                                i === 0 ? "relative" : "absolute inset-0",
                                isActive ? "opacity-100 z-10" : "opacity-0 z-0"
                            )}
                            style={i > 0 ? { position: "absolute", inset: 0 } : undefined}
                            aria-hidden={!isActive}
                        >
                            {/* Backdrop */}
                            <div className="relative w-full h-[300px] sm:h-[380px] overflow-hidden bg-[#0a0a0a]">
                                <Image
                                    src={bg}
                                    alt=""
                                    fill
                                    className="object-cover object-[62%_20%]"
                                    priority={isActive && i < 2}
                                    loading={isActive ? "eager" : "lazy"}
                                    sizes="100vw"
                                    placeholder="blur"
                                    blurDataURL={blurData}
                                    decoding="async"
                                />
                                {/* Gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/36 to-transparent" />
                                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/56 via-transparent to-transparent" />

                                {/* Quality + rating badges */}
                                <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 z-20">
                                    <div className="flex items-center shadow-lg">
                                        <span className="bg-[#E50914] text-white text-[9px] font-black px-1.5 py-0.5 rounded-l-[1px] tracking-tighter">
                                            TOP 10
                                        </span>
                                        <span className="bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-[9px] font-bold px-1.5 py-0.5 rounded-r-[1px] tracking-tight">
                                            Hôm nay
                                        </span>
                                    </div>
                                    {m.quality && (
                                        <span className="bg-black/40 backdrop-blur-sm border border-white/10 text-white/80 text-[9px] font-bold px-2 py-0.5 rounded tracking-wider shadow-md">
                                            {formatQualityLabel(m.quality) || m.quality}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Poster Stack always on top */}
                <div className="absolute bottom-3 left-2.5 z-20 w-[90px] h-[126px] rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/10">
                    {movies.map((m: any, i) => {
                        const isActive = i === index;
                        const po = getHeroImage(m, "poster", "mobile");
                        return (
                            <Link
                                key={`m-poster-${m._id || i}`}
                                href={`/phim/${m.slug}`}
                                className={cn(
                                    "absolute inset-0 transition-opacity duration-300",
                                    isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                                )}
                                aria-hidden={!isActive}
                            >
                                <Image
                                    src={po}
                                    alt=""
                                    fill
                                    className="object-cover"
                                    sizes="90px"
                                    placeholder="blur"
                                    blurDataURL={blurData}
                                    loading={isActive ? "eager" : "lazy"}
                                    decoding="async"
                                    priority={isActive && i < 2}
                                />
                            </Link>
                        );
                    })}
                </div>

                {/* Overlay title/meta on hero image (Onflix-like mobile) */}
                <div className="absolute inset-x-0 bottom-0 z-20 px-3 pb-4">
                    <div className="pl-[102px]">
                        <h1
                            key={`m-title-${index}`}
                            className={cn(
                                "font-outfit font-black text-white leading-[1.1] drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)] animate-hero-in tracking-tight uppercase",
                                "text-balance line-clamp-2",
                                movie.name.length > 30 ? "text-[14px]" : movie.name.length > 20 ? "text-[16px]" : "text-[18px]"
                            )}
                        >
                            {decodeHtml(movie.name)}
                        </h1>
                         <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {movie.year && <span className="text-[11px] font-black text-white/90">{movie.year}</span>}
                            {movie.country?.[0] && <span className="text-[11px] text-white/50">| {movie.country[0].name}</span>}
                            {movie.category?.slice(0, 2).map((c: any) => (
                                <span key={c.id || c.name} className="text-[11px] text-white/60">· {c.name}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Content below ── */}
            <div className="px-3 pt-2 pb-2">
                <div className="pl-[102px] min-h-[4px]" />

                {/* Buttons */}
                <div className="flex items-center gap-2 mt-3">
                    <Link
                        href={`/xem-phim/${movie.slug}?autoPlay=true`}
                        className="flex flex-1 items-center justify-center gap-1.5 h-10 rounded-full bg-[#8FA7C5] text-[#0a0a0a] font-black text-[14px] active:scale-[0.97] hover:scale-105 transition-all"
                    >
                        <Play className="w-3.5 h-3.5 fill-[#0a0a0a] shrink-0" />
                        Xem Ngay
                    </Link>
                    <Link
                        href={`/phim/${movie.slug}`}
                        className="flex items-center justify-center px-4 h-10 rounded-full bg-white/8 border border-white/12 text-white font-medium text-[13px] active:scale-[0.97] transition-transform shrink-0"
                    >
                        Chi Tiết
                    </Link>
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/8 border border-white/12 active:scale-[0.97] transition-transform shrink-0">
                        <FavoriteButton movieData={getFavoriteData(movie)} size="sm" />
                    </div>
                </div>

                {/* Dots */}
                <div className="flex justify-center mt-3 mb-1">
                    <Dots count={movies.length} active={index} onGo={go} />
                </div>
            </div>
        </div>
    );
}

// ─── DESKTOP HERO ─────────────────────────────────────────────────────────────

function DesktopHero({ movies }: { movies: Movie[] }) {
    const [paused, setPaused] = useState(false);
    const { index, go, next, prev } = useAutoplay(movies.length, 6000, paused);
    const movie = movies[index] as any;

    return (
        <div
            className="relative w-full h-[65vh] lg:h-[75vh] xl:h-[85vh] overflow-hidden bg-[#0a0a0a]"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            {/* ── Crossfade backdrop stack (Cinematic Full Bleed) ── */}
            {movies.map((m: any, i) => {
                const bg = getHeroImage(m, "backdrop", "desktop");
                const isActive = i === index;
                return (
                    <div
                        key={`bg-${m._id || i}`}
                        className={cn(
                            "absolute inset-0 transition-opacity duration-1000 ease-in-out will-change-[opacity]",
                            isActive ? "opacity-100 z-[1]" : "opacity-0 z-0 pointer-events-none"
                        )}
                        aria-hidden={!isActive}
                    >
                        {/* Single Sharp Layer for Cinematic Feel */}
                        <Image
                            src={bg}
                            alt=""
                            fill
                            className={cn(
                                "object-cover object-[center_20%] opacity-100 transition-transform duration-[8000ms] ease-linear",
                                isActive ? "scale-105" : "scale-100"
                            )}
                            priority={isActive && i < 2}
                            loading={isActive ? "eager" : "lazy"}
                            sizes="100vw"
                            placeholder="blur"
                            blurDataURL={blurData}
                            decoding="async"
                        />
                    </div>
                );
            })}

            {/* ── Gradient overlays (always on top) ── */}
            <div className="absolute inset-0 z-[2] pointer-events-none transition-opacity duration-500">
                {/* Left text readability - Stronger for cinematic text */}
                <div className="absolute inset-y-0 left-0 w-[80%] lg:w-[60%] bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent" />
                {/* Bottom blend into page */}
                <div className="absolute bottom-0 left-0 right-0 h-48 lg:h-64 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
            </div>

            {/* ── Content ── */}
            <div className="relative z-[3] h-full w-full max-w-[1920px] mx-auto lg:pl-20 px-6 md:px-10 lg:pl-12 lg:pr-6 flex items-end pb-12 md:pb-16 lg:pb-24 pointer-events-none">
                <div className="w-full">
                    {/* Left: Text block */}
                    <div className="w-full md:w-[85%] lg:w-[80%] xl:w-[70%] space-y-4 lg:space-y-6 pointer-events-auto">
                        {/* Badges Row (Onflix/VieON style) */}
                        <div className="flex flex-wrap items-center gap-2.5 lg:gap-4 transition-all duration-500 delay-100">
                            <div className="flex items-center">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-l-[2px] bg-[#E50914] text-white text-[10px] lg:text-[11px] font-black uppercase tracking-tighter shadow-lg">
                                    TOP 10
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-r-[2px] bg-white/10 backdrop-blur-md border-y border-r border-white/20 text-white/90 text-[10px] lg:text-[11px] font-bold tracking-tight">
                                    Hôm nay
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-3 text-white/90 font-bold text-[13px] lg:text-[14px] drop-shadow-md">
                                {movie.year && <span>{movie.year}</span>}
                                {movie.country?.[0] && <span className="opacity-50">|</span>}
                                {movie.country?.[0] && <span>{movie.country[0].name}</span>}
                                {movie.episode_current && <span className="opacity-50">|</span>}
                                {movie.episode_current && <span>{movie.episode_current}</span>}
                            </div>

                            {movie.quality && (
                                <span className="px-1.5 py-0.5 rounded border border-white/20 bg-black/20 text-white/70 text-[10px] font-bold backdrop-blur-sm">
                                    {formatQualityLabel(movie.quality) || movie.quality}
                                </span>
                            )}
                        </div>

                        {/* Title — Optimized for all devices */}
                        <h1
                            key={`title-${index}`}
                            className={cn(
                                "font-outfit font-black text-white leading-[1.05] tracking-tight pt-1 animate-hero-in drop-shadow-[0_8px_24px_rgba(0,0,0,0.9)] uppercase",
                                "text-balance",
                                movie.name.length > 40 ? "line-clamp-3" : "line-clamp-2",
                                // Tablet (md) and iPad (lg) specific scaling
                                movie.name.length > 35 
                                    ? "text-3xl md:text-4xl lg:text-5xl xl:text-6xl" 
                                    : movie.name.length > 20
                                        ? "text-4xl md:text-5xl lg:text-[54px] xl:text-[72px]"
                                        : "text-4xl md:text-6xl lg:text-7xl xl:text-[88px]"
                            )}
                            title={decodeHtml(movie.name)}
                        >
                            {decodeHtml(movie.name)}
                        </h1>

                        {/* Origin + Genre chips + Meta */}
                        <div
                            key={`meta-${index}`}
                            className="flex items-center gap-3 flex-wrap animate-hero-in animation-delay-100"
                        >
                            {movie.origin_name && (
                                <span className="text-white/60 text-[15px] font-medium opacity-90 truncate max-w-[300px] border-r border-white/20 pr-3 mr-1">
                                    {decodeHtml(movie.origin_name)}
                                </span>
                            )}
                            {/* Clickable genre chips - more clean, less borders */}
                            {movie.category?.slice(0, 3).map((c: any) => (
                                <Link
                                    key={c.id || c.name}
                                    href={`/the-loai/${c.slug}`}
                                    className="text-[13px] text-white/80 hover:text-white transition-all duration-200"
                                >
                                    {c.name}
                                </Link>
                            ))}
                        </div>

                        {/* Description - matched to Onflix concise look */}
                        {movie.content && (
                            <p
                                key={`desc-${index}`}
                                className="text-white/80 text-[15px] lg:text-[16px] leading-relaxed line-clamp-2 md:line-clamp-3 max-w-xl xl:max-w-2xl animate-hero-in animation-delay-150 drop-shadow-md font-medium opacity-90"
                            >
                                {decodeHtml(stripHtml(movie.content))}
                            </p>
                        )}

                        {/* Buttons */}
                        <div
                            key={`btns-${index}`}
                            className="flex flex-wrap items-center gap-4 pt-4 lg:pt-6 animate-hero-in animation-delay-200 pointer-events-auto"
                        >
                            <Link
                                href={`/xem-phim/${movie.slug}?autoPlay=true`}
                                className="flex items-center justify-center gap-2 h-14 md:h-16 px-10 md:px-12 rounded-full bg-[#00FF57] text-black font-black text-[17px] transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_12px_24px_-8px_rgba(0,255,87,0.5)] group"
                            >
                                <Play className="w-6 h-6 fill-black shrink-0 group-hover:scale-110 transition-transform" />
                                Xem Ngay
                            </Link>
                            <Link
                                href={`/phim/${movie.slug}`}
                                className="flex items-center justify-center gap-2 h-14 md:h-16 px-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-[16px] transition-all hover:scale-105 active:scale-95 backdrop-blur-md shadow-xl"
                            >
                                <Info className="w-6 h-6" />
                                <span className="hidden sm:inline">Thông Tin</span>
                                <span className="sm:hidden">Thông Tin</span>
                            </Link>
                            <div className="h-14 w-14 md:h-16 md:w-16 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all hover:scale-110 cursor-pointer backdrop-blur-md shadow-xl group">
                                <FavoriteButton movieData={getFavoriteData(movie)} size="md" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right/Bottom Thumbnail Navigation (VieON Cinematic Style) */}
                {movies.length > 1 && (
                    <div className="absolute bottom-6 right-6 lg:bottom-10 lg:right-12 z-[4] flex items-center gap-3 pointer-events-auto">
                        <div className="hidden lg:flex items-center gap-1.5 mr-2">
                            <button
                                onClick={prev}
                                className="w-10 h-10 rounded-full bg-[#0a0a0a]/50 hover:bg-white hover:text-black border border-white/10 hover:border-white flex items-center justify-center text-white/70 transition-all duration-300 backdrop-blur-md"
                                aria-label="Trước"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={next}
                                className="w-10 h-10 rounded-full bg-[#0a0a0a]/50 hover:bg-white hover:text-black border border-white/10 hover:border-white flex items-center justify-center text-white/70 transition-all duration-300 backdrop-blur-md"
                                aria-label="Tiếp"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        {movies.map((m: any, idx) => {
                            const isActive = idx === index;
                            return (
                                <div
                                    key={`thumb-${m._id || idx}`}
                                    onClick={() => go(idx)}
                                    className={cn(
                                        "relative w-[130px] lg:w-[160px] aspect-[16/9] rounded-lg overflow-hidden cursor-pointer flex-shrink-0 transition-all duration-500 box-border group",
                                        isActive 
                                            ? "ring-2 ring-white scale-100 opacity-100 shadow-[0_4px_20px_rgba(0,0,0,0.8)]" 
                                            : "ring-1 ring-white/10 scale-[0.92] opacity-50 hover:opacity-80 hover:scale-95"
                                    )}
                                >
                                    <Image
                                        src={getHeroImage(m, "backdrop", "mobile")}
                                        alt={decodeHtml(m.name)}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                                        sizes="180px"
                                        placeholder="blur"
                                        blurDataURL={blurData}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function HeroSection({ movies }: { movies: Movie[] }) {
    if (!movies || movies.length === 0) return null;
    const heroMovies = movies.slice(0, 5);

    return (
        <div className="relative w-full bg-transparent font-sans" style={{ contain: "layout style paint" }}>
            {/* Mobile View */}
            <div className="md:hidden">
                <MobileHero movies={heroMovies} />
            </div>
            {/* Desktop View */}
            <div className="hidden md:block">
                <DesktopHero movies={heroMovies} />
            </div>
        </div>
    );
}
