"use client";

import { Heart, Plus, Share2, Radio, Subtitles, Flag, Users, Star, MessageSquare } from "lucide-react";
import FavoriteButton from "./FavoriteButton";

interface WatchEngagementBarProps {
    movie: {
        _id: string;
        name: string;
        slug: string;
        origin_name: string;
        poster_url?: string;
        thumb_url?: string;
        year: number;
        quality: string;
        vote_average?: number;
        category?: { name: string }[];
    };
    isFavorite?: boolean;
}

export default function WatchEngagementBar({ movie, isFavorite = false }: WatchEngagementBarProps) {
    const movieData = {
        movieId: movie._id,
        movieSlug: movie.slug,
        movieName: movie.name,
        movieOriginName: movie.origin_name || "",
        moviePoster: movie.poster_url || movie.thumb_url || "",
        movieYear: movie.year,
        movieQuality: movie.quality,
        movieVoteAverage: movie.vote_average || 0,
        movieCategories: movie.category?.map((c) => c.name) || [],
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: movie.name,
                url: window.location.href,
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
        }
    };

    const iconBtn = "w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all active:scale-95";

    return (
        <div className="flex flex-col w-full">
            {/* Control Bar (Black) */}
            <div className="flex flex-wrap items-center justify-between gap-y-3 py-3 px-4 bg-black border-b border-white/10 rounded-b-xl">

                {/* Left Actions */}
                <div className="flex items-center gap-6">
                    <FavoriteButton
                        movieData={movieData}
                        initialIsFavorite={isFavorite}
                        size="sm"
                        className="!bg-transparent !border-0 text-gray-400 hover:text-[#fbbf24] flex items-center gap-2 !w-auto !h-auto !p-0"
                    />
                    <button type="button" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wide">
                        <Plus className="w-4 h-4" /> Thêm vào
                    </button>
                </div>

                {/* Center Toggles */}
                <div className="hidden md:flex items-center gap-6">
                    <button className="flex items-center gap-2 text-xs font-bold text-white hover:text-[#fbbf24] transition-colors">
                        Chuyển tập <span className="px-1 py-0.5 bg-[#fbbf24] text-black rounded-[3px] text-[9px]">ON</span>
                    </button>
                    <button className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-white transition-colors">
                        Rạp phim <span className="px-1 py-0.5 bg-white/10 text-gray-400 rounded-[3px] text-[9px]">OFF</span>
                    </button>
                    <button className="flex items-center gap-2 text-xs font-bold text-white hover:text-[#fbbf24] transition-colors">
                        Anti Lé <span className="px-1 py-0.5 bg-[#fbbf24] text-black rounded-[3px] text-[9px]">ON</span>
                    </button>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4 text-gray-400">
                    <button type="button" onClick={handleShare} className="flex items-center gap-2 hover:text-white transition-colors text-xs font-bold">
                        <Share2 className="w-4 h-4" /> <span className="hidden sm:inline">Chia sẻ</span>
                    </button>
                    <button type="button" className="hidden sm:flex items-center gap-2 hover:text-white transition-colors text-xs font-bold">
                        <Users className="w-4 h-4" /> Xem chung
                    </button>
                    <button className="hidden lg:flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-white transition-colors">
                        Lạ đời <span className="px-1 py-0.5 bg-white/10 text-gray-400 rounded-[3px] text-[9px]">OFF</span>
                    </button>
                    <button type="button" className="hover:text-red-500 transition-colors" title="Báo lỗi">
                        <Flag className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Movie Info Section (Below Bar) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-[#111] border-b border-white/5">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-white mb-1">{movie.name}</h1>
                    <h2 className="text-sm font-medium text-[#fbbf24]">{movie.origin_name} <span className="text-gray-500 font-normal">({movie.year})</span></h2>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex flex-col items-center justify-center w-16 h-14 bg-[#1f2937] hover:bg-[#374151] rounded-lg transition-colors group">
                        <Star className="w-5 h-5 text-gray-400 group-hover:text-[#fbbf24] mb-1" />
                        <span className="text-[10px] text-gray-400">Đánh giá</span>
                    </button>
                    <button className="flex flex-col items-center justify-center w-16 h-14 bg-[#1f2937] hover:bg-[#374151] rounded-lg transition-colors group">
                        <MessageSquare className="w-5 h-5 text-gray-400 group-hover:text-blue-400 mb-1" />
                        <span className="text-[10px] text-gray-400">Bình luận</span>
                    </button>
                    <div className="hidden sm:flex items-center justify-center px-4 h-10 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-full transition-colors shadow-lg shadow-blue-600/20 cursor-pointer">
                        <Star className="w-4 h-4 mr-1.5 fill-white" />
                        {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"} Đánh giá
                    </div>
                </div>
            </div>
        </div>
    );
}
