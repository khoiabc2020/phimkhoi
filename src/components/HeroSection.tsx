"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { Movie } from "@/services/api";
import { getImageUrl, decodeHtml, cn } from "@/lib/utils";
import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from "react";
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
    const { index, go, next, prev } = useAutoplay(movies.length, 5500, !active);
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
            className="relative w-full select-none pt-2"
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
                                "absolute inset-0 transition-opacity duration-700 ease-in-out will-change-opacity",
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
                                    unoptimized={true}
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
                                        <span className="bg-black/40 border border-white/10 text-white/80 text-[9px] font-bold px-2 py-0.5 rounded tracking-wider shadow-md">
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
                                    unoptimized={true}
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
                        {movie.isCustomHero && movie.layer_logo ? (
                            <div key={`m-title-logo-${index}`} className="relative w-[180px] sm:w-[220px] h-[55px] sm:h-[70px] mb-1.5 animate-hero-in">
                                <Image
                                    src={movie.layer_logo}
                                    alt={decodeHtml(movie.name)}
                                    fill
                                    className="object-contain object-left-bottom drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]"
                                    unoptimized
                                    priority
                                />
                            </div>
                        ) : (
                            <h1
                                key={`m-title-${index}`}
                                className={cn(
                                    "font-display font-black text-white leading-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)] animate-hero-in tracking-tight pb-1",
                                    "text-balance line-clamp-2",
                                    movie.name.length > 30 ? "text-[16px] md:text-[20px]" : movie.name.length > 20 ? "text-[18px] md:text-[24px]" : "text-[22px] md:text-[28px]"
                                )}
                            >
                                {decodeHtml(movie.name)}
                            </h1>
                        )}
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
                <div className="flex items-center gap-2 mt-3 w-full pr-[102px]">
                    <Link
                        href={`/phim/${movie.slug}`}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#8FA7C5] hover:bg-[#a8bdd8] hover:-translate-y-0.5 text-[#0a0a0a] px-6 py-2.5 rounded-full font-bold text-[14px] transition-all duration-300"
                    >
                        <Play className="w-5 h-5 fill-current" />
                        <span>Xem Ngay</span>
                    </Link>
                    <WatchlistButton
                        slug={movie.slug}
                        className="w-10 h-10 rounded-full bg-white/8 border border-white/12 text-white active:scale-[0.97] transition-transform shrink-0"
                        showLabel={false}
                    />
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

function DesktopHero({ movies, active = true }: { movies: Movie[], active?: boolean }) {
    const [paused, setPaused] = useState(false);
    const { index, go, next, prev } = useAutoplay(movies.length, 6000, paused || !active);
    const movie = movies[index] as any;
    const navRef = useRef<HTMLDivElement>(null);

    const posterImg = getHeroImage(movie, "poster", "desktop");

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
            className="relative w-full h-[60vh] md:h-[58vh] lg:h-[70vh] xl:h-[82vh] overflow-hidden bg-[#0a0a0a]"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            {/* ── Crossfade backdrop stack (Cinematic Full Bleed) ── */}
            {movies.map((m: any, i) => {
                const bg = getHeroImage(m, "backdrop", "desktop");
                const character = m.isCustomHero ? getHeroImage(m, "character", "desktop") : null;
                const isActive = i === index;
                return (
                    <div
                        key={`bg-${m._id || i}`}
                        className={cn(
                            "absolute inset-0 transition-opacity duration-1000 ease-in-out will-change-[opacity,transform]",
                            isActive ? "opacity-100 z-[1]" : "opacity-0 z-0 pointer-events-none"
                        )}
                        aria-hidden={!isActive}
                    >
                        {/* Single Sharp Layer for Cinematic Feel (Background) */}
                        <Image
                            src={bg}
                            alt=""
                            fill
                            className={cn(
                                "object-cover object-[center_20%] opacity-100",
                                isActive ? "opacity-100" : "opacity-0"
                            )}
                            priority={isActive && i < 2}
                            loading={isActive ? "eager" : "lazy"}
                            sizes="100vw"
                            // CustomHero images are arbitrary URLs, so avoid local blur placeholder if it's external
                            placeholder={m.isCustomHero ? "empty" : "blur"}
                            blurDataURL={m.isCustomHero ? undefined : blurData}
                            unoptimized={true}
                            decoding="async"
                        />
                        
                        {/* Multi-layer Parallax: Character Overlay (If CustomHero) */}
                        {character && (
                            <div className="absolute inset-0 z-[1] pointer-events-none">
                                <Image
                                    src={character}
                                    alt=""
                                    fill
                                    className={cn(
                                        "object-cover object-[center_bottom]",
                                        isActive ? "opacity-100" : "opacity-0"
                                    )}
                                    priority={isActive && i < 2}
                                    sizes="100vw"
                                    unoptimized
                                />
                            </div>
                        )}
                    </div>
                );
            })}

            {/* ── Gradient overlays (always on top) ── */}
            <div className="absolute inset-0 z-[2] pointer-events-none transition-opacity duration-500">
                {/* Tone down the gradient to let the colorful backdrop shine, similar to Onflix */}
                <div className="absolute inset-y-0 left-0 w-[80%] lg:w-[60%] bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
                <div className="absolute inset-0 bg-[#0a0a0a]/20" />
                {/* Bottom blend into page */}
                <div className="absolute bottom-0 left-0 right-0 h-40 md:h-56 lg:h-72 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
            </div>

            {/* ── Content ── */}
            <div className="relative z-[3] h-full w-full max-w-[1920px] mx-auto px-6 md:px-10 lg:pl-32 lg:pr-12 xl:pl-[140px] flex items-end pb-12 md:pb-16 lg:pb-24 pointer-events-none">
                <div className="w-full flex justify-between items-end">
                    {/* Left: Text block */}
                    <div className="w-full md:w-[75%] lg:w-[65%] xl:w-[60%] space-y-3 lg:space-y-4 pointer-events-auto pr-0 lg:pr-[300px] xl:pr-[400px]">
                        
                        {/* Title — Optimized for Onflix aesthetic */}
                        {movie.isCustomHero && movie.layer_logo ? (
                            <div key={`title-logo-${index}`} className="relative w-full max-w-[400px] md:max-w-[500px] lg:max-w-[600px] h-[100px] md:h-[130px] lg:h-[160px] mb-4 animate-hero-in">
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
                                key={`title-${index}`}
                                className={cn(
                                    "font-display font-black text-white leading-tight tracking-tight pt-1 animate-hero-in drop-shadow-[0_8px_24px_rgba(0,0,0,0.9)] pb-2",
                                    "text-balance line-clamp-2 md:line-clamp-3",
                                    movie.name.length > 25 
                                        ? "text-2xl md:text-3xl lg:text-[40px] xl:text-[46px]" 
                                        : "text-3xl md:text-[32px] lg:text-[48px] xl:text-[54px]"
                                )}
                                title={decodeHtml(movie.name)}
                            >
                                {decodeHtml(movie.name)}
                            </h1>
                        )}

                        {/* Tags Row */}
                        <div className="flex flex-wrap items-center gap-3 lg:gap-4 transition-all duration-500 animate-hero-in animation-delay-100">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] bg-[#E50914] text-white text-[11px] lg:text-[12px] font-black uppercase tracking-wider shadow-[0_2px_10px_rgba(229,9,20,0.4)]">
                                TOP 10
                            </span>
                            
                            <div className="flex items-center gap-3 text-white/90 font-bold text-[14px] lg:text-[15px] drop-shadow-md">
                                {movie.year && <span>{movie.year}</span>}
                                {movie.country?.[0] && <span className="opacity-40">|</span>}
                                {movie.country?.[0] && <span>{movie.country[0].name}</span>}
                                {movie.episode_current && <span className="opacity-40">|</span>}
                                {movie.episode_current && <span>{movie.episode_current}</span>}
                            </div>
                        </div>

                        {/* Category Pills (Onflix Style) */}
                        <div key={`meta-${index}`} className="flex items-center gap-2 flex-wrap animate-hero-in animation-delay-150 pt-1">
                            {movie.category?.slice(0, 3).map((c: any) => (
                                <Link
                                    key={c.id || c.name}
                                    href={`/the-loai/${c.slug}`}
                                    className="text-[13px] font-semibold text-white/90 bg-white/5 border border-white/20 rounded-full px-4 py-1.5 hover:bg-white/20 transition-all duration-200"
                                >
                                    {c.name}
                                </Link>
                            ))}
                            {movie.quality && (
                                <span className="text-[13px] font-bold text-white/90 bg-transparent border border-white/40 rounded-full px-4 py-1.5 opacity-80">
                                    {formatQualityLabel(movie.quality) || movie.quality}
                                </span>
                            )}
                        </div>

                        {/* Description */}
                        {movie.content && (
                            <p
                                key={`desc-${index}`}
                                className="text-white/80 text-[14px] lg:text-[15px] xl:text-[16px] leading-[1.6] line-clamp-2 md:line-clamp-3 lg:line-clamp-2 xl:line-clamp-3 max-w-2xl animate-hero-in animation-delay-200 drop-shadow-md font-medium"
                            >
                                {decodeHtml(stripHtml(movie.content))}
                            </p>
                        )}

                        {/* Buttons */}
                        <div
                            key={`btns-${index}`}
                            className="flex flex-wrap items-center gap-4 pt-4 lg:pt-6 animate-hero-in animation-delay-300 pointer-events-auto"
                        >
                            <Link
                                href={`/phim/${movie.slug}`}
                                className="flex items-center justify-center gap-2 h-12 md:h-14 px-8 md:px-10 rounded-full bg-[#8FA7C5] text-[#0a0a0a] font-black text-[15px] lg:text-[16px] uppercase tracking-wide transition-all duration-300 hover:scale-105 active:scale-95 group"
                            >
                                <Play className="w-5 h-5 fill-[#0a0a0a] shrink-0 group-hover:scale-110 transition-transform" />
                                Xem Ngay
                            </Link>
                            <WatchlistButton
                                slug={movie.slug}
                                className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all hover:scale-110 active:scale-95 backdrop-blur-md shadow-xl flex items-center justify-center group"
                                showLabel={false}
                            />
                        </div>
                    </div>
                </div>

                {/* Right/Bottom Thumbnail Navigation (VieON Cinematic Style) */}
                {movies.length > 1 && (
                    <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 lg:bottom-10 lg:right-12 z-[4] flex items-center gap-3 pointer-events-auto max-w-[calc(100vw-32px)] md:max-w-[40vw] lg:max-w-[60vw]">
                        {/* Prev/Next buttons */}
                        <div className="hidden lg:flex items-center gap-1.5 shrink-0">
                            <button
                                onClick={prev}
                                className="w-8 h-8 flex items-center justify-center text-white hover:text-white transition-transform hover:scale-110 drop-shadow-xl"
                                aria-label="Trước"
                            >
                                <ChevronLeft className="w-8 h-8 md:w-10 md:h-10" />
                            </button>
                            <button
                                onClick={next}
                                className="w-8 h-8 flex items-center justify-center text-white hover:text-white transition-transform hover:scale-110 drop-shadow-xl"
                                aria-label="Tiếp"
                            >
                                <ChevronRight className="w-8 h-8 md:w-10 md:h-10" />
                            </button>
                        </div>

                        {/* Scrollable Container */}
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
                                            "relative w-[85px] md:w-[100px] lg:w-[115px] xl:w-[125px] aspect-[16/9] rounded-lg overflow-hidden cursor-pointer flex-shrink-0 transition-all duration-300 box-border group snap-center",
                                            isActive 
                                                ? "ring-[1.5px] ring-white scale-100 opacity-100 shadow-[0_4px_20px_rgba(0,0,0,0.8)] z-10" 
                                                : "ring-1 ring-white/10 scale-95 opacity-50 hover:opacity-100 hover:scale-[0.98] z-0"
                                        )}
                                    >
                                        <Image
                                            src={getHeroImage(m, "backdrop", "mobile")}
                                            alt={decodeHtml(m.name)}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                                            sizes="160px"
                                            placeholder="blur"
                                            blurDataURL={blurData}
                                            unoptimized={true}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function HeroSection({ movies }: { movies: Movie[] }) {
    const isDesktop = useMediaQuery("(min-width: 768px)");
    if (!movies || movies.length === 0) return null;
    const heroMovies = movies.slice(0, 10);

    return (
        <div className="relative w-full bg-transparent font-sans" style={{ contain: "layout style paint" }}>
            {/* Mobile View */}
            <div className="md:hidden">
                <MobileHero movies={heroMovies} active={!isDesktop} />
            </div>
            {/* Desktop View */}
            <div className="hidden md:block">
                <DesktopHero movies={heroMovies} active={isDesktop} />
            </div>
        </div>
    );
}
