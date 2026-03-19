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
                        i === active ? "w-7 h-1.5 bg-[#E50914]" : "w-1.5 h-1.5 bg-white/30 hover:bg-white/60"
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
            className="relative w-full select-none"
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
                            <div className="relative w-full h-[260px] sm:h-[330px] overflow-hidden bg-[#0a0a0a]">
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
                                    {m.quality && (
                                        <span className="bg-[#263243] border border-[#33455F] text-[#d8e3f2] text-[9px] font-black px-2 py-0.5 rounded tracking-wider shadow-md">
                                            {formatQualityLabel(m.quality) || m.quality}
                                        </span>
                                    )}
                                    {m.tmdbData?.vote_average && (
                                        <span className="bg-black/70 backdrop-blur-sm text-[#c7d7ea] text-[9px] font-bold px-2 py-0.5 rounded border border-white/10">
                                            ★ {m.tmdbData.vote_average.toFixed(1)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Poster Stack always on top */}
                <div className="absolute bottom-3 left-3 z-20 w-[68px] h-[96px] rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/10">
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
                                    sizes="72px"
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
                <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-4">
                    <div className="pl-[80px]">
                        <h1
                            key={`m-title-${index}`}
                            className="text-[17px] font-black text-white leading-snug line-clamp-2 drop-shadow-[0_2px_14px_rgba(0,0,0,0.75)] animate-hero-in"
                        >
                            {decodeHtml(movie.name)}
                        </h1>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {movie.year && <span className="text-[11px] text-white/75">{movie.year}</span>}
                            {movie.category?.slice(0, 2).map((c: any) => (
                                <span key={c.id || c.name} className="text-[11px] text-white/65">· {c.name}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Content below ── */}
            <div className="px-4 pt-2 pb-2">
                <div className="pl-[80px] min-h-[8px]" />

                {/* Buttons */}
                <div className="flex items-center gap-2 mt-3">
                    <Link
                        href={`/xem-phim/${movie.slug}?autoPlay=true`}
                        className="flex flex-1 items-center justify-center gap-1.5 h-10 rounded-full bg-[#E50914] text-[#0a0a0a] font-black text-[14px] active:scale-[0.97] hover:scale-105 transition-all shadow-[0_4px_20px_rgba(229,9,20,0.4)] hover:shadow-[0_6px_28px_rgba(229,9,20,0.6)]"
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
            className="relative w-full h-[76vh] lg:h-[92vh] xl:h-[104vh] overflow-hidden bg-[#0a0a0a]"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            {/* ── Crossfade backdrop stack ── */}
            {movies.map((m: any, i) => {
                const bg = getHeroImage(m, "backdrop", "desktop");
                const isActive = i === index;
                return (
                    <div
                        key={`bg-${m._id || i}`}
                        className={cn(
                            "absolute inset-0 transition-opacity duration-800 ease-in-out will-change-[opacity]",
                            isActive ? "opacity-100 z-[1]" : "opacity-0 z-0"
                        )}
                        aria-hidden={!isActive}
                    >
                        <Image
                            src={bg}
                            alt=""
                            fill
                            className="object-cover object-[66%_18%] opacity-[0.32] scale-[1.06] blur-2xl"
                            priority={isActive && i < 2}
                            loading={isActive ? "eager" : "lazy"}
                            sizes="100vw"
                            placeholder="blur"
                            blurDataURL={blurData}
                            decoding="async"
                        />
                        <Image
                            src={bg}
                            alt=""
                            fill
                            className="object-cover object-[66%_18%] opacity-[0.94]"
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
            <div className="absolute inset-0 z-[2] pointer-events-none">
                {/* Left text readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/95 via-[#0a0a0a]/62 to-transparent" />
                {/* Bottom blend into page */}
                <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent" />
                {/* Top subtle vignette */}
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#0a0a0a]/42 to-transparent" />
            </div>

            {/* ── Content ── */}
            <div className="relative z-[3] h-full container max-w-[1920px] mx-auto px-6 md:px-12 lg:px-20 xl:px-28 flex items-end pb-16 md:pb-20 lg:pb-24">
                <div className="grid grid-cols-12 gap-8 lg:gap-12 w-full items-end">

                    {/* Left: Text block */}
                    <div className="col-span-12 md:col-span-8 lg:col-span-7 xl:col-span-6 space-y-4 lg:space-y-5">
                        {/* Tags */}
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded bg-[#263243] border border-[#33455F] text-[#d8e3f2] text-[11px] font-black tracking-widest uppercase">
                                Hot
                            </span>
                            {movie.year && (
                                <span className="px-2.5 py-0.5 rounded border border-white/15 bg-white/[0.06] text-white/80 text-[11px] font-semibold">
                                    {movie.year}
                                </span>
                            )}
                            {movie.quality && (
                                <span className="px-2.5 py-0.5 rounded border border-[#33455F] bg-[#263243]/80 text-[#d8e3f2] text-[11px] font-bold">
                                    {formatQualityLabel(movie.quality) || movie.quality}
                                </span>
                            )}
                            {movie.tmdbData?.vote_average && (
                                <span className="flex items-center gap-1 text-white/70 text-[11px]">
                                    <span className="text-[#E50914]">★</span>
                                    {movie.tmdbData.vote_average.toFixed(1)}
                                </span>
                            )}
                        </div>

                        {/* Title — key triggers re-animation on slide change */}
                        <h1
                            key={`title-${index}`}
                            className="font-display text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-white leading-[1.12] tracking-[-0.015em] line-clamp-2 pt-1 animate-hero-in"
                            title={decodeHtml(movie.name)}
                        >
                            {decodeHtml(movie.name)}
                        </h1>

                        {/* Origin + Genre chips + Country + Episode */}
                        <div
                            key={`meta-${index}`}
                            className="flex items-center gap-2 flex-wrap animate-hero-in animation-delay-100"
                        >
                            {movie.origin_name && (
                                <span className="text-[#c7d7ea] text-sm font-medium opacity-90 truncate max-w-[240px]">
                                    {decodeHtml(movie.origin_name)}
                                </span>
                            )}
                            {movie.country?.[0] && (
                                <span className="text-white/40 text-xs">
                                    · {movie.country[0].name}
                                </span>
                            )}
                            {movie.time && (
                                <span className="text-white/40 text-xs">
                                    · {movie.time}
                                </span>
                            )}
                            {/* Clickable genre chips */}
                            {movie.category?.slice(0, 4).map((c: any) => (
                                <Link
                                    key={c.id || c.name}
                                    href={`/the-loai/${c.slug}`}
                                    className="text-[11px] text-white/60 hover:text-white border border-white/10 hover:border-white/30 px-2.5 py-0.5 rounded-full transition-all duration-150 hover:bg-white/10"
                                >
                                    {c.name}
                                </Link>
                            ))}
                        </div>

                        {/* Description */}
                        {movie.content && (
                            <p
                                key={`desc-${index}`}
                                className="text-white/60 text-sm leading-relaxed line-clamp-2 max-w-lg animate-hero-in animation-delay-150"
                            >
                                {decodeHtml(stripHtml(movie.content))}
                            </p>
                        )}

                        {/* Buttons */}
                        <div
                            key={`btns-${index}`}
                            className="flex flex-wrap items-center gap-3 animate-hero-in animation-delay-200"
                        >
                            <Link
                                href={`/xem-phim/${movie.slug}?autoPlay=true`}
                                className="flex items-center justify-center gap-2 h-12 px-8 rounded-full bg-[#E50914] text-[#0a0a0a] font-black text-[15px] transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_4px_24px_rgba(229,9,20,0.4)] hover:shadow-[0_8px_32px_rgba(229,9,20,0.6)]"
                            >
                                <Play className="w-4 h-4 fill-[#0a0a0a] shrink-0" />
                                Xem Ngay
                            </Link>
                            <Link
                                href={`/phim/${movie.slug}`}
                                className="flex items-center justify-center h-12 px-6 rounded-full bg-white/10 hover:bg-white/18 border border-white/15 text-white font-bold text-[15px] transition-all hover:scale-105 active:scale-95 backdrop-blur-sm"
                            >
                                <span className="hidden sm:inline">Chi Tiết</span>
                                <span className="sm:hidden">Chi Tiết</span>
                            </Link>
                            <div className="h-12 w-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/18 border border-white/15 transition-all hover:scale-110 cursor-pointer backdrop-blur-sm">
                                <FavoriteButton movieData={getFavoriteData(movie)} size="md" />
                            </div>
                        </div>

                        {/* Dots + nav */}
                        <div className="flex items-center gap-4 pt-1">
                            <Dots count={movies.length} active={index} onGo={go} />
                            {movies.length > 1 && (
                                <div className="flex items-center gap-2 ml-auto">
                                    <button
                                        onClick={prev}
                                        className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#263243] hover:text-[#d8e3f2] border border-white/10 flex items-center justify-center text-white/60 transition-all duration-200"
                                        aria-label="Trước"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={next}
                                        className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#263243] hover:text-[#d8e3f2] border border-white/10 flex items-center justify-center text-white/60 transition-all duration-200"
                                        aria-label="Tiếp"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Poster Stack (Preloaded) */}
                    <div className="col-span-12 md:col-span-4 lg:col-span-5 xl:col-span-6 hidden md:flex justify-end items-end pr-0 lg:pr-8 xl:pr-12">
                        <div className="relative w-[200px] lg:w-[260px] xl:w-[310px] aspect-[2/3] rounded-[10px] overflow-hidden ring-1 ring-white/10 shadow-[0_20px_42px_#00000088] group/poster transition-transform duration-200 ease-out animate-hero-in animation-delay-100">
                            {movies.map((m: any, i) => {
                                const isActive = i === index;
                                return (
                                    <div
                                        key={`poster-${m._id || i}`}
                                        className={cn(
                                            "absolute inset-0 transition-opacity duration-700 ease-in-out",
                                            isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                                        )}
                                        aria-hidden={!isActive}
                                    >
                                        <Image
                                            src={getHeroImage(m, "poster", "desktop")}
                                            alt={decodeHtml(m.name)}
                                            fill
                                            className="object-cover group-hover/poster:scale-[1.03] transition-transform duration-200 ease-out"
                                            priority={isActive && i < 2}
                                            loading={isActive ? "eager" : "lazy"}
                                            sizes="(min-width: 1280px) 310px, (min-width: 1024px) 260px, 200px"
                                            placeholder="blur"
                                            blurDataURL={blurData}
                                            decoding="async"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function HeroSection({ movies }: { movies: Movie[] }) {
    const isDesktop = useMediaQuery("(min-width: 768px)");

    if (!movies || movies.length === 0) return null;

    const heroMovies = movies.slice(0, 5);

    return (
        <div className="relative w-full bg-transparent font-sans mt-[50px] md:mt-0" style={{ contain: "layout style paint" }}>
            {isDesktop ? (
                <DesktopHero movies={heroMovies} />
            ) : (
                <MobileHero movies={heroMovies} />
            )}
        </div>
    );
}
