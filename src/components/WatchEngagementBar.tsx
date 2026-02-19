"use client";

import { Heart, Plus, Share2, Users, Star, MessageSquare, Monitor, Moon, Zap, Flag } from "lucide-react";
import FavoriteButton from "./FavoriteButton";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface WatchEngagementBarProps {
    movie: any;
    isFavorite?: boolean;
    isTheaterMode?: boolean;
    toggleTheater?: () => void;
    isLightOff?: boolean;
    toggleLight?: () => void;
}

export default function WatchEngagementBar({
    movie,
    isFavorite = false,
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
        movieYear: movie.year,
        movieQuality: movie.quality,
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
            style={{ background: 'rgba(15,18,26,0.9)', backdropFilter: 'blur(20px)' }}>

            {/* Controls bar */}
            <div className="flex flex-wrap items-center justify-between gap-y-3 py-3 px-5 border-b border-white/[0.05]"
                style={{ background: 'rgba(0,0,0,0.3)' }}>

                {/* Left */}
                <div className="flex items-center gap-4">
                    <FavoriteButton
                        movieData={movieData}
                        initialIsFavorite={isFavorite}
                        size="sm"
                        className="!bg-transparent !border-0 text-gray-400 hover:text-yellow-400 flex items-center gap-2 !w-auto !h-auto !p-0 transition-colors"
                    />
                    <div className="h-4 w-[1px] bg-white/10" />
                    <button type="button" className="flex items-center gap-2 text-gray-400 hover:text-white transition-all text-xs font-semibold uppercase tracking-wide group">
                        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
                        <span className="hidden sm:inline">Thêm vào</span>
                    </button>
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
                <div className="hidden md:flex items-center gap-5">
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
                <div className="flex items-center gap-4 text-gray-400">
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

                {/* Title & Meta */}
                <div className="flex-grow flex flex-col justify-center min-w-0">
                    <h1 className="text-lg md:text-[20px] font-bold text-white mb-2 leading-tight tracking-tight">
                        {movie.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-400 mb-3">
                        <span className="text-yellow-400 font-medium text-sm">{movie.origin_name}</span>
                        {movie.year && <><span className="w-1 h-1 rounded-full bg-gray-600" /><span>{movie.year}</span></>}
                        {movie.quality && <><span className="w-1 h-1 rounded-full bg-gray-600" />
                            <span className="text-xs px-2 py-0.5 rounded-md font-semibold text-white"
                                style={{ background: 'rgba(255,255,255,0.1)' }}>{movie.quality}</span></>}
                        {movie.time && <><span className="w-1 h-1 rounded-full bg-gray-600" /><span className="text-sm text-gray-400">{movie.time}</span></>}
                    </div>
                    {/* Genre chips - glass style */}
                    <div className="flex flex-wrap gap-2">
                        {movie.category?.slice(0, 4).map((c: any) => (
                            <span key={c.id}
                                className="text-xs px-3 py-1 rounded-full text-gray-300 cursor-pointer transition-all hover:text-white border border-white/[0.08] hover:border-white/20"
                                style={{ background: 'rgba(255,255,255,0.05)' }}>
                                {c.name}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Stats buttons */}
                <div className="flex items-center gap-3 self-center pt-4 md:pt-0 border-t md:border-t-0 border-white/[0.05] w-full md:w-auto justify-center md:justify-end shrink-0">
                    <button className="flex flex-col items-center justify-center min-w-[64px] h-14 rounded-xl transition-all group hover:scale-105 px-3 border border-white/[0.06]"
                        style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <Star className="w-5 h-5 text-gray-400 group-hover:text-yellow-400 mb-1 transition-colors" />
                        <span className="text-[10px] text-gray-400 font-semibold">Đánh giá</span>
                    </button>
                    <button className="flex flex-col items-center justify-center min-w-[64px] h-14 rounded-xl transition-all group hover:scale-105 px-3 border border-white/[0.06]"
                        style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <MessageSquare className="w-5 h-5 text-gray-400 group-hover:text-blue-400 mb-1 transition-colors" />
                        <span className="text-[10px] text-gray-400 font-semibold">Bình luận</span>
                    </button>
                    <div className="flex flex-col items-center justify-center min-w-[110px] h-14 rounded-xl px-4 border"
                        style={{ background: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.2)' }}>
                        <div className="flex items-center gap-1.5 font-bold text-lg leading-none" style={{ color: '#60a5fa' }}>
                            <Star className="w-4 h-4 fill-current" />
                            {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
                        </div>
                        <span className="text-[10px] mt-1 font-medium uppercase tracking-wider" style={{ color: 'rgba(147,197,253,0.6)' }}>Điểm tín nhiệm</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
