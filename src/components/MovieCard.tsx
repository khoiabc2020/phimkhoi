"use client";

import FavoriteButton from "@/components/FavoriteButton";
import WatchlistInlineButton from "@/components/WatchlistInlineButton";
import Link from "next/link";
import Image from "next/image";
import { Play, Info, Star, ChevronDown } from "lucide-react";
import { getImageUrl, decodeHtml } from "@/lib/utils";
import { Movie } from "@/services/api";
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { getTMDBImage } from "@/services/tmdb";

function MovieCard({ movie, orientation = 'portrait' }: { movie: Movie, orientation?: 'portrait' | 'landscape' }) {
    const [isHovered, setIsHovered] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
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
                className={`relative block h-full w-full cursor-pointer z-10 group/static-card hover:z-20 will-change-transform transform-gpu ${orientation === 'landscape' ? '[content-visibility:auto] [contain-intrinsic-size:250px_140px]' : '[content-visibility:auto] [contain-intrinsic-size:160px_240px]'}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <div className={`relative ${orientation === 'landscape' ? 'aspect-video' : 'aspect-[2/3]'} rounded-xl overflow-hidden bg-[#1a1a1a] shadow-lg contain-paint`}>
                    <Link href={`/phim/${movie.slug}`} className="block h-full w-full absolute inset-0 z-0">
                        <Image
                            src={displayPoster || "/placeholder.jpg"}
                            alt={movie.name}
                            fill
                            className="object-cover transition-transform duration-500 ease-out group-hover/static-card:scale-105"
                            loading="lazy"
                            sizes={orientation === 'landscape' ? "(max-width: 768px) 60vw, 30vw" : "(max-width: 768px) 40vw, 15vw"}
                            unoptimized
                        />
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                    </Link>

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none">
                        {movie.quality && (
                            <span className="bg-black/80 shadow-md border border-white/10 text-white/90 text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide">
                                {movie.quality}
                            </span>
                        )}
                        {movie.episode_current && (
                            <span className="bg-primary/90 text-black text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                                {movie.episode_current}
                            </span>
                        )}
                    </div>
                </div>

                <div className="mt-2 space-y-0.5 px-0.5">
                    <h3 className="text-white font-bold text-[13px] truncate group-hover/static-card:text-primary transition-colors leading-tight">
                        {movie.name}
                    </h3>
                    <div className="flex items-center justify-between">
                        {movie.origin_name && (
                            <p className="text-white/40 text-[11px] truncate font-medium max-w-[80%]">
                                {movie.origin_name}
                            </p>
                        )}
                        <span className="text-white/30 text-[10px] font-medium">{movie.year || 2024}</span>
                    </div>
                </div>
            </div>

            {isHovered && typeof window !== "undefined" && createPortal(
                <OnflixHoverCard
                    movie={movie}
                    position={position}
                    displayBackdrop={displayBackdrop}
                    orientation={orientation}
                    onMouseEnter={handlePortalMouseEnter}
                    onMouseLeave={handlePortalMouseLeave}
                />,
                document.body
            )}
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
    position: { top: number; left: number; width: number };
    displayBackdrop: string | null;
    orientation: 'portrait' | 'landscape';
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}) {
    const CARD_WIDTH = 320;
    const offsetLeft = (CARD_WIDTH - position.width) / 2;

    // Smart positioning: don't go off-screen
    let left = position.left - offsetLeft;
    if (left < 10) left = 10;
    if (left + CARD_WIDTH > window.innerWidth - 10) left = window.innerWidth - CARD_WIDTH - 10;

    return (
        <div
            className="fixed z-[9999] pointer-events-auto"
            style={{
                top: position.top - 10,
                left,
                width: CARD_WIDTH,
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div className="relative animate-in fade-in zoom-in-95 duration-200 ease-out origin-top">
                {/* Card */}
                <div className="relative bg-[#141414] rounded-xl overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.08)]">

                    {/* Backdrop Image - 16:9 */}
                    <div className="relative aspect-video w-full overflow-hidden bg-[#1a1a1a]">
                        <Image
                            src={displayBackdrop || "/placeholder.jpg"}
                            alt={movie.name}
                            fill
                            className="object-cover"
                            unoptimized
                        />

                        {/* Gradient fading into card body */}
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#141414] via-[#141414]/80 to-transparent" />
                    </div>

                    {/* Card body */}
                    <div className="px-4 pb-4 pt-0 space-y-3 relative z-10 -mt-4">
                        {/* Title and Subtitle */}
                        <div>
                            <h3 className="text-white font-bold text-lg leading-tight truncate">
                                {decodeHtml(movie.name)}
                            </h3>
                            {movie.origin_name && (
                                <p className="text-white/50 text-[13px] leading-tight truncate mt-0.5">
                                    {decodeHtml(movie.origin_name)}
                                </p>
                            )}
                        </div>

                        {/* Action Buttons row */}
                        <div className="flex items-center gap-2.5">
                            {/* Play button (Yellow) */}
                            <Link
                                href={`/xem-phim/${movie.slug}?autoPlay=true`}
                                className="flex-1 flex items-center justify-center gap-2 bg-[#F4C84A] hover:bg-[#ffe58a] text-black font-extrabold text-[14px] h-10 px-4 rounded-full transition-all hover:scale-105"
                            >
                                <Play className="w-4 h-4 fill-current" />
                                Xem ngay
                            </Link>

                            <div className="flex items-center gap-2 shrink-0">
                                {/* Watchlist button */}
                                <WatchlistInlineButton
                                    slug={movie.slug}
                                    movieName={movie.name}
                                    moviePoster={movie.poster_url || movie.thumb_url}
                                    size="md"
                                    className="!w-10 !h-10 rounded-full text-white/80 hover:text-white bg-white/5 hover:bg-white/15 border border-white/20 hover:border-white transition-all hover:scale-105 flex items-center justify-center"
                                />

                                {/* Favorite button */}
                                <div className="w-10 h-10 flex items-center justify-center rounded-full border border-white/20 hover:border-white text-white/80 hover:text-white bg-white/5 hover:bg-white/15 cursor-pointer transition-all hover:scale-105">
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

                                {/* Detail link */}
                                <Link
                                    href={`/phim/${movie.slug}`}
                                    className="w-10 h-10 flex items-center justify-center rounded-full border border-white/20 hover:border-white text-white/80 hover:text-white bg-white/5 hover:bg-white/15 transition-all hover:scale-105"
                                    title="Chi tiết"
                                >
                                    <ChevronDown className="w-5 h-5" />
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
