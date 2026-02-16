"use client";

import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import Link from "next/link";
import { Play, ChevronRight, Info, Plus, Check } from "lucide-react";
import { Movie } from "@/services/api";
import { getImageUrl } from "@/lib/utils";
import { getTMDBDataForCard } from "@/app/actions/tmdb";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import FavoriteButton from "./FavoriteButton";
import Autoplay from "embla-carousel-autoplay";
import MobileMenu from "./MobileMenu";

export default function HeroSection({ movies }: { movies: Movie[] }) {
    // Desktop Carousel
    const [desktopRef, desktopApi] = useEmblaCarousel({ loop: true, duration: 40 }, [Autoplay({ delay: 8000 })]);

    // Mobile Carousel - Centered Card Style
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
            return `https://image.tmdb.org/t/p/w780${tmdbData.poster_path}`;
        }
        return getImageUrl(movie.poster_url || movie.thumb_url);
    };

    return (
        <div className="relative w-full h-[65vh] md:h-screen bg-black overflow-hidden flex flex-col">

            {/* ================= MOBILE LAYOUT (Vertical Card Style) ================= */}
            <div className="md:hidden relative w-full h-[65vh] flex flex-col pt-16">

                {/* 1. Blurred Background - Lighter & More Vibrant */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src={getHeroImage(activeMovie, 'backdrop')} // Use High-Res Backdrop
                        alt={activeMovie.name}
                        fill
                        className="object-cover blur-xl opacity-50 scale-110 transition-all duration-700"
                        priority
                    />
                    {/* Lighter gradient for better visibility */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black" />
                </div>

                {/* 3. Main Content Area - Compacted */}
                <div className="relative z-10 flex-1 flex flex-col justify-center items-center pb-4 gap-2">

                    {/* Carousel - Slightly smaller */}
                    <div className="w-full mb-1" ref={mobileRef}>
                        <div className="flex touch-pan-y items-center py-1">
                            {heroMovies.map((movie, index) => (
                                <div key={movie._id} className="flex-[0_0_40%] min-w-0 pl-3 relative perspective-1000">
                                    <div className={cn(
                                        "relative rounded-lg overflow-hidden shadow-2xl transition-all duration-500 ease-out transform aspect-[2/3]",
                                        index === selectedIndex
                                            ? "scale-100 opacity-100 z-20 shadow-[0_8px_25px_rgba(0,0,0,0.5)] ring-1 ring-white/20"
                                            : "scale-90 opacity-60 z-10 grayscale-[0.4] blur-[0.5px] translate-y-2"
                                    )}>
                                        <Image
                                            src={getImageUrl(movie.poster_url || movie.thumb_url)}
                                            alt={movie.name}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 45vw"
                                            priority={index === selectedIndex}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Info Section - Compacted */}
                    <div className="w-full px-4 text-center space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300" key={activeMovie._id}>

                        {/* Title & Original Title */}
                        <div>
                            <h1 className="text-base font-black text-white uppercase tracking-tight leading-none drop-shadow-lg line-clamp-2 px-4 shadow-black">
                                {activeMovie.name}
                            </h1>
                            <p className="text-[10px] font-medium text-white/70 mt-0.5 tracking-wide line-clamp-1">
                                {activeMovie.origin_name}
                            </p>
                        </div>

                        {/* Action Buttons - Compact Circular Style */}
                        <div className="flex gap-5 justify-center w-full px-8 pt-2">
                            <Link
                                href={`/xem-phim/${activeMovie.slug}`}
                                className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-[#fbbf24] hover:bg-[#f59e0b] shadow-[0_0_25px_rgba(251,191,36,0.3)] transition-all duration-300 active:scale-95"
                            >
                                <Play className="w-6 h-6 fill-black text-black ml-1" />
                            </Link>

                            <Link
                                href={`/phim/${activeMovie.slug}`}
                                className="w-12 h-12 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-xl border border-white/10 text-white active:scale-95 transition-transform hover:bg-white/10 mt-1"
                            >
                                <Info className="w-6 h-6" />
                            </Link>
                            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-xl border border-white/10 text-white active:scale-95 transition-transform hover:bg-white/10 mt-1">
                                <FavoriteButton movieData={getFavoriteData(activeMovie)} initialIsFavorite={false} size="sm" />
                            </div>
                        </div>

                        {/* Badges & Meta - Minimal */}
                        <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-medium text-white/60 pt-2">
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#fbbf24]/10 border border-[#fbbf24]/30 text-[#fbbf24]">
                                <span className="text-[9px]">★</span>
                                <span>{activeRating}</span>
                            </div>
                            <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">{activeMovie.year}</span>
                            <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">{activeMovie.quality}</span>
                            <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">{activeMovie.duration || "N/A"}</span>
                        </div>

                    </div>
                </div>
            </div>

            {/* ================= TABLET LAYOUT (Two-Column) ================= */}
            <div className="hidden md:block lg:hidden relative w-full h-full bg-black">
                {/* Background */}
                <div className="absolute inset-0">
                    <Image
                        src={getHeroImage(activeMovie, 'backdrop')} // Use High-Res Backdrop
                        alt={activeMovie.name}
                        fill
                        className="object-cover blur-3xl opacity-40 scale-110"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black" />
                </div>

                {/* Content Container */}
                <div className="relative z-10 container mx-auto h-full flex items-center px-6 py-20">
                    <div className="grid grid-cols-5 gap-8 w-full items-center">

                        {/* Left: Poster */}
                        <div className="col-span-2">
                            <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                                <Image
                                    src={getImageUrl(activeMovie.poster_url || activeMovie.thumb_url)}
                                    alt={activeMovie.name}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            </div>
                        </div>

                        {/* Right: Content */}
                        <div className="col-span-3 space-y-4">
                            {/* Badges */}
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#fbbf24]/60 bg-black/50 backdrop-blur-md text-[#fbbf24] font-bold text-xs shadow-sm">
                                    <span>IMDb</span>
                                    <span>{activeRating}</span>
                                </div>
                                <div className="px-2.5 py-1 rounded border border-white/20 bg-white/10 backdrop-blur-md text-white text-xs font-bold shadow-sm">{activeMovie.year}</div>
                                <div className="px-2.5 py-1 rounded border border-white/20 bg-white/10 backdrop-blur-md text-white text-xs font-bold shadow-sm">{activeMovie.quality}</div>
                                <div className="px-2.5 py-1 rounded border border-[#fbbf24]/30 bg-[#fbbf24]/10 backdrop-blur-md text-[#fbbf24] text-xs font-bold uppercase tracking-wider shadow-sm">
                                    {activeMovie.category?.[0]?.name}
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight leading-tight drop-shadow-2xl line-clamp-2">
                                    {activeMovie.name}
                                </h1>
                                <p className="text-sm text-white/60 font-medium mt-1.5 line-clamp-1">
                                    {activeMovie.origin_name}
                                </p>
                            </div>

                            {/* Description */}
                            <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
                                {stripHtml(activeMovie.content)}
                            </p>

                            {/* Action Buttons - Refined Premium Design */}
                            <div className="flex items-center gap-4 pt-4">
                                <Link
                                    href={`/xem-phim/${activeMovie.slug}`}
                                    className="group relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#fbbf24] to-[#d97706] shadow-[0_0_20px_rgba(251,191,36,0.5)] hover:shadow-[0_0_40px_rgba(251,191,36,0.7)] hover:scale-110 transition-all duration-500 ease-out"
                                >
                                    {/* Pulse Effect */}
                                    <div className="absolute inset-0 rounded-full border border-[#fbbf24] opacity-0 scale-100 group-hover:scale-150 group-hover:opacity-0 transition-all duration-1000 ease-out" />
                                    <Play className="w-8 h-8 text-black fill-black ml-1 transition-transform duration-300 group-hover:scale-110" />
                                </Link>

                                <div className="flex flex-col gap-1">
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] font-black text-xl md:text-2xl uppercase tracking-widest drop-shadow-sm leading-none">
                                        Xem Ngay
                                    </span>
                                    <div className="flex items-center gap-1.5 text-white/50 text-[10px] font-bold tracking-wider uppercase">
                                        <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">Miễn phí</span>
                                        <span className="w-1 h-1 rounded-full bg-white/20" />
                                        <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">Full HD</span>
                                    </div>
                                </div>

                                <div className="h-12 w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent mx-2" />

                                <Link
                                    href={`/phim/${activeMovie.slug}`}
                                    className="flex items-center justify-center w-11 h-11 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all hover:scale-110 group/btn"
                                    title="Thông tin chi tiết"
                                >
                                    <Info className="w-5 h-5 text-white/70 group-hover/btn:text-[#fbbf24] transition-colors" />
                                </Link>

                                <div className="w-11 h-11 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all hover:scale-110 cursor-pointer">
                                    <FavoriteButton movieData={getFavoriteData(activeMovie)} initialIsFavorite={false} size="md" />
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Nav Arrows */}
                <button onClick={scrollPrev} className="absolute left-4 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/50 hover:bg-[#fbbf24] hover:text-black hover:scale-110 transition-all">
                    <ChevronRight className="w-7 h-7 rotate-180" />
                </button>
                <button onClick={scrollNext} className="absolute right-4 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/50 hover:bg-[#fbbf24] hover:text-black hover:scale-110 transition-all">
                    <ChevronRight className="w-7 h-7" />
                </button>
            </div>

            {/* ================= DESKTOP LAYOUT (Cinematic - With Backdrops) ================= */}
            <div className="hidden lg:block absolute inset-0 h-full">
                <div className="absolute inset-0 h-full" ref={desktopRef}>
                    <div className="flex h-full">
                        {heroMovies.map((movie) => {
                            return (
                                <div key={movie._id} className="relative flex-[0_0_100%] min-w-0 h-full bg-black overflow-hidden">
                                    {/* Background */}
                                    <div className="absolute inset-0">
                                        <div className={cn(
                                            "relative w-full h-full transition-transform duration-[20s] ease-in-out",
                                            selectedIndex === heroMovies.indexOf(movie) ? "scale-110" : "scale-100"
                                        )}>
                                            <Image
                                                src={getHeroImage(movie, 'backdrop')} // Use High-Res Backdrop
                                                alt={movie.name}
                                                fill
                                                className="object-cover"
                                                priority
                                            />
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
                                    </div>

                                    {/* Main Content - Left Alignment */}
                                    <div className="absolute inset-0 container mx-auto px-4 md:px-12 flex flex-col justify-center h-full pb-20 pointer-events-none">
                                        <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-left-8 duration-700 pointer-events-auto mt-20">

                                            {/* Main Title - Huge & Elegant */}
                                            <div className="">
                                                <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.1] drop-shadow-2xl line-clamp-2 uppercase">
                                                    {movie.name}
                                                </h1>
                                            </div>

                                            {/* Stylized Origin Name (Moved Below Title) */}
                                            <div className="flex flex-wrap items-baseline gap-2 -mt-2">
                                                <h2 className="text-[#fbbf24] font-bold text-xl md:text-2xl tracking-wide shadow-black drop-shadow-md">
                                                    {movie.origin_name}
                                                </h2>
                                                <span className="text-[#fbbf24]/80 text-xl font-medium">({movie.year})</span>
                                            </div>

                                            {/* Badges & Meta - Minimal Professional */}
                                            <div className="flex flex-wrap items-center gap-3">
                                                <span className="px-2 py-1 rounded bg-white/10 backdrop-blur-md border border-white/10 text-white font-bold text-xs shadow-sm uppercase">{movie.quality}</span>
                                                <span className="px-2 py-1 rounded bg-white/10 backdrop-blur-md border border-white/10 text-white font-bold text-xs shadow-sm">{movie.year}</span>
                                                <span className="px-2 py-1 rounded bg-white/10 backdrop-blur-md border border-white/10 text-white font-bold text-xs shadow-sm">{movie.duration || "N/A"}</span>
                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#fbbf24] text-black font-bold text-xs shadow-lg shadow-[#fbbf24]/20">
                                                    <span className="text-[10px]">★</span>
                                                    <span>{heroMoviesData[movie._id]?.vote_average?.toFixed(1) || "N/A"}</span>
                                                </div>
                                                <span className="text-white/60 text-sm font-medium ml-1 capitalize">{movie.category?.map(c => c.name).join(", ")}</span>
                                            </div>

                                            {/* Description - Stylized */}
                                            <p className="text-white/80 text-sm md:text-base line-clamp-3 font-light max-w-xl leading-relaxed drop-shadow-md">
                                                {stripHtml(movie.content)}
                                            </p>

                                            {/* Action Buttons - Pill Style */}
                                            <div className="flex items-center gap-6 pt-6">
                                                <Link
                                                    href={`/xem-phim/${movie.slug}`}
                                                    className="group relative flex items-center gap-3 pl-8 pr-10 h-16 rounded-full bg-[#fbbf24] hover:bg-[#f59e0b] shadow-[0_0_30px_rgba(251,191,36,0.3)] hover:shadow-[0_0_50px_rgba(251,191,36,0.5)] transition-all duration-300 hover:scale-105 active:scale-95"
                                                >
                                                    <Play className="w-8 h-8 fill-black text-black" />
                                                    <span className="text-black font-black text-xl uppercase tracking-wide leading-none">Xem Ngay</span>
                                                </Link>

                                                <div className="flex gap-4">
                                                    <div className="w-14 h-14 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 border border-white/10 backdrop-blur-md transition-all hover:scale-110 cursor-pointer group/fav">
                                                        <FavoriteButton movieData={getFavoriteData(movie)} initialIsFavorite={false} size="lg" />
                                                    </div>

                                                    <Link
                                                        href={`/phim/${movie.slug}`}
                                                        className="flex items-center justify-center w-14 h-14 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 backdrop-blur-md transition-all hover:scale-110 group/info"
                                                        title="Thông tin chi tiết"
                                                    >
                                                        <Info className="w-7 h-7 text-white group-hover/info:text-[#fbbf24] transition-colors" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Thumbnails - Refined Modern Design (Horizontal Backdrops) */}
                <div className="absolute bottom-8 right-0 z-40 w-full md:w-auto md:right-8 pl-4 md:pl-0 pointer-events-none">
                    <div className="flex flex-col gap-2 pointer-events-auto items-end">
                        <div className="flex gap-3 overflow-x-auto no-scrollbar md:max-w-4xl justify-start md:justify-end p-2 pb-4 mask-gradient-responsive">
                            {heroMovies.map((m, index) => (
                                <button
                                    key={m._id}
                                    onClick={() => scrollTo(index)}
                                    className={cn(
                                        "relative flex-shrink-0 w-32 md:w-44 aspect-video rounded-lg overflow-hidden transition-all duration-300 ease-out cursor-pointer group",
                                        "shadow-lg hover:shadow-2xl",
                                        index === selectedIndex
                                            ? "ring-2 ring-[#fbbf24] scale-105 z-20 opacity-100 shadow-[0_5px_20px_rgba(0,0,0,0.5)]"
                                            : "opacity-50 grayscale-[0.5] hover:opacity-100 hover:grayscale-0 hover:scale-105 border border-white/10"
                                    )}
                                >
                                    <Image
                                        src={getHeroImage(m, 'backdrop')} // Use Horizontal Backdrop
                                        alt={m.name}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        sizes="(max-width: 768px) 150px, 200px"
                                    />

                                    {/* Glassmorphism Overlay */}
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />

                                    {/* Minimal Title Overlay (Requested) */}
                                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent">
                                        <p className={cn(
                                            "text-xs md:text-sm font-bold truncate tracking-wide text-left drop-shadow-md",
                                            index === selectedIndex ? "text-[#fbbf24]" : "text-white group-hover:text-white"
                                        )}>
                                            {m.name}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Nav Arrows - Floating Glass Style */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 z-50 pointer-events-none">
                    <button onClick={scrollPrev} className="pointer-events-auto w-14 h-14 rounded-full bg-black/10 backdrop-blur-md border border-white/5 flex items-center justify-center text-white/30 hover:bg-[#fbbf24] hover:text-black hover:scale-110 hover:border-[#fbbf24] transition-all duration-300 group shadow-lg">
                        <ChevronRight className="w-8 h-8 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <button onClick={scrollNext} className="pointer-events-auto w-14 h-14 rounded-full bg-black/10 backdrop-blur-md border border-white/5 flex items-center justify-center text-white/30 hover:bg-[#fbbf24] hover:text-black hover:scale-110 hover:border-[#fbbf24] transition-all duration-300 group shadow-lg">
                        <ChevronRight className="w-8 h-8 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            </div >
        </div >
    );
}
