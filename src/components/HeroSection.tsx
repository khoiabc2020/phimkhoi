"use client";

import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import Link from "next/link";
import { Play, ChevronRight, Info } from "lucide-react";
import { Movie } from "@/services/api";
import { getImageUrl, decodeHtml, cn } from "@/lib/utils";
import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import FavoriteButton from "./FavoriteButton";

function useMediaQuery(query: string) {
    return useSyncExternalStore(
        (cb) => {
            if (typeof window === "undefined") return () => { };
            const mql = window.matchMedia(query);
            const onChange = () => cb();
            if (mql.addEventListener) {
                mql.addEventListener("change", onChange);
            } else if (mql.addListener) {
                mql.addListener(onChange);
            }
            return () => {
                if (mql.removeEventListener) {
                    mql.removeEventListener("change", onChange);
                } else if (mql.removeListener) {
                    mql.removeListener(onChange);
                }
            };
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
    const q = String(quality).trim();
    const upper = q.toUpperCase();
    if (upper.includes("FULL") && upper.includes("HD")) return "FHD";
    if (upper === "FULLHD") return "FHD";
    if (upper.includes("BLURAY")) return "BR";
    if (upper.includes("WEB-DL") || upper.includes("WEBDL")) return "WEB";
    if (upper === "FHD" || upper === "HD" || upper === "4K" || upper === "CAM") return upper;
    return q.length > 6 ? q.slice(0, 6) : q;
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
    const p = path.startsWith("/") ? path : `/${path}`;
    return `https://image.tmdb.org/t/p/${size}${p}`;
}

function getHeroImage(movie: any, type: "poster" | "backdrop", variant: "mobile" | "desktop") {
    const tmdbData = movie?.tmdbData;
    if (tmdbData) {
        if (type === "poster" && tmdbData.poster_path) {
            return tmdbImage(tmdbData.poster_path, variant === "desktop" ? "w500" : "w342");
        }
        if (type === "backdrop" && tmdbData.backdrop_path) {
            return tmdbImage(tmdbData.backdrop_path, variant === "desktop" ? "w1280" : "w780");
        }
    }
    const apiPath = type === "backdrop" ? movie.thumb_url || movie.poster_url : movie.poster_url || movie.thumb_url;
    return apiPath ? getImageUrl(apiPath) : "/placeholder.jpg";
}

function MobileHero({
    movies,
    selectedIndex,
    setSelectedIndex,
}: {
    movies: Movie[];
    selectedIndex: number;
    setSelectedIndex: (i: number) => void;
}) {
    const [mobileRef, mobileApi] = useEmblaCarousel({
        loop: true,
        align: "center",
        containScroll: "trimSnaps",
        dragFree: false,
        duration: 28,
    });

    useEffect(() => {
        if (!mobileApi) return undefined;
        const onSelect = () => setSelectedIndex(mobileApi.selectedScrollSnap());
        mobileApi.on("select", onSelect);
        return () => {
            mobileApi.off("select", onSelect);
        };
    }, [mobileApi, setSelectedIndex]);

    const scrollTo = useCallback((index: number) => mobileApi?.scrollTo(index), [mobileApi]);

    return (
        <div className="relative w-full bg-transparent" ref={mobileRef} style={{ contain: "layout paint" }}>
            <div className="flex flex-row touch-pan-y" style={{ contain: "layout" }}>
                {movies.map((movie: any, index) => {
                    const posterImg = getHeroImage(movie, "poster", "mobile");
                    const backdropImg = getHeroImage(movie, "backdrop", "mobile");
                    const rating = movie.tmdbData?.vote_average ? movie.tmdbData.vote_average.toFixed(1) : null;

                    return (
                        <div
                            key={movie._id || movie.slug || index}
                            className="relative flex-[0_0_100%] min-w-0 flex flex-col transition-opacity duration-300"
                        >
                            <div className="relative w-full h-[200px] sm:h-[260px] shrink-0 overflow-hidden">
                                <Image
                                    src={backdropImg}
                                    alt={decodeHtml(movie.name)}
                                    fill
                                    className="object-cover object-top"
                                    priority={index === 0}
                                    loading={index === 0 ? "eager" : "lazy"}
                                    sizes="100vw"
                                    placeholder="blur"
                                    blurDataURL={blurData}
                                    unoptimized
                                    decoding="async"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/70 via-[#020617]/20 to-transparent" />
                                <Link
                                    href={`/phim/${movie.slug}`}
                                    className="absolute bottom-3 left-3 w-[72px] h-[100px] rounded-xl overflow-hidden shadow-xl ring-1 ring-white/15 shrink-0"
                                >
                                    <Image
                                        src={posterImg}
                                        alt=""
                                        fill
                                        className="object-cover"
                                        sizes="80px"
                                        placeholder="blur"
                                        blurDataURL={blurData}
                                        unoptimized
                                        loading={index === 0 ? "eager" : "lazy"}
                                        decoding="async"
                                    />
                                </Link>

                                <div className="absolute bottom-3 right-3 flex flex-col items-end gap-1.5 z-40">
                                    {movie.quality && (
                                        <span className="bg-[#F4C84A] text-black text-[10px] font-black px-2 py-0.5 rounded shadow-sm tracking-wide max-w-[64px] truncate">
                                            {formatQualityLabel(movie.quality) || movie.quality}
                                        </span>
                                    )}
                                    {rating && (
                                        <span className="bg-black/70 text-[#F4C84A] text-[10px] font-bold px-2 py-0.5 rounded">
                                            ★ {rating}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="px-4 pt-2 pb-6 flex flex-col gap-2">
                                <div className="pl-[84px]">
                                    <h1 className="text-[17px] font-black text-white leading-snug line-clamp-2">
                                        {decodeHtml(movie.name)}
                                    </h1>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        {movie.year && <span className="text-[11px] text-gray-400">{movie.year}</span>}
                                        {movie.category?.slice(0, 2).map((c: { id?: string; name?: string }) => (
                                            <span key={c.id || c.name} className="text-[11px] text-gray-500">
                                                · {c.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mt-1">
                                    <Link
                                        href={`/xem-phim/${movie.slug}?autoPlay=true`}
                                        className="flex flex-1 items-center justify-center gap-2 h-11 rounded-full bg-[#F4C84A] text-black font-extrabold active:scale-[0.98] transition-transform duration-150"
                                    >
                                        <Play className="w-4 h-4 fill-black shrink-0" />
                                        <span className="text-[13px]">Xem ngay</span>
                                    </Link>

                                    <Link
                                        href={`/phim/${movie.slug}`}
                                        className="w-11 h-11 flex items-center justify-center rounded-full bg-white/10 border border-white/15 active:scale-[0.98] transition-transform duration-150 shrink-0"
                                    >
                                        <Info className="w-4 h-4 text-white shrink-0" />
                                    </Link>

                                    <div className="w-11 h-11 flex items-center justify-center rounded-full bg-white/10 border border-white/15 active:scale-[0.98] transition-transform duration-150 shrink-0">
                                        <FavoriteButton movieData={getFavoriteData(movie)} size="sm" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-center gap-1.5 pb-4 pt-2 shrink-0">
                {movies.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => scrollTo(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 ease-out ${i === selectedIndex ? "w-5 bg-[#F4C84A]" : "w-1.5 bg-white/20"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}

function DesktopHero({
    movies,
    selectedIndex,
    setSelectedIndex,
}: {
    movies: Movie[];
    selectedIndex: number;
    setSelectedIndex: (i: number) => void;
}) {
    const [desktopRef, desktopApi] = useEmblaCarousel({ loop: true, duration: 45 });

    useEffect(() => {
        if (!desktopApi) return undefined;
        const onSelect = () => setSelectedIndex(desktopApi.selectedScrollSnap());
        desktopApi.on("select", onSelect);
        return () => {
            desktopApi.off("select", onSelect);
        };
    }, [desktopApi, setSelectedIndex]);

    const scrollTo = useCallback((index: number) => desktopApi?.scrollTo(index), [desktopApi]);
    const scrollNext = useCallback(() => desktopApi?.scrollNext(), [desktopApi]);
    const scrollPrev = useCallback(() => desktopApi?.scrollPrev(), [desktopApi]);

    return (
        <div className="relative w-full h-[55vh] lg:h-[70vh] xl:h-screen overflow-hidden" style={{ contain: "layout style paint" }}>
            <div className="absolute inset-0 h-full" ref={desktopRef} style={{ contain: "layout" }}>
                <div className="flex h-full touch-pan-y" style={{ contain: "layout" }}>
                    {movies.map((movie: any, index) => {
                        const posterImg = getHeroImage(movie, "poster", "desktop");
                        const backdropImg = getHeroImage(movie, "backdrop", "desktop");

                        return (
                            <div
                                key={movie._id || movie.slug || index}
                                className="relative flex-[0_0_100%] min-w-0 h-full bg-transparent overflow-hidden"
                            >
                                <div className="absolute inset-0 z-0 select-none">
                                    <div className="absolute inset-0 bg-black/25 z-10 pointer-events-none" />
                                    <Image
                                        src={backdropImg}
                                        alt="bg"
                                        fill
                                        className="object-cover opacity-80 transition-opacity duration-300 ease-out"
                                        priority={index === 0}
                                        loading={index === 0 ? "eager" : "lazy"}
                                        unoptimized
                                        sizes="100vw"
                                        placeholder={index === 0 ? "empty" : "blur"}
                                        blurDataURL={index === 0 ? undefined : blurData}
                                        decoding="async"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/60 via-[#020617]/20 to-transparent z-20 w-2/3 pointer-events-none" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/45 via-transparent to-transparent z-20 h-1/2 bottom-0 top-auto pointer-events-none" />
                                </div>

                                <div className="relative z-30 h-full container max-w-[1600px] mx-auto px-6 md:px-12 lg:px-24 xl:px-32 flex items-center">
                                    <div className="grid grid-cols-12 gap-6 md:gap-8 lg:gap-12 w-full items-center mt-12 md:mt-16">
                                        <div className="col-span-12 md:col-span-8 lg:col-span-7 xl:col-span-6 space-y-6 lg:space-y-8">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <span className="px-3 py-1 rounded bg-[#F4C84A] text-black text-xs font-bold tracking-wider uppercase">
                                                    Phim Hot
                                                </span>
                                                {movie.year && (
                                                    <span className="px-3 py-1 rounded border border-white/20 bg-white/5 text-white text-xs font-semibold">
                                                        {movie.year}
                                                    </span>
                                                )}
                                                {movie.quality && (
                                                    <span className="px-3 py-1 rounded border border-[#F4C84A]/50 bg-[#F4C84A]/10 text-[#F4C84A] text-xs font-bold border-glow-accent">
                                                        {formatQualityLabel(movie.quality) || movie.quality}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1 text-white/80 text-xs font-medium">
                                                    <span className="text-[#F4C84A]">★</span> {movie.tmdbData?.vote_average?.toFixed(1) || "N/A"}
                                                </span>
                                            </div>

                                            <h1
                                                className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight drop-shadow-2xl line-clamp-2 lg:line-clamp-3 mb-3 px-1"
                                                title={decodeHtml(movie.name)}
                                            >
                                                {decodeHtml(movie.name)}
                                            </h1>

                                            <div className="flex items-center gap-4 mb-5 flex-wrap">
                                                {movie.origin_name && (
                                                    <h2
                                                        className="text-[16px] text-[#F4C84A] font-medium tracking-wide opacity-90 truncate max-w-[200px] sm:max-w-xs"
                                                        title={decodeHtml(movie.origin_name)}
                                                    >
                                                        {decodeHtml(movie.origin_name)}
                                                    </h2>
                                                )}
                                                <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                                <div className="flex gap-3 flex-wrap">
                                                    {movie.category?.slice(0, 3).map((c: any) => (
                                                        <span
                                                            key={c.id || c.name}
                                                            className="text-white/80 hover:text-[#F4C84A] transition-colors cursor-pointer text-xs font-semibold uppercase tracking-wider"
                                                        >
                                                            {c.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <p className="text-white/70 text-sm md:text-base leading-relaxed line-clamp-3 font-normal max-w-2xl text-shadow-sm">
                                                {decodeHtml(stripHtml(movie.content || ""))}
                                            </p>

                                            <div className="flex flex-wrap items-center gap-3 p-[6px] glass-pill w-fit mt-4">
                                                <Link
                                                    href={`/xem-phim/${movie.slug}?autoPlay=true`}
                                                    className="group relative flex items-center justify-center gap-2 h-12 px-6 sm:px-8 rounded-full bg-[#F4C84A] hover:bg-[#ffe58a] text-black font-extrabold text-[15px] transition-all duration-200 hover:scale-105 active:scale-95"
                                                >
                                                    <Play className="w-5 h-5 fill-black shrink-0" />
                                                    <span className="whitespace-nowrap">Xem Ngay</span>
                                                </Link>

                                                <Link
                                                    href={`/phim/${movie.slug}`}
                                                    className="flex items-center justify-center gap-2 h-12 px-5 sm:px-6 rounded-full glass hover:bg-white/15 border border-white/10 text-white font-bold text-[15px] transition-all hover:scale-105 active:scale-95 group/info"
                                                >
                                                    <Info className="w-5 h-5 text-white/80 group-hover/info:text-[#F4C84A] transition-colors shrink-0" />
                                                    <span className="hidden sm:inline whitespace-nowrap">Chi tiết</span>
                                                </Link>

                                                <div className="h-12 w-12 flex items-center justify-center rounded-full glass hover:bg-white/15 border border-white/10 transition-all hover:scale-110 cursor-pointer shrink-0">
                                                    <FavoriteButton movieData={getFavoriteData(movie)} size="md" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-span-12 md:col-span-4 lg:col-span-5 xl:col-span-6 hidden md:flex justify-end lg:justify-center xl:justify-end pr-0 lg:pr-8 xl:pr-16">
                                            <div className="relative w-[240px] lg:w-[300px] xl:w-[360px] aspect-[2/3] rounded-[24px] lg:rounded-[32px] overflow-hidden ring-1 ring-white/10 group/poster transition-transform duration-200 ease-out hover:scale-[1.02] z-30 shrink-0 shadow-2xl">
                                                <Image
                                                    src={posterImg}
                                                    alt={decodeHtml(movie.name)}
                                                    fill
                                                    className="object-cover transition-transform duration-200 ease-out group-hover/poster:scale-105"
                                                    priority={index === 0}
                                                    loading={index === 0 ? "eager" : "lazy"}
                                                    unoptimized
                                                    sizes="(min-width: 1280px) 360px, (min-width: 1024px) 300px, 240px"
                                                    placeholder="blur"
                                                    blurDataURL={blurData}
                                                    decoding="async"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <button
                onClick={scrollPrev}
                className="absolute left-8 top-1/2 -translate-y-1/2 z-50 w-16 h-16 rounded-full glass flex items-center justify-center text-white/40 hover:text-black hover:bg-[#F4C84A] hover:border-[#F4C84A] transition-all duration-200 group"
            >
                <ChevronRight className="w-8 h-8 rotate-180" />
            </button>
            <button
                onClick={scrollNext}
                className="absolute right-8 top-1/2 -translate-y-1/2 z-50 w-16 h-16 rounded-full glass flex items-center justify-center text-white/40 hover:text-black hover:bg-[#F4C84A] hover:border-[#F4C84A] transition-all duration-200 group"
            >
                <ChevronRight className="w-8 h-8" />
            </button>

            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 flex gap-4">
                {movies.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => scrollTo(idx)}
                        className={cn(
                            "h-2 rounded-full transition-all duration-500 ease-out",
                            idx === selectedIndex ? "w-12 bg-[#F4C84A]" : "w-2 bg-white/20 hover:bg-white/50"
                        )}
                    />
                ))}
            </div>
        </div>
    );
}

export default function HeroSection({ movies }: { movies: Movie[] }) {
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const [selectedIndex, setSelectedIndex] = useState(0);

    if (!movies || movies.length === 0) return null;

    // Giới hạn 5 slide để giảm lượng DOM + ảnh + CPU tính toán tối đa
    const heroMovies = movies.slice(0, 5);

    return (
        <div className="relative w-full h-auto bg-transparent overflow-hidden flex flex-col font-sans" style={{ contain: "layout style paint" }}>
            {isDesktop ? (
                <DesktopHero movies={heroMovies} selectedIndex={selectedIndex} setSelectedIndex={setSelectedIndex} />
            ) : (
                <MobileHero movies={heroMovies} selectedIndex={selectedIndex} setSelectedIndex={setSelectedIndex} />
            )}
        </div>
    );
}
