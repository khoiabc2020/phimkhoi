"use client";

import { BookmarkPlus, BookmarkCheck, Loader2 } from "lucide-react";
import { useWatchlist } from "@/context/WatchlistContext";
import { useToast } from "@/context/ToastContext";

interface WatchlistButtonProps {
    slug: string;
    movieName?: string;
    poster?: string;
    className?: string;
    showLabel?: boolean;
    label?: string;
}

export default function WatchlistButton({ slug, movieName, poster, className = "", showLabel = false, label = "Xem sau" }: WatchlistButtonProps) {
    const { isInWatchlist, addToWatchlist, removeFromWatchlist, isLoaded } = useWatchlist();
    const { showToast } = useToast();
    const inWatchlist = isInWatchlist(slug);

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (inWatchlist) {
            await removeFromWatchlist(slug);
            showToast({
                type: "success",
                title: "Đã xóa khỏi Xem Sau",
                description: movieName || "Danh sách của bạn đã được cập nhật.",
                poster: poster,
            });
        } else {
            await addToWatchlist(slug);
            showToast({
                type: "watchlist",
                title: movieName || "Phim đã được lưu",
                description: "Đã thêm vào Danh Sách Xem Sau",
                poster: poster,
            });
        }
    };

    if (!isLoaded) {
        return (
            <div className={`flex items-center justify-center ${showLabel ? "px-4 py-2 min-h-[40px] rounded-full gap-2" : "w-10 h-10 rounded-full"} bg-white/5 border border-white/10 backdrop-blur-md transition-all ${className}`}>
                <Loader2 className="w-5 h-5 text-gray-500 animate-spin shrink-0" />
            </div>
        );
    }

    return (
        <button
            onClick={handleToggle}
            className={`flex items-center justify-center ${showLabel ? "px-4 py-2 min-h-[40px] rounded-full gap-2" : "w-10 h-10 rounded-full"} bg-[#e5e5e5]/90 hover:bg-white backdrop-blur-md transition-all shadow-md group ${className}`}
            title={inWatchlist ? "Xóa khỏi danh sách" : "Thêm vào danh sách"}
        >
            {inWatchlist ? (
                <BookmarkCheck className="w-5 h-5 text-[#8FA7C5] shrink-0" />
            ) : (
                <BookmarkPlus className="w-5 h-5 text-current transition-colors shrink-0" />
            )}
            {showLabel && (
                <span className="text-sm font-medium text-white whitespace-nowrap">
                    {label}
                </span>
            )}
        </button>
    );
}
