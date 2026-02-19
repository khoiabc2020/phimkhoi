"use client";

import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import Link from "next/link";
import { Play, ChevronRight, Info } from "lucide-react";
import { Movie } from "@/services/api";
import { getImageUrl } from "@/lib/utils";
import { getTMDBDataForCard } from "@/app/actions/tmdb";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import FavoriteButton from "./FavoriteButton";
import Autoplay from "embla-carousel-autoplay";

export default function HeroSection({ movies }: { movies: Movie[] }) {
    // Desktop Carousel
    const [desktopRef, desktopApi] = useEmblaCarousel({ loop: true, duration: 40 }, [Autoplay({ delay: 8000 })]);

    // Mobile Carousel - iOS 26 Style (Wider cards, smoother snap)
    const [mobileRef, mobileApi] = useEmblaCarousel({
        loop: true,
        align: "center",
        containScroll: false,
        dragFree: false
    });

    const [selectedIndex, setSelectedIndex] = useState(0);
    const [heroMoviesData, setHeroMoviesData] = useState<Record<string, { vote_average: number, backdrop_path?: string, poster_path?: string }>>({});

    // Sync Desktop Carousel
    useEffect(() => {
        if (!desktopApi) return;
        const onSelect = () => setSelectedIndex(desktopApi.selectedScrollSnap());
        desktopApi.on("select", onSelect);
        return () => { desktopApi.off("select", onSelect); };
    }, [desktopApi]);

    // Sync Mobile Carousel
    useEffect(() => {
        if (!mobileApi) return;
        const onSelect = () => setSelectedIndex(mobileApi.selectedScrollSnap());
        mobileApi.on("select", onSelect);
        return () => { mobileApi.off("select", onSelect); };
    }, [mobileApi]);

    // Hydrate TMDB Data
    useEffect(() => {
        const fetchHeroData = async () => {
            const updates: Record<string, { vote_average: number, backdrop_path?: string, poster_path?: string }> = {};
            await Promise.all(movies.slice(0, 20).map(async (movie) => {
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
    }, [movies]);

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
    const heroMovies = movies.slice(0, 15);
    const activeMovie = heroMovies[selectedIndex] || heroMovies[0];
    const activeTMDB = heroMoviesData[activeMovie._id];
    const activeRating = activeTMDB?.vote_average ? activeTMDB.vote_average.toFixed(1) : "N/A";

    const getFavoriteData = (movie: Movie) => ({
        movieId: movie._id,
        movieSlug: movie.slug,
        movieName: movie.name,
        movieOriginName: movie.origin_name,
        moviePoster: movie.poster_url || movie.thumb_url,
        movieYear: movie.year,
        movieQuality: movie.quality,
        movieCategories: movie.category?.map(c => c.name) || [],
    });

    // Helper to get high-res image
    const getHeroImage = (movie: Movie, type: 'backdrop' | 'poster' = 'backdrop') => {
        const tmdbData = heroMoviesData[movie._id];
        if (type === 'backdrop' && tmdbData?.backdrop_path) {
            return `https://image.tmdb.org/t/p/original${tmdbData.backdrop_path}`;
        }
        if (type === 'poster' && tmdbData?.poster_path) {
            return `https://image.tmdb.org/t/p/original${tmdbData.poster_path}`;
        }
        return getImageUrl(movie.poster_url || movie.thumb_url);
    };

    return (
        <div className="relative w-full h-auto md:h-screen bg-[#0B0D12] overflow-hidden flex flex-col">

            {/* ================= MOBILE LAYOUT (iOS 26 Liquid Glass) ================= */}
            <div className="lg:hidden relative w-full min-h-[500px] h-[75vh] flex flex-col pt-0">

                {/* 1. Ambient Background (Blurred Color) */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <Image
                        src={getHeroImage(activeMovie, 'poster')}
                        alt="bg"
                        fill
                        className="object-cover blur-[50px] opacity-50 scale-125"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D12] via-[#0B0D12]/60 to-transparent" />
                </div>

                {/* 2. Poster & Content */}
                <div className="relative z-10 flex flex-col items-center justify-end h-full px-6 pb-20 text-center">

                    {/* Poster Card (Small 3D) */}
                    <Link href={`/xem-phim/${activeMovie.slug}`} className="relative w-[180px] aspect-[2/3] mb-8 rounded-2xl overflow-hidden shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)] ring-1 ring-white/20 animate-in fade-in zoom-in duration-700">
                        <Image
                            src={getHeroImage(activeMovie, 'poster')}
                            alt={activeMovie.name}
                            fill
                            className="object-cover"
                        />
                    </Link>

                    {/* Metadata */}
                    <div className="space-y-4 mb-6">
                        <h1 className="text-3xl font-black text-white leading-tight drop-shadow-xl text-glow">
                            {activeMovie.name}
                        </h1>
                        <div className="flex items-center justify-center gap-3 text-sm font-medium text-white/80">
                            <span>{activeMovie.year}</span>
                            <span className="w-1 h-1 rounded-full bg-white/40" />
                            <span className="text-[#F4C84A]">{activeRating} ★</span>
                            <span className="w-1 h-1 rounded-full bg-white/40" />
                            <span>{activeMovie.quality}</span>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2">
                            {activeMovie.category?.slice(0, 3).map(c => (
                                <span key={c.id} className="text-xs text-white/60 px-2 py-1 rounded-lg bg-white/5 border border-white/5">
                                    {c.name}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-4 pt-4">
                        <Link
                            href={`/xem-phim/${activeMovie.slug}`}
                            className="group relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#fbbf24] to-[#d97706] shadow-[0_0_20px_rgba(251,191,36,0.5)] hover:shadow-[0_0_40px_rgba(251,191,36,0.7)] hover:scale-110 transition-all duration-500 ease-out"
                        >
                            <div className="absolute inset-0 rounded-full border border-[#fbbf24] opacity-0 scale-100 group-hover:scale-150 group-hover:opacity-0 transition-all duration-1000 ease-out" />
                            <Play className="w-8 h-8 text-black fill-black ml-1 transition-transform duration-300 group-hover:scale-110" />
                        </Link>
                        <div className="flex flex-col gap-1">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] font-black text-xl md:text-2xl uppercase tracking-widest drop-shadow-sm leading-none">
                                Xem Ngay
                            </span>
                        </div>
                        <div className="h-12 w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent mx-2" />
                        <Link
                            href={`/phim/${activeMovie.slug}`}
                            className="flex items-center justify-center w-11 h-11 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all hover:scale-110 group/btn"
                        >
                            <Info className="w-5 h-5 text-white/70 group-hover/btn:text-[#fbbf24] transition-colors" />
                        </Link>
                        <div className="w-11 h-11 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all hover:scale-110 cursor-pointer">
                            <FavoriteButton movieData={getFavoriteData(activeMovie)} initialIsFavorite={false} size="md" />
                        </div>
                    </div>
                </div>

                {/* Navigation Arrows (Mobile) */}
                <button onClick={scrollPrev} className="absolute left-4 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/50 hover:bg-[#fbbf24] hover:text-black hover:scale-110 transition-all">
                    <ChevronRight className="w-7 h-7 rotate-180" />
                </button>
                <button onClick={scrollNext} className="absolute right-4 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/50 hover:bg-[#fbbf24] hover:text-black hover:scale-110 transition-all">
                    <ChevronRight className="w-7 h-7" />
                </button>
            </div>

            {/* ================= DESKTOP LAYOUT (Cinematic iOS 26) ================= */}
            <div className="hidden lg:block absolute inset-0 h-full">
                <div className="absolute inset-0 h-full" ref={desktopRef}>
                    <div className="flex h-full">
                        {heroMovies.map((movie, index) => {
                            const posterImg = getHeroImage(movie, 'poster');
                            const backdropImg = getHeroImage(movie, 'backdrop');

                            return (
                                <div key={movie._id} className="relative flex-[0_0_100%] min-w-0 h-full bg-[#0B0D12] overflow-hidden">

                                    {/* 1. Cinematic Background (Blurred & Ambient) */}
                                    <div className="absolute inset-0 z-0">
                                        <div className="absolute inset-0 bg-black/20 z-10" />
                                        <Image
                                            src={backdropImg}
                                            alt="bg"
                                            fill
                                            className="object-cover blur-[80px] opacity-60 scale-110"
                                            priority={index === 0}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0D12] via-[#0B0D12]/60 to-transparent z-10" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D12] via-transparent to-transparent z-10" />
                                    </div>

                                    {/* 2. Content Container */}
                                    <div className="relative z-20 h-full container max-w-[1400px] mx-auto px-8 flex items-center">
                                        <div className="grid grid-cols-12 gap-12 w-full items-center">

                                            {/* Left: Info */}
                                            <div className="col-span-5 space-y-8 animate-in fade-in slide-in-from-left-10 duration-700 delay-100">
                                                {/* Meta Badges */}
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <span className="px-2.5 py-0.5 rounded shadow-[0_0_10px_rgba(244,200,74,0.3)] bg-[#F4C84A] text-black text-[11px] font-bold tracking-wider uppercase">
                                                        Phim Hot
                                                    </span>
                                                    <span className="px-2.5 py-0.5 rounded border border-white/10 bg-white/5 text-white text-[11px] font-medium flex items-center gap-1.5 backdrop-blur-sm">
                                                        <span className="text-[#F4C84A]">★</span> {heroMoviesData[movie._id]?.vote_average?.toFixed(1) || "N/A"}
                                                    </span>
                                                    <span className="px-2.5 py-0.5 rounded border border-white/10 bg-white/5 text-white/80 text-[11px] font-medium backdrop-blur-sm">
                                                        {movie.year}
                                                    </span>
                                                    <span className="px-2.5 py-0.5 rounded border border-[#F4C84A]/30 bg-[#F4C84A]/10 text-[#F4C84A] text-[11px] font-bold backdrop-blur-sm">
                                                        {movie.quality}
                                                    </span>
                                                </div>

                                                {/* Title */}
                                                <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-[1.15] tracking-tight drop-shadow-2xl line-clamp-2 text-glow">
                                                    {movie.name}
                                                </h1>

                                                {/* Origin Name & Categories */}
                                                <div className="flex items-center gap-3 text-white/60 text-base font-medium">
                                                    <h2>{movie.origin_name}</h2>
                                                    <span className="w-1 h-1 rounded-full bg-white/20" />
                                                    <div className="flex gap-2">
                                                        {movie.category?.slice(0, 3).map(c => (
                                                            <span key={c.id} className="text-white/70 hover:text-[#F4C84A] transition-colors cursor-pointer text-sm">
                                                                {c.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Description */}
                                                <p className="text-white/60 text-base leading-relaxed line-clamp-3 font-normal max-w-xl">
                                                    {stripHtml(movie.content)}
                                                </p>

                                                {/* CTA Buttons */}
                                                <div className="flex items-center gap-4 pt-2">
                                                    <Link
                                                        href={`/xem-phim/${movie.slug}`}
                                                        className="group relative flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-[#F4C84A] hover:bg-[#ffe58a] text-black font-bold text-base shadow-[0_0_20px_rgba(244,200,74,0.2)] hover:shadow-[0_0_30px_rgba(244,200,74,0.4)] transition-all duration-300 hover:scale-105 active:scale-95"
                                                    >
                                                        <Play className="w-5 h-5 fill-black" />
                                                        <span>Xem Ngay</span>
                                                    </Link>

                                                    <Link
                                                        href={`/phim/${movie.slug}`}
                                                        className="flex items-center justify-center gap-2 h-12 px-6 rounded-full glass hover:bg-white/10 border border-white/10 text-white font-medium text-base transition-all hover:scale-105 active:scale-95 group/info"
                                                    >
                                                        <Info className="w-5 h-5 text-white/70 group-hover/info:text-[#F4C84A] transition-colors" />
                                                        <span>Chi tiết</span>
                                                    </Link>

                                                    <FavoriteButton movieData={getFavoriteData(movie)} initialIsFavorite={false} size="lg" />
                                                </div>
                                            </div>

                                            {/* Right: 3D Tilt Poster Card */}
                                            <div className="col-span-7 flex justify-end pl-12 perspective-1000">
                                                <div className="relative w-[360px] aspect-[2/3] rounded-[32px] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] ring-1 ring-white/10 group/poster transition-transform duration-500 ease-out hover:[transform:rotateY(-5deg)_rotateX(5deg)_scale(1.02)] animate-[float_6s_ease-in-out_infinite]">
                                                    <Image
                                                        src={posterImg}
                                                        alt={movie.name}
                                                        fill
                                                        className="object-cover"
                                                        priority={index === 0}
                                                    />
                                                    {/* Shine Effect */}
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-0 group-hover/poster:opacity-100 transition-opacity duration-500" />
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
                <button onClick={scrollPrev} className="absolute left-8 top-1/2 -translate-y-1/2 z-50 w-14 h-14 rounded-full glass flex items-center justify-center text-white/50 hover:text-black hover:bg-[#F4C84A] hover:border-[#F4C84A] hover:scale-110 transition-all duration-300 group">
                    <ChevronRight className="w-8 h-8 rotate-180 group-hover:scale-90 transition-transform" />
                </button>
                <button onClick={scrollNext} className="absolute right-8 top-1/2 -translate-y-1/2 z-50 w-14 h-14 rounded-full glass flex items-center justify-center text-white/50 hover:text-black hover:bg-[#F4C84A] hover:border-[#F4C84A] hover:scale-110 transition-all duration-300 group">
                    <ChevronRight className="w-8 h-8 group-hover:scale-90 transition-transform" />
                </button>

                {/* Dots Indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex gap-3">
                    {heroMovies.slice(0, 10).map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => scrollTo(idx)}
                            className={cn(
                                "h-1.5 rounded-full transition-all duration-300",
                                idx === selectedIndex
                                    ? "w-8 bg-[#F4C84A] shadow-[0_0_10px_#F4C84A]"
                                    : "w-1.5 bg-white/20 hover:bg-white/40"
                            )}
                        />
                    ))}
                </div>
            </div>
        </div >
    );
}
