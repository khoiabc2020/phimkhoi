"use client";

import FavoriteButton from "@/components/FavoriteButton";
import Link from "next/link";
import Image from "next/image";
import { Play, Info, Star, ChevronDown } from "lucide-react";
import { getImageUrl, decodeHtml } from "@/lib/utils";
import { Movie } from "@/services/api";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { getTMDBDataForCard } from "@/app/actions/tmdb";
import { getTMDBImage } from "@/services/tmdb";

export default function MovieCard({ movie, orientation = 'portrait' }: { movie: Movie, orientation?: 'portrait' | 'landscape' }) {
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
                className="relative block h-full w-full cursor-pointer z-10"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <div className={`relative ${orientation === 'landscape' ? 'aspect-video' : 'aspect-[2/3]'} rounded-md overflow-hidden bg-[#1a1a1a] group/static-card`}>
                    <Link href={`/phim/${movie.slug}`} className="block h-full w-full absolute inset-0 z-0">
                        <Image
                            src={displayPoster || "/placeholder.jpg"}
                            alt={movie.name}
                            fill
                            className={`object-cover transition-opacity duration-500 ${tmdbData ? "opacity-100" : "opacity-95"}`}
                            loading="lazy"
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 20vw, 15vw"
                        />
                    </Link>

                    {/* Status/Episode Badge */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none">
                        {movie.quality && (
                            <span className="bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-1.5 py-0.5 rounded border border-white/10">
                                {movie.quality}
                            </span>
                        )}
                        {movie.episode_current && (
                            <span className="bg-primary/90 text-black text-[9px] font-bold px-1.5 py-0.5 rounded">
                                {movie.episode_current}
                            </span>
                        )}
                    </div>

                    {/* Touch Friendly Favorite Button - Visible on Touch or Hover */}
                    <div className={`absolute top-2 right-2 z-20 ${isTouchDevice ? 'opacity-100' : 'opacity-0 group-hover/static-card:opacity-100'} transition-opacity duration-200`}>
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
                            initialIsFavorite={false} // Would need real state but for list view false is safer or pass in
                            size="sm"
                        />
                    </div>

                    {/* Rating Badge (If TMDB available) - Moved down slightly if button is present */}
                    {displayRating && (
                        <div className="absolute bottom-2 right-2 z-10 animate-in fade-in duration-300 pointer-events-none">
                            <span className="bg-yellow-500/90 text-black text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm">
                                <Star size={8} fill="currentColor" /> {displayRating}
                            </span>
                        </div>
                    )}
                </div>

                <div className="mt-2 space-y-0.5">
                    <h3 className="text-white font-bold text-[11px] truncate group-hover:text-primary transition-colors leading-tight">
                        {movie.name}
                    </h3>
                    {movie.origin_name && (
                        <p className="text-gray-400 text-[10px] truncate font-medium group-hover:text-white/80 transition-colors">
                            {movie.origin_name}
                        </p>
                    )}
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
                <div className="relative bg-gradient-to-br from-[#1a1a1a]/95 via-[#181818]/90 to-[#141414]/95 backdrop-blur-2xl rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.8),0_0_1px_rgba(255,255,255,0.1)] overflow-hidden border border-white/10 transition-all duration-500 ease-out hover:border-white/20 hover:shadow-[0_12px_48px_rgba(0,0,0,0.9),0_0_2px_rgba(255,255,255,0.2)]">

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

                    {/* Info Section with glassmorphism - More compact */}
                    <div className="relative p-2 space-y-1.5 bg-gradient-to-b from-[#1a1a1a]/50 to-[#181818]/80 backdrop-blur-xl">
                        {/* Subtle inner glow */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

                        {/* Actions - More compact */}
                        <div className="relative flex items-center gap-1 z-10">
                            <Link
                                href={`/xem-phim/${movie.slug}`}
                                className="flex-1 bg-white/95 hover:bg-white text-black font-bold text-[11px] py-1.5 px-2 rounded-md flex items-center justify-center gap-1 transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] backdrop-blur-sm"
                            >
                                <Play size={11} fill="currentColor" /> Xem
                            </Link>
                            <div className="w-7 h-7 flex items-center justify-center rounded-full border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 cursor-pointer backdrop-blur-md transition-all duration-300 ease-out hover:scale-110 active:scale-95">
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
                                    initialIsFavorite={false}
                                    size="sm"
                                    className="w-full h-full text-white hover:text-red-500"
                                />
                            </div>
                            <Link
                                href={`/phim/${movie.slug}`}
                                className="w-7 h-7 flex items-center justify-center rounded-full border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 text-white transition-all duration-300 ease-out hover:scale-110 active:scale-95 backdrop-blur-md"
                                title="Chi tiết"
                            >
                                <ChevronDown size={12} />
                            </Link>
                        </div>

                        {/* Metadata - More compact */}
                        <div className="relative flex flex-wrap items-center gap-1.5 text-[10px] font-medium text-gray-400 z-10">
                            <span className="text-green-400 transition-colors duration-300 group-hover/card:text-green-300">{movie.match || "98%"}</span>
                            <span className="border border-white/20 bg-white/5 px-1.5 py-0.5 rounded backdrop-blur-sm text-gray-300 transition-all duration-300 hover:border-white/30 hover:bg-white/10">{movie.quality || "HD"}</span>
                            <span className="transition-colors duration-300 group-hover/card:text-gray-300">{movie.year}</span>
                            {movie.episode_current && <span className="transition-colors duration-300 group-hover/card:text-gray-300">{movie.episode_current}</span>}
                        </div>

                        {/* Genres - More compact */}
                        <div className="relative flex flex-wrap gap-1 z-10">
                            {movie.category?.slice(0, 2).map((c) => (
                                <span key={c.id} className="text-[9px] text-gray-400 transition-colors duration-300 group-hover/card:text-gray-300 relative after:content-['•'] after:ml-1 last:after:content-['']">
                                    {c.name}
                                </span>
                            ))}
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

