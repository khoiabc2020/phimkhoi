"use client";

import { Heart, Plus, Share2, Radio, Subtitles, Flag } from "lucide-react";
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
        <div className="flex items-center justify-around gap-1 py-3 px-4 bg-[#0d0d0d] border-b border-white/5">
            <FavoriteButton
                movieData={movieData}
                initialIsFavorite={isFavorite}
                size="sm"
                className={`${iconBtn} !border-0 !bg-white/5 hover:!bg-white/10`}
            />
            <button type="button" className={iconBtn} title="Thêm vào danh sách">
                <Plus className="w-5 h-5" />
            </button>
            <button type="button" onClick={handleShare} className={iconBtn} title="Chia sẻ">
                <Share2 className="w-5 h-5" />
            </button>
            <button type="button" className={iconBtn} title="Chiếu lên TV">
                <Radio className="w-5 h-5" />
            </button>
            <button type="button" className={iconBtn} title="Phụ đề OFF">
                <span className="text-[10px] font-bold">OFF</span>
            </button>
            <button type="button" className={iconBtn} title="Báo lỗi">
                <Flag className="w-5 h-5" />
            </button>
        </div>
    );
}
