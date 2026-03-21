"use client";

import { Plus, Check, Loader2 } from "lucide-react";
import { useWatchlist } from "@/context/WatchlistContext";

interface WatchlistButtonProps {
    slug: string;
    className?: string;
    showLabel?: boolean;
    label?: string;
}

export default function WatchlistButton({ slug, className = "", showLabel = false, label = "Xem sau" }: WatchlistButtonProps) {
    const { isInWatchlist, addToWatchlist, removeFromWatchlist, isLoaded } = useWatchlist();
    const inWatchlist = isInWatchlist(slug);

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (inWatchlist) {
            removeFromWatchlist(slug);
        } else {
            addToWatchlist(slug);
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
            className={`flex items-center justify-center ${showLabel ? "px-4 py-2 min-h-[40px] rounded-full gap-2" : "w-10 h-10 rounded-full"} bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all group ${className}`}
            title={inWatchlist ? "Xóa khỏi danh sách" : "Thêm vào danh sách"}
        >
            {inWatchlist ? (
                <Check className="w-5 h-5 text-green-500 shrink-0" />
            ) : (
                <Plus className={`w-5 h-5 text-gray-400 group-hover:text-white transition-colors shrink-0`} />
            )}
            {showLabel && (
                <span className="text-sm font-medium text-white whitespace-nowrap">
                    {label}
                </span>
            )}
        </button>
    );
}
