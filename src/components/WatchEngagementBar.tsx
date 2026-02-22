"use client";

import { Heart, Plus, Share2, Users, MessageSquare, Monitor, Moon, Zap, Flag } from "lucide-react";
import FavoriteButton from "./FavoriteButton";
import AddToPlaylistButton from "./AddToPlaylistButton";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface WatchEngagementBarProps {
    movie: any;
    isTheaterMode?: boolean;
    toggleTheater?: () => void;
    isLightOff?: boolean;
    toggleLight?: () => void;
}

export default function WatchEngagementBar({
    movie,
    isTheaterMode = false,
    toggleTheater,
    isLightOff = false,
    toggleLight
}: WatchEngagementBarProps) {
    const movieData = {
        movieId: movie._id,
        movieSlug: movie.slug,
        movieName: movie.name,
        movieOriginName: movie.origin_name || "",
        moviePoster: movie.poster_url || movie.thumb_url || "",
        movieYear: Number(movie.year) || new Date().getFullYear(),
        movieQuality: movie.quality || "HD",
        movieVoteAverage: movie.vote_average || 0,
        movieCategories: movie.category?.map((c: any) => c.name) || [],
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({ title: movie.name, url: window.location.href });
        }
    };

    return (
        <div className="rounded-2xl border border-white/[0.06] overflow-hidden"
            style={{ background: '#11131A' }}>

            {/* Controls bar */}
            <div className="flex items-center gap-4 py-3 px-5 border-b border-white/[0.05] overflow-x-auto hide-scrollbar md:flex-wrap md:justify-between md:overflow-visible"
                style={{ background: 'rgba(0,0,0,0.3)' }}>

                {/* Left */}
                <div className="flex items-center shrink-0 gap-4">
                    <FavoriteButton
                        movieData={movieData}
                        size="sm"
                        className="!bg-transparent !border-0 text-gray-400 hover:text-yellow-400 flex items-center gap-2 !w-auto !h-auto !p-0 transition-colors"
                    />
                    <div className="h-4 w-[1px] bg-white/10" />
                    <AddToPlaylistButton
                        movieData={movieData}
                        variant="text"
                        className="text-gray-400 hover:text-white text-xs font-semibold uppercase tracking-wide"
                    />
                    <div className="h-4 w-[1px] bg-white/10" />
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                        Chuyển tập
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                            style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>
                            ON
                        </span>
                    </div>
                </div>

                {/* Center Toggles */}
                <div className="flex items-center shrink-0 gap-5">
                    <button onClick={toggleTheater}
                        className={cn("flex items-center gap-2 text-xs font-semibold transition-all", isTheaterMode ? "text-yellow-400" : "text-gray-400 hover:text-white")}>
                        <Monitor className="w-4 h-4" /> Rạp phim
                        <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold border", isTheaterMode
                            ? "bg-yellow-400/15 text-yellow-400 border-yellow-400/30"
                            : "bg-white/5 text-gray-500 border-white/10")}>
                            {isTheaterMode ? "ON" : "OFF"}
                        </span>
                    </button>
                    <button onClick={toggleLight}
                        className={cn("flex items-center gap-2 text-xs font-semibold transition-all", isLightOff ? "text-yellow-400" : "text-gray-400 hover:text-white")}>
                        <Moon className="w-4 h-4" /> Đèn
                        <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold border", isLightOff
                            ? "bg-yellow-400/15 text-yellow-400 border-yellow-400/30"
                            : "bg-white/5 text-gray-500 border-white/10")}>
                            {isLightOff ? "OFF" : "ON"}
                        </span>
                    </button>
                    <button className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-all">
                        <Zap className="w-4 h-4" /> Anti Lag
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-400/15 text-yellow-400 border border-yellow-400/30">ON</span>
                    </button>
                </div>

                {/* Right */}
                <div className="flex items-center shrink-0 gap-4 text-gray-400">
                    <button type="button" onClick={handleShare} className="flex items-center gap-2 hover:text-white transition-all text-xs font-semibold group">
                        <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span className="hidden sm:inline">Chia sẻ</span>
                    </button>
                    <button type="button" className="hidden sm:flex items-center gap-2 hover:text-white transition-all text-xs font-semibold">
                        <Users className="w-4 h-4" />
                        <span className="hidden lg:inline">Xem chung</span>
                    </button>
                    <button type="button" className="hover:text-red-400 transition-all flex items-center gap-2">
                        <Flag className="w-4 h-4" />
                        <span className="hidden lg:inline text-xs font-semibold">Báo lỗi</span>
                    </button>
                </div>
            </div>

            {/* Movie Info - Premium layout */}
            <div className="flex flex-col md:flex-row gap-5 p-5">
                {/* Poster */}
                <div className="flex-shrink-0">
                    <div className="relative w-16 h-24 md:w-20 md:h-[112px] rounded-xl overflow-hidden shadow-xl ring-1 ring-white/10 transition-transform hover:scale-105 duration-300">
                        <Image
                            src={getImageUrl(movie.poster_url || movie.thumb_url)}
                            alt={movie.name}
                            fill
                            className="object-cover"
                        />
                    </div>
                </div>

                <div className="flex-grow flex flex-col justify-center min-w-0">
                    {/* Vietnamese title */}
                    <h1 className="text-[18px] font-semibold text-white leading-snug tracking-tight mb-1.5 line-clamp-2">
                        {movie.name}
                    </h1>
                    {/* English subtitle + meta */}
                    <div className="flex flex-col gap-1 mb-3">
                        <span className="text-[16px] font-medium text-[#F4C84A] leading-snug">{movie.origin_name}</span>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1" style={{ fontSize: '13px', letterSpacing: '0.3px', opacity: 0.75, color: '#9ca3af' }}>
                            {movie.year && <><span className="w-1 h-1 rounded-full bg-gray-600" /><span>{movie.year}</span></>}
                            {movie.quality && <><span className="w-1 h-1 rounded-full bg-gray-600" />
                                <span className="px-1.5 py-0.5 rounded font-semibold text-white" style={{ background: 'rgba(255,255,255,0.1)', fontSize: '12px' }}>{movie.quality}</span></>}
                            {movie.time && <><span className="w-1 h-1 rounded-full bg-gray-600" /><span>{movie.time}</span></>}
                        </div>
                    </div>
                    {/* Genre chips */}
                    <div className="flex flex-wrap gap-1.5">
                        {movie.category?.slice(0, 4).map((c: any) => (
                            <span key={c.id}
                                className="text-[12px] px-2.5 py-1 rounded-full text-gray-300 cursor-pointer transition-all hover:text-white border border-white/[0.08] hover:border-white/20"
                                style={{ background: 'rgba(255,255,255,0.05)' }}>
                                {c.name}
                            </span>
                        ))}
                    </div>
                </div>

                {/* IMDB Rating Badge — iOS 26 style, only show when rating exists */}
                {movie.vote_average && movie.vote_average > 0 ? (
                    <div className="flex items-center gap-1.5 self-start md:self-center shrink-0"
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '999px',
                            padding: '5px 12px 5px 8px',
                        }}>
                        {/* IMDB yellow label */}
                        <span className="font-black text-xs tracking-tight px-1.5 py-0.5 rounded-sm"
                            style={{ background: '#F5C518', color: '#000', letterSpacing: '-0.3px', fontSize: '11px' }}>
                            IMDb
                        </span>
                        <div className="flex items-baseline gap-0.5">
                            <span className="font-bold text-white" style={{ fontSize: '15px', letterSpacing: '-0.3px' }}>
                                {movie.vote_average.toFixed(1)}
                            </span>
                            <span className="text-white/30 font-normal" style={{ fontSize: '11px' }}>/10</span>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
