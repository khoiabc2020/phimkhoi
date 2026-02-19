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
    // Desktop Carousel (Laptops & Desktops)
    const [desktopRef, desktopApi] = useEmblaCarousel({ loop: true, duration: 40 }, [Autoplay({ delay: 8000 })]);

    // Mobile/Tablet Carousel - Swipeable
    const [mobileRef, mobileApi] = useEmblaCarousel({
        loop: true,
        align: "center",
        containScroll: false,
        dragFree: false
    });

    const [selectedIndex, setSelectedIndex] = useState(0);
    const [heroMoviesData, setHeroMoviesData] = useState<Record<string, { vote_average: number, backdrop_path?: string, poster_path?: string }>>({});

    // Sync Desktop
    useEffect(() => {
        if (!desktopApi) return;
        const onSelect = () => setSelectedIndex(desktopApi.selectedScrollSnap());
        desktopApi.on("select", onSelect);
        return () => { desktopApi.off("select", onSelect); };
    }, [desktopApi]);

    // Sync Mobile
    useEffect(() => {
        if (!mobileApi) return;
        const onSelect = () => setSelectedIndex(mobileApi.selectedScrollSnap());
        mobileApi.on("select", onSelect);
        return () => { mobileApi.off("select", onSelect); };
    }, [mobileApi]);

    // Hydrate TMDB
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
        <div className="relative w-full h-auto bg-[#0B0D12] overflow-hidden flex flex-col font-sans">

            {/* ================= TABLET & MOBILE LAYOUT (Portrait/Small Screens) ================= */}
            {/* Shows on < lg screens (approx < 1024px) */}
            <div className="lg:hidden relative w-full h-[85vh] md:h-[60vh] flex flex-col pt-0">

                {/* 1. Ambient Background */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <Image
                        src={getHeroImage(activeMovie, 'poster')}
                        alt="bg"
                        fill
                        className="object-cover blur-[60px] opacity-40 scale-125"
                        priority
                    />
                    {/* Darker overlays for readability */}
                    <div className="absolute inset-0 bg-[#0B0D12]/40" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D12] via-[#0B0D12]/70 to-transparent" />
                </div>

                {/* 2. Content */}
                <div className="relative z-10 flex flex-col items-center justify-end h-full px-6 pb-24 md:pb-12 text-center">

                    {/* Poster Card (3D Floating) */}
                    <Link href={`/xem-phim/${activeMovie.slug}`} className="relative w-[180px] md:w-[200px] aspect-[2/3] mb-8 rounded-2xl overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] ring-1 ring-white/10 animate-in fade-in zoom-in duration-700">
                        <Image
                            src={getHeroImage(activeMovie, 'poster')}
                            alt={activeMovie.name}
                            fill
                            className="object-cover"
                        />
                        {/* Shine */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-50" />
                    </Link>

                    {/* Metadata */}
                    <div className="space-y-4 mb-8 max-w-md mx-auto">
                        <h1 className="text-2xl md:text-3xl font-black text-white leading-tight drop-shadow-xl text-glow line-clamp-2">
                            {activeMovie.name}
                        </h1>
                        <div className="flex items-center justify-center gap-3 text-sm font-medium text-white/90">
                            <span className="bg-white/10 px-2 py-0.5 rounded text-xs">{activeMovie.year}</span>
                            <span className="text-[#F4C84A] flex items-center gap-1">★ {activeRating}</span>
                            <span className="bg-[#F4C84A]/20 text-[#F4C84A] px-2 py-0.5 rounded text-xs border border-[#F4C84A]/30">{activeMovie.quality}</span>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2">
                            {activeMovie.category?.slice(0, 3).map(c => (
                                <span key={c.id} className="text-xs text-white/70 px-2.5 py-1 rounded-full bg-black/40 border border-white/5 backdrop-blur-md">
                                    {c.name}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-4 w-full justify-center max-w-sm mx-auto">
                        <Link
                            href={`/xem-phim/${activeMovie.slug}`}
                            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl bg-[#F4C84A] text-black font-bold shadow-lg shadow-[#F4C84A]/20 active:scale-95 transition-transform"
                        >
                            <Play className="w-5 h-5 fill-black" />
                            <span>Xem Ngay</span>
                        </Link>

                        <Link
                            href={`/phim/${activeMovie.slug}`}
                            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 active:scale-95 transition-transform"
                        >
                            <Info className="w-6 h-6 text-white" />
                        </Link>

                        <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 active:scale-95 transition-transform">
                            <FavoriteButton movieData={getFavoriteData(activeMovie)} initialIsFavorite={false} size="md" />
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= DESKTOP LAYOUT (Large Screens) ================= */}
            {/* Shows on lg screens (approx >= 1024px) */}
            <div className="hidden lg:block relative w-full h-screen">
                <div className="absolute inset-0 h-full" ref={desktopRef}>
                    <div className="flex h-full">
                        {heroMovies.map((movie, index) => {
                            const posterImg = getHeroImage(movie, 'poster');
                            const backdropImg = getHeroImage(movie, 'backdrop');

                            return (
                                <div key={movie._id} className="relative flex-[0_0_100%] min-w-0 h-full bg-[#0B0D12] overflow-hidden">

                                    {/* 1. Cinematic Background */}
                                    <div className="absolute inset-0 z-0 select-none">
                                        <div className="absolute inset-0 bg-black/40 z-10" /> {/* Darken base */}
                                        <Image
                                            src={backdropImg}
                                            alt="bg"
                                            fill
                                            className="object-cover blur-sm opacity-80"
                                            priority={index === 0}
                                        />
                                        {/* Vignettes for focus */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0D12] via-[#0B0D12]/80 to-transparent z-20 w-2/3" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D12] via-transparent to-transparent z-20 h-1/2 bottom-0 top-auto" />
                                    </div>

                                    {/* 2. Content Container */}
                                    <div className="relative z-30 h-full container max-w-[1600px] mx-auto px-8 flex items-center">
                                        <div className="grid grid-cols-12 gap-12 w-full items-center mt-16">

                                            {/* Left: Info */}
                                            <div className="col-span-12 xl:col-span-5 lg:col-span-6 space-y-8 animate-in fade-in slide-in-from-left-10 duration-700 delay-100">

                                                {/* Meta Badges */}
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <span className="px-3 py-1 rounded bg-[#F4C84A] text-black text-xs font-bold tracking-wider uppercase shadow-[0_0_15px_rgba(244,200,74,0.4)]">
                                                        Phim Hot
                                                    </span>
                                                    <span className="px-3 py-1 rounded border border-white/20 bg-white/5 text-white text-xs font-semibold backdrop-blur-md">
                                                        {movie.year}
                                                    </span>
                                                    <span className="px-3 py-1 rounded border border-[#F4C84A]/50 bg-[#F4C84A]/10 text-[#F4C84A] text-xs font-bold backdrop-blur-md border-glow-accent">
                                                        {movie.quality}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-white/80 text-xs font-medium">
                                                        <span className="text-[#F4C84A]">★</span> {heroMoviesData[movie._id]?.vote_average?.toFixed(1) || "N/A"}
                                                    </span>
                                                </div>

                                                {/* Title */}
                                                <h1
                                                    className="font-semibold text-white leading-[1.15] tracking-tight drop-shadow-2xl line-clamp-2 mb-3.5"
                                                    style={{ fontSize: movie.name.length > 40 ? '28px' : movie.name.length > 25 ? '32px' : '36px' }}
                                                >
                                                    {movie.name}
                                                </h1>

                                                {/* Origin Name & Categories */}
                                                <div className="flex items-center gap-4 mb-5">
                                                    <h2 className="text-[18px] text-white/70 font-normal tracking-wide">{movie.origin_name}</h2>
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
                                                    {stripHtml(movie.content)}
                                                </p>

                                                {/* CTA Buttons */}
                                                <div className="flex items-center gap-4 pt-2">
                                                    <Link
                                                        href={`/xem-phim/${movie.slug}`}
                                                        className="group relative flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-[#F4C84A] hover:bg-[#ffe58a] text-black font-extrabold text-base shadow-[0_0_20px_rgba(244,200,74,0.3)] hover:shadow-[0_0_40px_rgba(244,200,74,0.5)] transition-all duration-300 hover:-translate-y-1 hover:scale-105 active:scale-95 active:translate-y-0"
                                                    >
                                                        <Play className="w-5 h-5 fill-black" />
                                                        <span>Xem Ngay</span>
                                                    </Link>

                                                    <Link
                                                        href={`/phim/${movie.slug}`}
                                                        className="flex items-center justify-center gap-2 h-12 px-6 rounded-full glass hover:bg-white/10 border border-white/10 text-white font-semibold text-base transition-all hover:-translate-y-1 hover:scale-105 active:scale-95 group/info backdrop-blur-md"
                                                    >
                                                        <Info className="w-5 h-5 text-white/80 group-hover/info:text-[#F4C84A] transition-colors" />
                                                        <span>Chi tiết</span>
                                                    </Link>

                                                    <div className="h-12 w-12 flex items-center justify-center rounded-full glass hover:bg-white/10 border border-white/10 transition-all hover:scale-110 cursor-pointer backdrop-blur-md">
                                                        <FavoriteButton movieData={getFavoriteData(movie)} initialIsFavorite={false} size="md" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: 3D Tilt Poster Card */}
                                            {/* Only show on very large screens to maintain layout balance */}
                                            <div className="col-span-12 xl:col-span-7 lg:col-span-6 hidden lg:flex justify-end pr-8 xl:pr-16 perspective-1000">
                                                <div className="relative w-[340px] xl:w-[400px] aspect-[2/3] rounded-[32px] overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/10 group/poster transition-transform duration-700 ease-out hover:[transform:rotateY(-8deg)_rotateX(5deg)_scale(1.02)] z-30">
                                                    <Image
                                                        src={posterImg}
                                                        alt={movie.name}
                                                        fill
                                                        className="object-cover transition-transform duration-700 group-hover/poster:scale-110"
                                                        priority={index === 0}
                                                    />
                                                    {/* Shine Effect */}
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-0 group-hover/poster:opacity-100 transition-opacity duration-700" />
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
                <button onClick={scrollPrev} className="absolute left-8 top-1/2 -translate-y-1/2 z-50 w-16 h-16 rounded-full glass flex items-center justify-center text-white/40 hover:text-black hover:bg-[#F4C84A] hover:border-[#F4C84A] hover:scale-110 transition-all duration-300 group">
                    <ChevronRight className="w-8 h-8 rotate-180 group-hover:scale-90 transition-transform" />
                </button>
                <button onClick={scrollNext} className="absolute right-8 top-1/2 -translate-y-1/2 z-50 w-16 h-16 rounded-full glass flex items-center justify-center text-white/40 hover:text-black hover:bg-[#F4C84A] hover:border-[#F4C84A] hover:scale-110 transition-all duration-300 group">
                    <ChevronRight className="w-8 h-8 group-hover:scale-90 transition-transform" />
                </button>

                {/* Dots Indicator */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 flex gap-4">
                    {heroMovies.slice(0, 10).map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => scrollTo(idx)}
                            className={cn(
                                "h-2 rounded-full transition-all duration-500 ease-out",
                                idx === selectedIndex
                                    ? "w-12 bg-[#F4C84A] shadow-[0_0_15px_#F4C84A]"
                                    : "w-2 bg-white/20 hover:bg-white/50"
                            )}
                        />
                    ))}
                </div>
            </div>
        </div >
    );
}
