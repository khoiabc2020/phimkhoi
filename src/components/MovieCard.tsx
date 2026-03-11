"use client";

import FavoriteButton from "@/components/FavoriteButton";
import WatchlistInlineButton from "@/components/WatchlistInlineButton";
import Link from "next/link";
import Image from "next/image";
import { Play, Info, Star, ChevronDown } from "lucide-react";
import { getImageUrl, decodeHtml } from "@/lib/utils";
import { Movie } from "@/services/api";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { getTMDBImage } from "@/services/tmdb";
import { getMovieTrailer } from "@/app/actions/tmdb";

// Tiny LQIP blur placeholder shared across all movie cards
const BLUR_PLACEHOLDER = "data:image/webp;base64,UklGRmIAAABXRUJQVlA4IFYAAAAwAQCdASoIAAUAAUAmJaQAA3AA/vx5nAAA/uX3L5B5mR5s3h9n189o9D0Nnv/qJ/93sAf//1kP/+cIIf//2I//97kf///eP///zGf//42gAA==";

function formatQualityLabel(quality?: string) {
    if (!quality) return null;
    const q = quality.trim();
    const upper = q.toUpperCase();
    if (upper.includes("FULL") && upper.includes("HD")) return "FHD";
    if (upper === "FULLHD") return "FHD";
    if (upper.includes("BLURAY")) return "BR";
    if (upper.includes("WEB-DL") || upper.includes("WEBDL")) return "WEB";
    // Keep common short forms
    if (upper === "FHD" || upper === "HD" || upper === "4K" || upper === "CAM") return upper;
    // Avoid long ugly strings on badge
    return q.length > 6 ? q.slice(0, 6) : q;
}

function MovieCard({ movie, orientation = 'portrait' }: { movie: Movie, orientation?: 'portrait' | 'landscape' }) {
    const [isHovered, setIsHovered] = useState(false);
    const [position, setPosition] = useState<{ top: number; left: number; width: number; rectTop?: number; innerHeight?: number; rectHeight?: number }>({ top: 0, left: 0, width: 0 });
    const cardRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const displayPoster = orientation === 'landscape'
        ? getImageUrl(movie.thumb_url || movie.poster_url)
        : getImageUrl(movie.poster_url || movie.thumb_url);

    const displayBackdrop = getImageUrl(movie.thumb_url || movie.poster_url);

    const handleMouseEnter = () => {
        if (leaveTimeoutRef.current) {
            clearTimeout(leaveTimeoutRef.current);
            leaveTimeoutRef.current = null;
        }
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
            if (cardRef.current) {
                const rect = cardRef.current.getBoundingClientRect();
                setPosition({
                    top: rect.top + window.scrollY,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                    rectTop: rect.top,
                    innerHeight: window.innerHeight,
                    rectHeight: rect.height
                });
                setIsHovered(true);
            }
        }, 350);
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        leaveTimeoutRef.current = setTimeout(() => {
            setIsHovered(false);
        }, 400);
    };

    const handlePortalMouseEnter = () => {
        if (leaveTimeoutRef.current) {
            clearTimeout(leaveTimeoutRef.current);
            leaveTimeoutRef.current = null;
        }
    };

    const handlePortalMouseLeave = () => {
        if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
        leaveTimeoutRef.current = setTimeout(() => setIsHovered(false), 200);
    };

    // Close overlay immediately on scroll to prevent it from sticking to the screen
    useEffect(() => {
        if (!isHovered) return;

        const handleScroll = () => {
            setIsHovered(false);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [isHovered]);

    return (
        <>
            <div
                ref={cardRef}
                className="relative block h-full w-full cursor-pointer z-10 group/static-card hover:z-20"
                style={{ contain: "layout style paint" }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <div className={`relative ${orientation === 'landscape' ? 'aspect-video' : 'aspect-[2/3]'} rounded-md overflow-hidden bg-[#1a1a1a] shadow-lg`}>
                    <Link href={`/phim/${movie.slug}`} className="block h-full w-full absolute inset-0 z-0" prefetch={false}>
                        <Image
                            src={displayPoster || "/placeholder.svg"}
                            alt={decodeHtml(movie.name) || movie.slug || "Phim"}
                            fill
                            className="object-cover transition-transform duration-300 ease-out group-hover/static-card:scale-105"
                            sizes={orientation === 'landscape' ? "(max-width: 768px) 60vw, 30vw" : "(max-width: 768px) 40vw, 15vw"}
                            unoptimized
                            loading="eager"
                            priority={true}
                            placeholder="blur"
                            blurDataURL="data:image/webp;base64,UklGRmIAAABXRUJQVlA4IFYAAAAwAQCdASoIAAUAAUAmJaQAA3AA/vx5nAAA/uX3L5B5mR5s3h9n189o9D0Nnv/qJ/93sAf//1kP/+cIIf//2I//97kf///eP///zGf//42gAA=="
                            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                        />
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                    </Link>

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none">
                        {formatQualityLabel(movie.quality) && (
                            <span className="bg-black/75 shadow-md border border-white/10 text-white/90 text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-[0.08em] max-w-[56px] truncate">
                                {formatQualityLabel(movie.quality)}
                            </span>
                        )}
                        {movie.episode_current && (
                            <span className="bg-primary/90 text-black text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                                {movie.episode_current}
                            </span>
                        )}
                    </div>
                    {/* Rating Badge bottom-right */}
                    {(movie as any).vote_average && (movie as any).vote_average > 0 && (
                        <div className="absolute bottom-2 right-2 z-10 pointer-events-none flex items-center gap-0.5 bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5">
                            <Star className="w-2.5 h-2.5 fill-[#F4C84A] text-[#F4C84A]" />
                            <span className="text-[9px] font-bold text-white/90">{((movie as any).vote_average).toFixed(1)}</span>
                        </div>
                    )}
                </div>

                <div className="mt-2 space-y-0.5 px-0.5">
                    <h3 className="text-white font-bold text-[13px] truncate group-hover/static-card:text-primary transition-colors leading-tight" title={decodeHtml(movie.name) || movie.slug || ""}>
                        {decodeHtml(movie.name) || movie.slug || "—"}
                    </h3>
                    <div className="flex items-center justify-between">
                        {movie.origin_name && (
                            <p className="text-white/40 text-[11px] truncate font-medium max-w-[80%]" title={decodeHtml(movie.origin_name)}>
                                {decodeHtml(movie.origin_name)}
                            </p>
                        )}
                        <span className="text-white/30 text-[10px] font-medium">{movie.year || 2024}</span>
                    </div>
                </div>
            </div>

            {
                isHovered && typeof window !== "undefined" && createPortal(
                    <OnflixHoverCard
                        movie={movie}
                        position={position}
                        displayBackdrop={displayBackdrop}
                        orientation={orientation}
                        onMouseEnter={handlePortalMouseEnter}
                        onMouseLeave={handlePortalMouseLeave}
                    />,
                    document.body
                )
            }
        </>
    );
}

function OnflixHoverCard({
    movie,
    position,
    displayBackdrop,
    orientation,
    onMouseEnter,
    onMouseLeave,
}: {
    movie: Movie;
    position: { top: number; left: number; width: number; rectTop?: number; innerHeight?: number; rectHeight?: number };
    displayBackdrop: string | null;
    orientation: 'portrait' | 'landscape';
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}) {
    const [imgLoaded, setImgLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [trailerKey, setTrailerKey] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        const fetchTrailer = async () => {
            let type: 'movie' | 'tv' = 'movie';
            if (movie.type === 'phim-bo' || movie.type === 'tv-shows' || movie.type === 'hoat-hinh') type = 'tv';

            const year = movie.year ? parseInt(movie.year.toString().split("-")[0]) : undefined;
            const key = await getMovieTrailer(
                movie.origin_name || movie.name,
                isNaN(year!) ? undefined : year,
                type,
                { originalName: movie.origin_name, countrySlug: movie.country?.[0]?.slug }
            );
            if (active && key) {
                setTrailerKey(key);
            }
        };

        const timer = setTimeout(fetchTrailer, 1000); // 1s hover delay
        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [movie]);

    const CARD_WIDTH = 320;
    const offsetLeft = (CARD_WIDTH - position.width) / 2;

    // Smart positioning: don't go off-screen horizontally
    let left = position.left - offsetLeft;
    if (left < 10) left = 10;
    if (left + CARD_WIDTH > window.innerWidth - 10) left = window.innerWidth - CARD_WIDTH - 10;

    // Smart positioning: don't go off-screen vertically
    const ESTIMATED_CARD_HEIGHT = 340;
    let top = position.top - 10;

    // Nếu sát mép dưới màn hình thì bật ngược lên trên
    if (position.rectTop && position.innerHeight && position.rectHeight) {
        if (position.rectTop + ESTIMATED_CARD_HEIGHT > position.innerHeight) {
            top = position.top - ESTIMATED_CARD_HEIGHT + position.rectHeight + 10;
        }
    }

    return (
        <div
            className="absolute z-[9999] pointer-events-auto"
            style={{
                top,
                left,
                width: CARD_WIDTH,
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div className="relative animate-in fade-in zoom-in-95 duration-200 ease-out origin-top">
                {/* Card */}
                <div className="relative glass-panel overflow-hidden">

                    {/* Backdrop Image - 16:9 — skeleton + fade-in khi load xong */}
                    <div className="relative aspect-video w-full overflow-hidden bg-[#1a1a1a]">
                        {/* Skeleton hiển thị khi ảnh chưa load xong */}
                        {!imgLoaded && !hasError && (
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/[0.02] animate-pulse" />
                        )}
                        <Image
                            src={displayBackdrop || "/placeholder.svg"}
                            alt={decodeHtml(movie.name) || movie.slug || "Phim"}
                            fill
                            className={`object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                            unoptimized
                            priority
                            onLoad={() => setImgLoaded(true)}
                            onError={() => { setImgLoaded(true); setHasError(true); }}
                        />

                        {trailerKey && (
                            <div className="absolute inset-0 z-10 w-[300%] h-[300%] -left-[100%] -top-[100%] pointer-events-none">
                                <iframe
                                    src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}&modestbranding=1&playsinline=1`}
                                    allow="autoplay"
                                    className="w-full h-full animate-in fade-in duration-1000"
                                    frameBorder="0"
                                />
                            </div>
                        )}

                        {/* Gradient fading into card body */}
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#141414] via-[#141414]/80 to-transparent z-20 pointer-events-none" />
                    </div>

                    {/* Card body */}
                    <div className="px-4 pb-4 pt-2 space-y-3 relative z-10 bg-[#141414] rounded-b-2xl">
                        {/* Title and Subtitle */}
                        <div>
                            <h3 className="text-white font-bold text-[15px] leading-snug line-clamp-2">
                                {decodeHtml(movie.name) || movie.slug || "—"}
                            </h3>
                            {movie.origin_name && (
                                <p className="text-white/50 text-[12px] leading-tight line-clamp-1 mt-0.5">
                                    {decodeHtml(movie.origin_name)}
                                </p>
                            )}
                        </div>

                        {/* Action Buttons row */}
                        <div className="flex items-center gap-2">
                            {/* Play button (Yellow) */}
                            <Link
                                href={`/xem-phim/${movie.slug}?autoPlay=true`}
                                className="flex-1 min-w-0 flex items-center justify-center gap-1.5 bg-[#F4C84A] hover:bg-[#ffe58a] text-black font-extrabold text-[13px] h-9 px-3 rounded-full transition-all hover:scale-105"
                            >
                                <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                                <span className="truncate">Xem</span>
                            </Link>

                            <div className="flex items-center gap-2 shrink-0">
                                {/* Watchlist button */}
                                <WatchlistInlineButton
                                    slug={movie.slug}
                                    movieName={movie.name}
                                    moviePoster={movie.poster_url || movie.thumb_url}
                                    size="md"
                                    className="!w-9 !h-9 shrink-0 rounded-full text-white/80 hover:text-white bg-white/5 hover:bg-white/15 border border-white/20 hover:border-white transition-all hover:scale-105 flex items-center justify-center"
                                />

                                {/* Favorite button */}
                                <div className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full border border-white/20 hover:border-white text-white/80 hover:text-white bg-white/5 hover:bg-white/15 cursor-pointer transition-all hover:scale-105">
                                    <FavoriteButton
                                        movieData={{
                                            movieId: movie._id || "",
                                            movieSlug: movie.slug,
                                            movieName: movie.name,
                                            movieOriginName: movie.origin_name,
                                            moviePoster: movie.poster_url || movie.thumb_url,
                                            movieYear: movie.year,
                                            movieQuality: movie.quality,
                                            movieCategories: movie.category?.map((c) => c.name) || [],
                                        }}
                                        size="sm"
                                        className="w-4 h-4"
                                    />
                                </div>

                                <Link
                                    href={`/phim/${movie.slug}`}
                                    className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full border border-white/20 hover:border-white text-white/80 hover:text-white bg-white/5 hover:bg-white/15 transition-all hover:scale-105"
                                    title="Chi tiết"
                                >
                                    <ChevronDown className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>

                        {/* Info: Year & Quality */}
                        <div className="flex items-center gap-2 text-[13px] mt-2">
                            {movie.year && (
                                <span className="text-white/70 font-medium">{movie.year}</span>
                            )}
                            {movie.quality && (
                                <span className="border border-white/30 text-white/80 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider">
                                    {movie.quality}
                                </span>
                            )}
                            {movie.episode_current && (
                                <span className="border border-white/30 text-white/80 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider">
                                    {movie.episode_current}
                                </span>
                            )}
                        </div>

                        {/* Genres */}
                        {movie.category && movie.category.length > 0 && (
                            <div className="text-[13px] text-white/70 font-medium truncate mt-1">
                                {movie.category.slice(0, 4).map((cat) => cat.name).join(' • ')}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default React.memo(MovieCard);
