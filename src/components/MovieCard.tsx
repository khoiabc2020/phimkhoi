"use client";

import FavoriteButton from "@/components/FavoriteButton";
import WatchlistInlineButton from "@/components/WatchlistInlineButton";
import Link from "next/link";
import Image from "next/image";
import { Play, Info, Star, ChevronDown } from "lucide-react";
import { getImageUrl, decodeHtml, cn, detectOrientation } from "@/lib/utils";
import { Movie } from "@/services/api";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { getTMDBImage } from "@/services/tmdb";

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

    // Poster (ảnh dọc) – ưu tiên poster thật, tránh nhầm thumb/backdrop vào slot dọc
    const tmdbPoster =
        (movie as any).tmdbData?.poster_path
            ? getTMDBImage((movie as any).tmdbData.poster_path, "w780")
            : null;

    const sourcePoster = movie.poster_url && detectOrientation(movie.poster_url) === "portrait"
        ? movie.poster_url
        : null;
    const thumbAsPoster = movie.thumb_url && detectOrientation(movie.thumb_url) === "portrait"
        ? movie.thumb_url
        : null;

    const portraitPosterSource =
        sourcePoster ||            // poster từ KKPhim/OPhim/NguonC (ảnh dọc hợp lệ)
        thumbAsPoster ||           // fallback khi source trả nhầm field nhưng ảnh vẫn dọc
        tmdbPoster ||              // poster TMDB (đảm bảo ảnh dọc)
        "";
    const noCropPortrait = orientation === "portrait";
    const relaxedPosterSource = movie.poster_url || movie.thumb_url || tmdbPoster || "";

    // Build robust fallback candidates to avoid blank placeholder cards.
    // Priority:
    // - portrait cards: strict portrait source -> relaxed source -> opposite field -> tmdb
    // - landscape cards: thumb -> poster -> tmdb backdrop -> tmdb poster
    const posterCandidates = Array.from(
        new Set(
            (orientation === "landscape"
                ? [
                    movie.thumb_url,
                    movie.poster_url,
                    (movie as any).tmdbData?.backdrop_path ? getTMDBImage((movie as any).tmdbData.backdrop_path, "w780") : null,
                    tmdbPoster,
                ]
                : [
                    portraitPosterSource,
                    relaxedPosterSource,
                    movie.thumb_url,
                    movie.poster_url,
                    tmdbPoster,
                ]).filter(Boolean) as string[]
        )
    );
    const [posterIndex, setPosterIndex] = useState(0);
    const activePosterSrc = posterCandidates[posterIndex] ? getImageUrl(posterCandidates[posterIndex]) : "/placeholder.svg";

    // Backdrop/overlay (ảnh ngang): TMDB backdrop first, then whichever source URL is truly landscape.
    // Never use a portrait URL in the overlay — it looks cropped and wrong.
    const tmdbBackdrop =
        (movie as any).tmdbData?.backdrop_path
            ? getTMDBImage((movie as any).tmdbData.backdrop_path)
            : null;

    let sourceBackdrop: string | null = null;
    if (movie.poster_url && detectOrientation(movie.poster_url) === "landscape") {
        sourceBackdrop = movie.poster_url;
    } else if (movie.thumb_url && detectOrientation(movie.thumb_url) === "landscape") {
        sourceBackdrop = movie.thumb_url;
    } else {
        sourceBackdrop = movie.poster_url || movie.thumb_url;
    }

    const displayBackdrop = tmdbBackdrop || (sourceBackdrop ? getImageUrl(sourceBackdrop) : null);

    // Reset fallback state when card movie changes
    useEffect(() => {
        setPosterIndex(0);
    }, [movie.slug, orientation]);

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
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <div className={`relative ${orientation === 'landscape' ? 'aspect-video' : 'aspect-[2/3]'} rounded-[10px] overflow-hidden bg-[#0b101a] ring-1 ring-white/5 group-hover/static-card:ring-2 group-hover/static-card:ring-[#8FA7C5]/60 transition-all duration-300 shadow-lg`}>
                    <Link href={`/phim/${movie.slug}`} className="block h-full w-full absolute inset-0 z-0" prefetch={false}>
                        <Image
                            src={activePosterSrc || "/placeholder.svg"}
                            alt={decodeHtml(movie.name) || movie.slug || "Phim"}
                            fill
                            className={cn(
                                "transition-transform duration-200 ease-out group-hover/static-card:scale-[1.03]",
                                noCropPortrait ? "object-contain bg-[#0a0f1a]" : "object-cover"
                            )}
                            sizes={orientation === 'landscape' ? "(max-width: 768px) 68vw, 36vw" : "(max-width: 768px) 48vw, (max-width: 1280px) 220px, 250px"}
                            loading="lazy"
                            priority={false}
                            placeholder="blur"
                            blurDataURL="data:image/webp;base64,UklGRmIAAABXRUJQVlA4IFYAAAAwAQCdASoIAAUAAUAmJaQAA3AA/vx5nAAA/uX3L5B5mR5s3h9n189o9D0Nnv/qJ/93sAf//1kP/+cIIf//2I//97kf///eP///zGf//42gAA=="
                            onError={(e) => {
                                if (posterIndex < posterCandidates.length - 1) {
                                    setPosterIndex((prev) => prev + 1);
                                    return;
                                }
                                (e.target as HTMLImageElement).src = "/placeholder.svg";
                            }}
                        />
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                    </Link>

                    {/* Badges */}
                    {movie.episode_current && (
                        <div className="absolute top-2 left-2 z-10 pointer-events-none">
                            <span className="bg-primary/90 text-black text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                                {movie.episode_current}
                            </span>
                        </div>
                    )}

                    {formatQualityLabel(movie.quality) && (
                        <div className="absolute top-2 right-2 z-10 pointer-events-none flex flex-col items-end gap-1">
                            <span className="bg-black/75 shadow-md border border-white/10 text-white/90 text-[10px] font-bold px-1.5 py-0.5 rounded max-w-[56px] truncate">
                                {formatQualityLabel(movie.quality)}
                            </span>
                        </div>
                    )}
                    {/* Rating Badge bottom-right */}
                    {(movie as any).vote_average && (movie as any).vote_average > 0 && (
                        <div className="absolute bottom-2 right-2 z-10 pointer-events-none flex items-center gap-0.5 bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5">
                            <Star className="w-2.5 h-2.5 fill-[#8FA7C5] text-[#8FA7C5]" />
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
                        <span className="text-white/30 text-[10px] font-medium">{movie.year && Number(movie.year) > 0 ? movie.year : ""}</span>
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
    // Disable trailer iframe in hover card for faster UI response and less jank.

    const CARD_WIDTH = 320;
    const offsetLeft = (CARD_WIDTH - position.width) / 2;

    // Smart positioning: don't go off-screen horizontally
    let left = position.left - offsetLeft;
    if (left < 10) left = 10;
    if (left + CARD_WIDTH > window.innerWidth - 10) left = window.innerWidth - CARD_WIDTH - 10;

    // Smart positioning: don't go off-screen vertically
    const ESTIMATED_CARD_HEIGHT = 380;
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
            <div className="relative animate-in fade-in zoom-in-95 duration-150 ease-out origin-top">
                {/* Card */}
                <div className="relative overflow-hidden rounded-[10px] border border-white/[0.08] bg-[#0c1018]/95 shadow-[0_12px_30px_#00000080]">

                    {/* Overlay media — taller and less cropped so faces are easier to see */}
                    <div className="relative aspect-[16/8.6] w-full overflow-hidden bg-[#1a1a1a]">
                        {/* Skeleton hiển thị khi ảnh chưa load xong */}
                        {!imgLoaded && !hasError && (
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/[0.02] animate-pulse" />
                        )}
                        {displayBackdrop ? (
                            <Image
                                src={displayBackdrop}
                                alt={decodeHtml(movie.name) || movie.slug || "Phim"}
                                fill
                                className={`object-cover object-top transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                                priority
                                onLoad={() => setImgLoaded(true)}
                                onError={() => { setImgLoaded(true); setHasError(true); }}
                            />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-[#151823] to-[#0b0d13]" />
                        )}

                        {/* Gradient fading into card body */}
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#141414] via-[#141414]/80 to-transparent z-20 pointer-events-none" />
                    </div>

                    {/* Card body */}
                    <div className="px-4 pb-5 pt-2 space-y-3 relative z-10 bg-[#141414]">
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
                                className="flex-1 min-w-0 flex items-center justify-center gap-1.5 bg-[#8FA7C5] hover:bg-[#a8bdd8] text-[#0a0a0a] font-extrabold text-[13px] h-9 px-3 rounded-full transition-all hover:scale-105 shadow-[0_2px_12px_rgba(229,9,20,0.5)]"
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

                        {/* Short description to avoid empty-looking bottom area */}
                        {movie.content && (
                            <p className="text-[12px] text-white/45 line-clamp-2 leading-relaxed">
                                {decodeHtml(movie.content).replace(/<[^>]+>/g, "")}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default React.memo(MovieCard);
