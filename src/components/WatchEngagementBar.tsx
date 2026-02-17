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
            navigator.share({
                title: movie.name,
                url: window.location.href,
            });
        }
    };

    return (
        <div className="flex flex-col w-full bg-[#1a1a1a] rounded-xl border border-white/5 overflow-hidden">
            {/* Control Bar (Black) */}
            <div className="flex flex-wrap items-center justify-between gap-y-3 py-3 px-4 bg-black/50 border-b border-white/5">

                {/* Left Actions */}
                <div className="flex items-center gap-4">
                    <FavoriteButton
                        movieData={movieData}
                        initialIsFavorite={isFavorite}
                        size="sm"
                        className="!bg-transparent !border-0 text-gray-400 hover:text-[#fbbf24] flex items-center gap-2 !w-auto !h-auto !p-0"
                    />
                    <div className="h-4 w-[1px] bg-white/10" />
                    <button type="button" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wide">
                        <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Thêm vào</span>
                    </button>
                    <div className="h-4 w-[1px] bg-white/10" />
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                        Chuyển tập <span className="px-1.5 py-0.5 bg-[#fbbf24] text-black rounded text-[10px]">ON</span>
                    </div>
                </div>

                {/* Center Toggles */}
                <div className="hidden md:flex items-center gap-6">
                    <button onClick={toggleTheater} className={cn("flex items-center gap-2 text-xs font-bold transition-colors", isTheaterMode ? "text-[#fbbf24]" : "text-gray-400 hover:text-white")}>
                        <Monitor className="w-4 h-4" /> Rạp phim <span className={cn("px-1.5 py-0.5 rounded text-[10px]", isTheaterMode ? "bg-[#fbbf24] text-black" : "bg-white/10 text-gray-400")}>{isTheaterMode ? "ON" : "OFF"}</span>
                    </button>
                    <button onClick={toggleLight} className={cn("flex items-center gap-2 text-xs font-bold transition-colors", isLightOff ? "text-[#fbbf24]" : "text-gray-400 hover:text-white")}>
                        <Moon className="w-4 h-4" /> Đèn <span className={cn("px-1.5 py-0.5 rounded text-[10px]", isLightOff ? "bg-[#fbbf24] text-black" : "bg-white/10 text-gray-400")}>{isLightOff ? "OFF" : "ON"}</span>
                    </button>
                    <button className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors">
                        <Zap className="w-4 h-4" /> Anti Lag <span className="px-1.5 py-0.5 bg-[#fbbf24] text-black rounded text-[10px]">ON</span>
                    </button>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4 text-gray-400">
                    <button type="button" onClick={handleShare} className="flex items-center gap-2 hover:text-white transition-colors text-xs font-bold">
                        <Share2 className="w-4 h-4" /> <span className="hidden sm:inline">Chia sẻ</span>
                    </button>
                    <button type="button" className="hidden sm:flex items-center gap-2 hover:text-white transition-colors text-xs font-bold">
                        <Users className="w-4 h-4" /> <span className="hidden lg:inline">Xem chung</span>
                    </button>
                    <button type="button" className="hover:text-red-500 transition-colors flex items-center gap-2" title="Báo lỗi">
                        <Flag className="w-4 h-4" /> <span className="hidden lg:inline text-xs font-bold">Báo lỗi</span>
                    </button>
                </div>
            </div>

            {/* Movie Info Section (Below Bar) - Matches Screenshot */}
            <div className="flex flex-col md:flex-row gap-6 p-4 bg-[#111]">
                {/* Poster - Small Vertical */}
                <div className="flex-shrink-0">
                    <div className="relative w-16 h-24 md:w-20 md:h-28 rounded overflow-hidden shadow-lg ring-1 ring-white/10">
                        <Image
                            src={getImageUrl(movie.poster_url || movie.thumb_url)}
                            alt={movie.name}
                            fill
                            className="object-cover"
                        />
                    </div>
                </div>

                {/* Info Text */}
                <div className="flex-grow flex flex-col justify-center">
                    <h1 className="text-xl md:text-2xl font-bold text-white mb-1.5 leading-tight">
                        {movie.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400 mb-2">
                        <span className="text-[#fbbf24] font-medium">{movie.origin_name}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-600" />
                        <span>{movie.year}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-600" />
                        <span className="px-1.5 py-0.5 bg-white/10 rounded text-xs text-white">{movie.quality}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-600" />
                        <span className="text-gray-400">{movie.time || "N/A"}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {movie.category?.slice(0, 3).map((c: any) => (
                            <span key={c.id} className="text-xs px-2 py-0.5 rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-white/30 cursor-pointer transition-colors">
                                {c.name}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Right Stats/Actions */}
                <div className="flex items-center gap-3 self-center md:self-auto pt-4 md:pt-0 border-t md:border-t-0 border-white/5 w-full md:w-auto justify-center md:justify-end">
                    <button className="flex flex-col items-center justify-center min-w-[60px] h-14 bg-[#1f2937]/50 hover:bg-[#1f2937] rounded-lg transition-colors group px-3">
                        <Star className="w-5 h-5 text-gray-400 group-hover:text-[#fbbf24] mb-1" />
                        <span className="text-[10px] text-gray-400 font-bold">Đánh giá</span>
                    </button>
                    <button className="flex flex-col items-center justify-center min-w-[60px] h-14 bg-[#1f2937]/50 hover:bg-[#1f2937] rounded-lg transition-colors group px-3">
                        <MessageSquare className="w-5 h-5 text-gray-400 group-hover:text-blue-400 mb-1" />
                        <span className="text-[10px] text-gray-400 font-bold">Bình luận</span>
                    </button>
                    <div className="flex flex-col items-center justify-center min-w-[120px] h-14 bg-gradient-to-r from-blue-600/20 to-blue-500/20 border border-blue-500/30 rounded-lg px-4">
                        <div className="flex items-center gap-1.5 text-blue-400 font-bold text-lg leading-none">
                            <Star className="w-4 h-4 fill-blue-400" />
                            {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
                        </div>
                        <span className="text-[10px] text-blue-300/70 mt-1 font-medium uppercase tracking-wider">Điểm tín nhiệm</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
