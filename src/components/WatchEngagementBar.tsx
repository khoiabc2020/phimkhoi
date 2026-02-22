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

            {/* Movie Info - luôn nằm ngang trên mọi thiết bị */}
            <div className="flex flex-row gap-4 p-4 md:p-5 items-start">
                {/* Poster */}
                <div className="flex-shrink-0">
                    <div className="relative w-20 h-[112px] md:w-24 md:h-[134px] rounded-xl overflow-hidden shadow-xl ring-1 ring-white/10">
                        <Image
                            src={getImageUrl(movie.poster_url || movie.thumb_url)}
                            alt={movie.name}
                            fill
                            className="object-cover"
                        />
                    </div>
                </div>

                {/* Info bên phải */}
                <div className="flex-grow min-w-0 flex flex-col justify-start gap-1.5">
                    {/* Tên Tiếng Việt */}
                    <h1 className="text-[16px] md:text-[18px] font-semibold text-white leading-snug tracking-tight line-clamp-2">
                        {movie.name}
                    </h1>
                    {/* Tên gốc */}
                    <span className="text-[13px] font-medium text-[#F4C84A] leading-snug line-clamp-1">{movie.origin_name}</span>
                    {/* Meta: năm • chất lượng • thời lượng */}
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1" style={{ fontSize: '12px', color: '#6b7280' }}>
                        {movie.year && <><span className="w-1 h-1 rounded-full bg-gray-600 inline-block" /><span>{movie.year}</span></>}
                        {movie.quality && <><span className="w-1 h-1 rounded-full bg-gray-600 inline-block" />
                            <span className="px-1.5 py-0.5 rounded font-semibold text-white" style={{ background: 'rgba(255,255,255,0.1)', fontSize: '11px' }}>{movie.quality}</span></>}
                        {movie.time && <><span className="w-1 h-1 rounded-full bg-gray-600 inline-block" /><span>{movie.time}</span></>}
                    </div>
                    {/* Genres + IMDB badge cùng hàng */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        {movie.category?.slice(0, 3).map((c: any) => (
                            <span key={c.id}
                                className="text-[11px] px-2 py-0.5 rounded-full text-gray-300 border border-white/[0.08]"
                                style={{ background: 'rgba(255,255,255,0.05)' }}>
                                {c.name}
                            </span>
                        ))}
                        {/* IMDB — iOS 26 pill */}
                        {movie.vote_average && movie.vote_average > 0 ? (
                            <div className="flex items-center gap-1 shrink-0"
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    backdropFilter: 'blur(12px)',
                                    WebkitBackdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '999px',
                                    padding: '3px 8px 3px 5px',
                                }}>
                                <span className="font-black px-1 py-0.5 rounded-sm"
                                    style={{ background: '#F5C518', color: '#000', fontSize: '10px' }}>
                                    IMDb
                                </span>
                                <span className="font-bold text-white" style={{ fontSize: '13px' }}>
                                    {movie.vote_average.toFixed(1)}
                                </span>
                                <span className="text-white/30" style={{ fontSize: '10px' }}>/10</span>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
