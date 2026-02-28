"use client";

import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import Link from "next/link";
import { Play, ChevronRight, Info } from "lucide-react";
import { Movie } from "@/services/api";
import { getImageUrl, decodeHtml, cn } from "@/lib/utils";
import { getTMDBDataForCard } from "@/app/actions/tmdb";
import { useState, useEffect, useCallback, useRef } from "react";
import FavoriteButton from "./FavoriteButton";

export default function HeroSection({ movies }: { movies: Movie[] }) {
    // Desktop: không dùng plugin Autoplay để có thể tắt khi tab ẩn → giảm lag
    // duration hơi lớn hơn mặc định để chuyển slide mượt hơn (không "giật")
    const [desktopRef, desktopApi] = useEmblaCarousel({ loop: true, duration: 45 });

    const [mobileRef, mobileApi] = useEmblaCarousel({
        loop: true,
        align: "center",
        containScroll: "trimSnaps",
        dragFree: false // Tắt dragFree để vuốt từng slide có điểm dừng rõ ràng
    });

    const [selectedIndex, setSelectedIndex] = useState(0);
    const [heroMoviesData, setHeroMoviesData] = useState<Record<string, { vote_average: number, backdrop_path?: string, poster_path?: string }>>({});
    const [tweenValues, setTweenValues] = useState<number[]>([]);
    const [isDesktop, setIsDesktop] = useState(false);

    // Embla Tween Scale Logic cho Mobile
    const tweenScale = useCallback(() => {
        if (!mobileApi) return;
        const engine = mobileApi.internalEngine();
        const scrollProgress = mobileApi.scrollProgress();
        const slidesInView = mobileApi.slidesInView();
        const isScrollEvent = mobileApi.scrollSnapList().length > 1;

        if (!isScrollEvent) return;

        const TWEEN_FACTOR = 0.9; // Slide bên sẽ thụt xuống 90% thay vì 85% để tránh lõm sâu

        const speeds = mobileApi.scrollSnapList().map((scrollSnap, index) => {
            let diffToTarget = scrollSnap - scrollProgress;
            if (engine.options.loop) {
                engine.slideLooper.loopPoints.forEach((loopItem) => {
                    const target = loopItem.target();
                    if (index === loopItem.index && target !== 0) {
                        const sign = Math.sign(target);
                        if (sign === -1) {
                            diffToTarget = scrollSnap - (1 + scrollProgress);
                        }
                        if (sign === 1) {
                            diffToTarget = scrollSnap + (1 - scrollProgress);
                        }
                    }
                });
            }

            const tweenValue = 1 - Math.abs(diffToTarget * 1.5);
            return Math.max(0, Math.min(Math.max(tweenValue, TWEEN_FACTOR), 1));
        });

        setTweenValues(speeds);
    }, [mobileApi]);

    // Sync Desktop: chỉ theo dõi slide hiện tại, KHÔNG autoplay để giảm CPU/giật trên desktop
    useEffect(() => {
        if (!desktopApi) return;
        const onSelect = () => setSelectedIndex(desktopApi.selectedScrollSnap());
        desktopApi.on("select", onSelect);
        return () => {
            desktopApi.off("select", onSelect);
        };
    }, [desktopApi]);

    // Sync Mobile — throttle scroll: cân bằng giữa mượt mà và CPU
    const throttleRef = useRef<number | null>(null);
    const lastTweenRef = useRef(0);
    // 30–35 lần/giây: mượt hơn nhiều so với 8fps nhưng vẫn nhẹ
    const THROTTLE_MS = 30;
    useEffect(() => {
        if (!mobileApi) return;
        tweenScale();
        const onScroll = () => {
            const now = Date.now();
            if (throttleRef.current !== null) return;
            if (now - lastTweenRef.current < THROTTLE_MS) {
                if (throttleRef.current === null) {
                    throttleRef.current = window.setTimeout(() => {
                        throttleRef.current = null;
                        lastTweenRef.current = Date.now();
                        tweenScale();
                    }, THROTTLE_MS - (now - lastTweenRef.current));
                }
                return;
            }
            lastTweenRef.current = now;
            requestAnimationFrame(tweenScale);
        };
        mobileApi.on("scroll", onScroll);
        mobileApi.on("reInit", tweenScale);

        const onSelect = () => setSelectedIndex(mobileApi.selectedScrollSnap());
        mobileApi.on("select", onSelect);
        return () => {
            if (throttleRef.current !== null) clearTimeout(throttleRef.current);
            mobileApi.off("select", onSelect);
            mobileApi.off("scroll", onScroll);
            mobileApi.off("reInit", tweenScale);
        };
    }, [mobileApi, tweenScale]);

    // Detect desktop (client-side) to avoid heavy TMDB enrichment on mobile
    useEffect(() => {
        if (typeof window === "undefined") return;
        const check = () => setIsDesktop(window.innerWidth >= 1024);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    // Hydrate TMDB (desktop only, số lượng = số slide hero để giảm request)
    useEffect(() => {
        if (!isDesktop) return;
        const fetchHeroData = async () => {
            const updates: Record<string, { vote_average: number, backdrop_path?: string, poster_path?: string }> = {};
            const toFetch = movies.slice(0, 8);
            await Promise.all(toFetch.map(async (movie) => {
                const CACHE_VERSION = 'v5_cinematic_hq';
                const cacheKey = `tmdb_hero_${CACHE_VERSION}_${movie.slug}`;
                const cached = sessionStorage.getItem(cacheKey);

                if (cached) {
                    updates[movie._id] = JSON.parse(cached);
                    return;
                }

                const year = movie.year ? parseInt(movie.year.toString().split("-")[0]) : undefined;
                let type: 'movie' | 'tv' = 'movie';
                if (movie.type === 'phim-bo' || movie.type === 'tv-shows' || movie.type === 'hoat-hinh') type = 'tv';

                const data = await getTMDBDataForCard(
                    movie.origin_name || movie.name,
                    isNaN(year!) ? undefined : year,
                    type,
                    { originalName: movie.origin_name, countrySlug: movie.country?.[0]?.slug }
                );

                if (data) {
                    const mappedData = {
                        vote_average: data.vote_average,
                        backdrop_path: data.backdrop_path,
                        poster_path: data.poster_path
                    };
                    updates[movie._id] = mappedData;
                    sessionStorage.setItem(cacheKey, JSON.stringify(mappedData));
                }
            }));
            setHeroMoviesData(prev => ({ ...prev, ...updates }));
        };
        if (movies?.length > 0) fetchHeroData();
    }, [movies, isDesktop]);

    const scrollTo = useCallback((index: number) => {
        if (desktopApi) desktopApi.scrollTo(index);
        if (mobileApi) mobileApi.scrollTo(index);
    }, [desktopApi, mobileApi]);

    const scrollNext = useCallback(() => {
        if (desktopApi) desktopApi.scrollNext();
        if (mobileApi) mobileApi.scrollNext();
    }, [desktopApi, mobileApi]);

    const scrollPrev = useCallback(() => {
        if (desktopApi) desktopApi.scrollPrev();
        if (mobileApi) mobileApi.scrollPrev();
    }, [desktopApi, mobileApi]);

    if (!movies || movies.length === 0) return null;

    const stripHtml = (html: string) => html ? html.replace(/<[^>]*>/g, '').trim() : "";
    // Giới hạn 8 slide để giảm DOM + ảnh + CPU (cuộn mượt hơn)
    const heroMovies = movies.slice(0, 8);
    const activeMovie = heroMovies[selectedIndex] || heroMovies[0];
    const activeTMDB = heroMoviesData[activeMovie._id];
    const activeRating = activeTMDB?.vote_average ? activeTMDB.vote_average.toFixed(1) : "N/A";

    const getFavoriteData = (movie: Movie) => ({
        movieId: movie._id,
        movieSlug: movie.slug,
        movieName: movie.name,
        movieOriginName: movie.origin_name,
        moviePoster: movie.poster_url || movie.thumb_url,
        movieYear: Number(movie.year) || new Date().getFullYear(),
        movieQuality: movie.quality || "HD",
        movieCategories: movie.category?.map(c => c.name) || [],
    });

    // Hero dùng poster/thumbnail từ API (TMDB khi đã match năm, hoặc nguồn PhimAPI). Fallback placeholder để không bao giờ slide đen.
    const getHeroImage = (movie: Movie, type: 'poster' | 'backdrop' = 'poster') => {
        const tmdbData = heroMoviesData[movie._id];
        if (tmdbData) {
            if (type === 'poster' && tmdbData.poster_path) {
                return `https://image.tmdb.org/t/p/original${tmdbData.poster_path}`;
            }
            if (type === 'backdrop' && tmdbData.backdrop_path) {
                return `https://image.tmdb.org/t/p/original${tmdbData.backdrop_path}`;
            }
        }
        const apiPath = type === 'backdrop' ? (movie.thumb_url || movie.poster_url) : (movie.poster_url || movie.thumb_url);
        return apiPath ? getImageUrl(apiPath) : "/placeholder.jpg";
    };

    return (
        <div className="relative w-full h-auto bg-[#0B0D12] overflow-hidden flex flex-col font-sans">

            {/* ================= TABLET & MOBILE LAYOUT (Portrait/Small Screens) ================= */}
            {/* Shows on < lg screens (approx < 1024px) */}
            <div className="lg:hidden relative w-full h-auto flex flex-col pt-6 pb-8 bg-[#0B0D12]" ref={mobileRef}>
                <div className="flex flex-row touch-pan-y h-auto">
                    {heroMovies.map((movie, index) => {
                        const posterImg = getHeroImage(movie, 'poster');
                        const rating = heroMoviesData[movie._id]?.vote_average ? heroMoviesData[movie._id].vote_average.toFixed(1) : "N/A";

                        const tweenValue = tweenValues.length ? tweenValues[index] : 1;
                        const posterOpacity = Math.min(1, Math.max(0.4, (tweenValue - 0.9) / 0.1));
                        const textOpacity = Math.max(0, Math.min(1, (tweenValue - 0.95) / 0.05));

                        return (
                            <div key={movie._id} className="relative flex-[0_0_72%] sm:flex-[0_0_58%] max-w-[260px] min-w-0 h-auto flex flex-col items-center pt-6">

                                {/* 1. Centered Poster with 3D Tween */}
                                <Link
                                    href={`/xem-phim/${movie.slug}`}
                                    className="relative w-[78%] max-w-[220px] mx-auto aspect-[2/3] mb-3 rounded-xl overflow-hidden shadow-lg ring-1 ring-white/5 shrink-0 transition-transform duration-300 ease-out"
                                    style={{
                                        transform: `scale(${tweenValue})`,
                                        opacity: posterOpacity
                                    }}
                                >
                                    <Image
                                        src={posterImg}
                                        alt={decodeHtml(movie.name)}
                                        fill
                                        className="object-cover"
                                        priority={index === 0}
                                        sizes="(max-width: 768px) 60vw, (max-width: 1200px) 30vw, 20vw"
                                    />
                                </Link>

                                {/* 2. Vertically Stacked Movie Info */}
                                <div
                                    className="flex flex-col items-center w-[100%] text-center transition-all duration-300 ease-out mt-1 px-2"
                                    style={{
                                        opacity: textOpacity,
                                        transform: `translateY(${(1 - tweenValue) * 20}px)`,
                                        visibility: textOpacity <= 0 ? 'hidden' : 'visible'
                                    }}
                                >
                                    <h1 className="text-xl md:text-2xl font-black text-white leading-tight drop-shadow-lg line-clamp-2 tracking-tight mb-1">
                                        {decodeHtml(movie.name)}
                                    </h1>

                                    <h2 className="text-[13px] md:text-sm text-[#F4C84A] font-medium line-clamp-1 mb-3">
                                        {decodeHtml(movie.origin_name || "")}
                                    </h2>

                                    {/* Meta Row */}
                                    <div className="flex items-center justify-center gap-2 mb-3">
                                        {movie.year && (
                                            <span className="bg-white/10 px-3 py-1 rounded-md text-sm font-bold text-white border border-white/10">{movie.year}</span>
                                        )}
                                        <span className="bg-white/10 px-2.5 py-1 rounded-md text-xs font-bold text-[#F4C84A] border border-white/10 flex items-center gap-1">
                                            ★ {rating}
                                        </span>
                                        {movie.quality && (
                                            <span className="bg-[#F4C84A]/10 text-[#F4C84A] px-2.5 py-1 rounded-md text-xs font-bold border border-[#F4C84A]/40">{movie.quality}</span>
                                        )}
                                    </div>

                                    {/* Genres */}
                                    <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                                        {movie.category?.slice(0, 3).map(c => (
                                            <span key={c.id} className="text-xs font-semibold text-white/80 px-4 py-1.5 rounded-full bg-black/40 border border-white/10">
                                                {c.name}
                                            </span>
                                        ))}
                                    </div>

                                    {/* CTA Buttons */}
                                    <div className="flex items-center justify-center gap-3 w-full px-2">
                                        <Link
                                            href={`/xem-phim/${movie.slug}?autoPlay=true`}
                                            className="flex flex-1 max-w-[150px] items-center justify-center gap-2 h-11 rounded-full bg-[#F4C84A] text-black font-extrabold shadow-md hover:scale-105 active:scale-95 transition-transform"
                                        >
                                            <Play className="w-4 h-4 fill-black" />
                                            <span className="text-[14px]">Xem</span>
                                        </Link>

                                        <Link
                                            href={`/phim/${movie.slug}`}
                                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 border border-white/15 active:scale-95 transition-transform"
                                        >
                                            <Info className="w-5 h-5 text-white" />
                                        </Link>

                                        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 border border-white/15 active:scale-95 transition-transform">
                                            <FavoriteButton movieData={getFavoriteData(movie)} size="sm" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ================= DESKTOP LAYOUT (Large Screens) ================= */}
            {/* Shows on lg screens (approx >= 1024px) */}
            <div className="hidden lg:block relative w-full h-[60vh] lg:h-[70vh] xl:h-screen">
                <div className="absolute inset-0 h-full" ref={desktopRef}>
                    <div className="flex h-full touch-pan-y">
                        {heroMovies.map((movie, index) => {
                            const posterImg = getHeroImage(movie, 'poster');
                            const backdropImg = getHeroImage(movie, 'backdrop');

                            return (
                                <div key={movie._id} className="relative flex-[0_0_100%] min-w-0 h-full bg-[#0B0D12] overflow-hidden">

                                    {/* 1. Cinematic Background */}
                                    <div className="absolute inset-0 z-0 select-none">
                                        <div className="absolute inset-0 bg-black/50 z-10" /> {/* Tối giản màu nền Darken */}
                                        <Image
                                            src={backdropImg}
                                            alt="bg"
                                            fill
                                            className="object-cover opacity-60"
                                            priority={index === 0}
                                        />
                                        {/* Vignettes for focus */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0D12] via-[#0B0D12]/80 to-transparent z-20 w-2/3" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D12] via-transparent to-transparent z-20 h-1/2 bottom-0 top-auto" />
                                    </div>

                                    {/* 2. Content Container */}
                                    <div className="relative z-30 h-full container max-w-[1600px] mx-auto px-8 lg:px-24 xl:px-32 flex items-center">
                                        <div className="grid grid-cols-12 gap-12 w-full items-center mt-16">

                                            {/* Left: Info — rút ngắn animation để giảm lag desktop */}
                                            <div className="col-span-12 xl:col-span-5 lg:col-span-6 space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">

                                                {/* Meta Badges */}
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <span className="px-3 py-1 rounded bg-[#F4C84A] text-black text-xs font-bold tracking-wider uppercase">
                                                        Phim Hot
                                                    </span>
                                                    <span className="px-3 py-1 rounded border border-white/20 bg-white/5 text-white text-xs font-semibold">
                                                        {movie.year}
                                                    </span>
                                                    <span className="px-3 py-1 rounded border border-[#F4C84A]/50 bg-[#F4C84A]/10 text-[#F4C84A] text-xs font-bold border-glow-accent">
                                                        {movie.quality}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-white/80 text-xs font-medium">
                                                        <span className="text-[#F4C84A]">★</span> {heroMoviesData[movie._id]?.vote_average?.toFixed(1) || "N/A"}
                                                    </span>
                                                </div>

                                                {/* Title */}
                                                <h1
                                                    className="text-lg md:text-xl font-bold text-white leading-tight tracking-tight drop-shadow-2xl line-clamp-2 mb-3 px-1"
                                                >
                                                    {decodeHtml(movie.name)}
                                                </h1>

                                                {/* Origin Name & Categories */}
                                                <div className="flex items-center gap-4 mb-5">
                                                    <h2 className="text-[16px] text-[#F4C84A] font-medium tracking-wide opacity-90">
                                                        {decodeHtml(movie.origin_name || "")}
                                                    </h2>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                                    <div className="flex gap-3">
                                                        {movie.category?.slice(0, 3).map(c => (
                                                            <span key={c.id} className="text-white/80 hover:text-[#F4C84A] transition-colors cursor-pointer text-xs font-semibold uppercase tracking-wider">
                                                                {c.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Description */}
                                                <p className="text-white/60 text-base leading-relaxed line-clamp-3 font-normal max-w-2xl text-shadow-sm">
                                                    {decodeHtml(stripHtml(movie.content || ""))}
                                                </p>

                                                {/* CTA Buttons - Liquid Glass Container (Desktop) */}
                                                <div className="flex items-center gap-3 p-[6px] rounded-full bg-[#1A1C23] border border-white/10 w-max mt-4">
                                                    <Link
                                                        href={`/xem-phim/${movie.slug}?autoPlay=true`}
                                                        className="group relative flex items-center justify-center gap-2 h-12 px-8 rounded-full bg-[#F4C84A] hover:bg-[#ffe58a] text-black font-extrabold text-[15px] transition-all duration-200 hover:scale-105 active:scale-95"
                                                    >
                                                        <Play className="w-5 h-5 fill-black" />
                                                        <span>Xem Ngay</span>
                                                    </Link>

                                                    <Link
                                                        href={`/phim/${movie.slug}`}
                                                        className="flex items-center justify-center gap-2 h-12 px-6 rounded-full glass hover:bg-white/15 border border-white/10 text-white font-bold text-[15px] transition-all hover:scale-105 active:scale-95 group/info"
                                                    >
                                                        <Info className="w-5 h-5 text-white/80 group-hover/info:text-[#F4C84A] transition-colors" />
                                                        <span>Chi tiết</span>
                                                    </Link>

                                                    <div className="h-12 w-12 flex items-center justify-center rounded-full glass hover:bg-white/15 border border-white/10 transition-all hover:scale-110 cursor-pointer">
                                                        <FavoriteButton movieData={getFavoriteData(movie)} size="md" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: 3D Tilt Poster Card */}
                                            {/* Only show on very large screens to maintain layout balance */}
                                            <div className="col-span-12 xl:col-span-7 lg:col-span-6 hidden lg:flex justify-end pr-8 xl:pr-16">
                                                <div className="relative w-[340px] xl:w-[400px] aspect-[2/3] rounded-[32px] overflow-hidden ring-1 ring-white/10 group/poster transition-transform duration-300 ease-out hover:scale-[1.02] z-30">
                                                    <Image
                                                        src={posterImg}
                                                        alt={decodeHtml(movie.name)}
                                                        fill
                                                        className="object-cover transition-transform duration-300 group-hover/poster:scale-105"
                                                        priority={index === 0}
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

                {/* Navigation Arrows (Desktop) */}
                <button onClick={scrollPrev} className="absolute left-8 top-1/2 -translate-y-1/2 z-50 w-16 h-16 rounded-full glass flex items-center justify-center text-white/40 hover:text-black hover:bg-[#F4C84A] hover:border-[#F4C84A] transition-all duration-200 group">
                    <ChevronRight className="w-8 h-8 rotate-180" />
                </button>
                <button onClick={scrollNext} className="absolute right-8 top-1/2 -translate-y-1/2 z-50 w-16 h-16 rounded-full glass flex items-center justify-center text-white/40 hover:text-black hover:bg-[#F4C84A] hover:border-[#F4C84A] transition-all duration-200 group">
                    <ChevronRight className="w-8 h-8" />
                </button>

                {/* Dots Indicator */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 flex gap-4">
                    {heroMovies.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => scrollTo(idx)}
                            className={cn(
                                "h-2 rounded-full transition-all duration-500 ease-out",
                                idx === selectedIndex
                                    ? "w-12 bg-[#F4C84A]"
                                    : "w-2 bg-white/20 hover:bg-white/50"
                            )}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
