"use client";

import FavoriteButton from "@/components/FavoriteButton";
import Link from "next/link";
import Image from "next/image";
import { Play, Info, Star, ChevronDown } from "lucide-react";
import { getImageUrl, decodeHtml } from "@/lib/utils";
import { Movie } from "@/services/api";
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { getTMDBDataForCard } from "@/app/actions/tmdb";
import { getTMDBImage } from "@/services/tmdb";

function MovieCard({ movie, orientation = 'portrait' }: { movie: Movie, orientation?: 'portrait' | 'landscape' }) {
    const [isHovered, setIsHovered] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
    const [isTouchDevice, setIsTouchDevice] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // TMDB Hydration State
    const [tmdbData, setTmdbData] = useState<{ poster_path: string; backdrop_path?: string; vote_average: number } | null>(null);

    // ... (rest of useEffects)

    // Determine final display data
    const displayPoster = orientation === 'landscape'
        ? (tmdbData?.backdrop_path ? getTMDBImage(tmdbData.backdrop_path, "w780") : getImageUrl(movie.thumb_url || movie.poster_url))
        : (tmdbData?.poster_path ? getTMDBImage(tmdbData.poster_path, "w780") : getImageUrl(movie.poster_url || movie.thumb_url));

    const displayRating = tmdbData?.vote_average
        ? Math.round(tmdbData.vote_average * 10) + "%" // Convert 9.1 → 91%
        : null;

    const handleMouseEnter = () => {
        // Disable hover expansion on touch devices
        if (isTouchDevice) return;

        // Clear any pending leave timeout
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
        }, 300); // 300ms delay before showing hover card
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        // Longer grace period to move to portal card
        leaveTimeoutRef.current = setTimeout(() => {
            setIsHovered(false);
        }, 500); // 500ms grace time to move mouse to portal card
    };

    const handlePortalMouseEnter = () => {
        // Cancel any pending leave timeout when mouse enters portal
        if (leaveTimeoutRef.current) {
            clearTimeout(leaveTimeoutRef.current);
            leaveTimeoutRef.current = null;
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };

    const handlePortalMouseLeave = () => {
        // Hide immediately when leaving portal card
        if (leaveTimeoutRef.current) {
            clearTimeout(leaveTimeoutRef.current);
        }
        leaveTimeoutRef.current = setTimeout(() => {
            setIsHovered(false);
        }, 200);
    };

    return (
        <>
            <div
                ref={cardRef}
                className="relative block h-full w-full cursor-pointer z-10 group/static-card card-hover-3d"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <div className={`relative ${orientation === 'landscape' ? 'aspect-video' : 'aspect-[2/3]'} rounded-2xl overflow-hidden bg-[#1a1a1a] shadow-lg`}>
                    <Link href={`/phim/${movie.slug}`} className="block h-full w-full absolute inset-0 z-0">
                        <Image
                            src={displayPoster || "/placeholder.jpg"}
                            alt={movie.name}
                            fill
                            className="object-cover transition-transform duration-500 ease-out group-hover/static-card:scale-105"
                            loading="lazy"
                            sizes={orientation === 'landscape' ? "(max-width: 768px) 60vw, (max-width: 1200px) 30vw, 25vw" : "(max-width: 768px) 40vw, (max-width: 1200px) 20vw, 15vw"}
                        />
                        {/* Gradient Overlay cho Text - Đổi từ gradient nặng (to-t) sang phủ đen nhẹ */}
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                    </Link>

                    {/* Status/Episode Badge - Apple Style: Small, Blur, Clean */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10 pointer-events-none">
                        {movie.quality && (
                            <span className="bg-[#1A1C23]/95 border border-white/10 text-white/90 text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wide">
                                {movie.quality}
                            </span>
                        )}
                        {movie.episode_current && (
                            <span className="bg-primary/90 text-black text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                                {movie.episode_current}
                            </span>
                        )}
                    </div>

                    {/* Touch Friendly Favorite Button */}
                    <div className={`absolute top-2 right-2 z-20 ${isTouchDevice ? 'opacity-100' : 'opacity-0 group-hover/static-card:opacity-100'} transition-opacity duration-200`}>
                        <div className="bg-[#1A1C23]/90 rounded-full p-1 shadow-sm">
                            <FavoriteButton
                                movieData={{
                                    movieId: movie._id,
                                    movieSlug: movie.slug,
                                    movieName: movie.name,
                                    movieOriginName: movie.origin_name,
                                    moviePoster: movie.poster_url,
                                    movieYear: movie.year,
                                    movieQuality: movie.quality,
                                    movieCategories: movie.category?.map(c => c.name) || []
                                }}
                                size="sm"
                            />
                        </div>
                    </div>

                    {/* Rating Badge - Minimalist */}
                    {displayRating && (
                        <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
                            <div className="flex items-center gap-1 bg-[#1A1C23]/95 border border-white/10 px-1.5 py-0.5 rounded-md shadow-sm">
                                <Star size={10} fill="#F4C84A" className="text-[#F4C84A]" />
                                <span className="text-white text-[10px] font-bold">{displayRating}</span>
                            </div>
                        </div>
                    )}
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

            {/* Portal for Hover Card - Renders outside z-index stacking context */}
            {isHovered && <PortalHoverCard
                movie={movie}
                position={position}
                tmdbData={tmdbData}
                displayPoster={displayPoster}
                orientation={orientation}
                onMouseEnter={handlePortalMouseEnter}
                onMouseLeave={handlePortalMouseLeave}
            />}
        </>
    );
}

function PortalHoverCard({ movie, position, tmdbData, displayPoster, orientation, onMouseEnter, onMouseLeave }: { movie: Movie, position: any, tmdbData: any, displayPoster: string | null, orientation: 'portrait' | 'landscape', onMouseEnter: () => void, onMouseLeave: () => void }) {
    const scale = 1.2;
    const scaledWidth = position.width * scale;
    const offsetLeft = (scaledWidth - position.width) / 2;

    const rating = tmdbData?.vote_average ? tmdbData.vote_average.toFixed(1) : null;

    return createPortal(
        <div
            className="absolute z-40 transition-all duration-500 ease-out"
            style={{
                top: position.top - 10,
                left: position.left - offsetLeft,
                width: scaledWidth,
                pointerEvents: 'auto'
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {/* Apple Liquid Glass Effect Container */}
            <div className="relative group/card animate-in fade-in zoom-in-95 duration-300 ease-out">
                {/* Outer glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-br from-white/10 via-transparent to-white/5 rounded-lg blur-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />

                {/* Main card with glassmorphism */}
                <div className="relative bg-[#111111] rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.8),0_0_1px_rgba(255,255,255,0.1)] overflow-hidden border border-white/10 transition-all duration-500 ease-out hover:border-white/20 hover:shadow-[0_12px_48px_rgba(0,0,0,0.9),0_0_2px_rgba(255,255,255,0.2)]">

                    {/* Animated gradient overlay - Apple style */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none" />

                    {/* Shimmer effect on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-1000">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/card:translate-x-full transition-transform duration-1500 ease-out" />
                    </div>

                    {/* Image Section - More compact */}
                    <div className={`relative ${orientation === 'landscape' ? 'aspect-video' : 'aspect-[3/4]'} w-full overflow-hidden`}>
                        <Image
                            src={displayPoster || "/placeholder.jpg"}
                            alt={movie.name}
                            fill
                            className="object-cover transition-transform duration-700 ease-out group-hover/card:scale-105"
                        />

                        {/* Multi-layer gradient overlay - Apple style */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-[#181818]/40 to-transparent opacity-90" />
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/60" />

                        {/* Frosted glass effect at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#181818] via-[#181818]/90 to-transparent" />

                        {/* Rating Badge (If TMDB available) inside hover */}
                        {rating && (
                            <div className="absolute top-2 right-2 z-10">
                                <span className="bg-[#fbbf24] text-black text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-md">
                                    <Star size={10} fill="currentColor" /> {rating}
                                </span>
                            </div>
                        )}

                        <div className="absolute bottom-2 left-3 right-3 z-10">
                            <h3 className="text-white font-extrabold text-base leading-tight drop-shadow-md line-clamp-1 transition-all duration-300 group-hover/card:text-[#fbbf24]">
                                {decodeHtml(movie.name)}
                            </h3>
                            {movie.origin_name && (
                                <p className="text-gray-300 text-[12px] leading-tight drop-shadow-sm line-clamp-1 italic mt-1 font-medium">
                                    {decodeHtml(movie.origin_name)}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Info Section - High Density Optimization */}
                    <div className="relative px-2 py-2 space-y-1 bg-[#111111]">
                        {/* Subtle inner glow */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

                        {/* Actions - Ultra Compact */}
                        <div className="relative flex items-center gap-1.5 z-10 mb-1.5">
                            <Link
                                href={`/xem-phim/${movie.slug}`}
                                className="flex-1 bg-white hover:bg-gray-200 text-black font-bold text-[10px] h-6 rounded flex items-center justify-center gap-1 transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                            >
                                <Play size={10} fill="currentColor" /> Xem
                            </Link>
                            <div className="w-6 h-6 flex items-center justify-center rounded-full border border-white/20 bg-white/10 hover:bg-white/20 cursor-pointer transition-all duration-300 ease-out hover:scale-110 active:scale-95">
                                <FavoriteButton
                                    movieData={{
                                        movieId: movie._id,
                                        movieSlug: movie.slug,
                                        movieName: movie.name,
                                        movieOriginName: movie.origin_name,
                                        moviePoster: movie.poster_url || movie.thumb_url,
                                        movieYear: movie.year,
                                        movieQuality: movie.quality,
                                        movieCategories: movie.category?.map((c) => c.name) || [],
                                    }}
                                    size="sm"
                                    className="w-3.5 h-3.5 text-white hover:text-red-500"
                                />
                            </div>
                            <Link
                                href={`/phim/${movie.slug}`}
                                className="w-6 h-6 flex items-center justify-center rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white transition-all duration-300 ease-out hover:scale-110 active:scale-95"
                                title="Chi tiết"
                            >
                                <ChevronDown size={12} />
                            </Link>
                        </div>

                        {/* Metadata - Ultra Compact */}
                        <div className="relative flex flex-wrap items-center gap-1 text-[9px] font-medium text-gray-400 z-10">
                            <span className="text-green-400">{movie.match || "98%"}</span>
                            <span className="w-0.5 h-0.5 rounded-full bg-gray-600"></span>
                            <span className="border border-white/10 bg-white/5 px-1 rounded-[3px] text-gray-300">{movie.quality || "HD"}</span>
                            <span className="w-0.5 h-0.5 rounded-full bg-gray-600"></span>
                            <span>{movie.year}</span>
                        </div>

                        {/* Genres - Single Line Truncated */}
                        <div className="relative z-10">
                            <p className="text-[9px] text-gray-500 truncate leading-none">
                                {movie.category?.map(c => c.name).join(' • ')}
                            </p>
                        </div>
                    </div>

                    {/* Bottom edge highlight - Apple style */}
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
            </div>
        </div>,
        document.body
    );
}

export default React.memo(MovieCard);

