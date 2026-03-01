"use client";

import { Plus, Check } from "lucide-react";
import { useState, useTransition } from "react";
import { addToWatchlist, removeFromWatchlist } from "@/app/actions/watchlist";
import { useRouter } from "next/navigation";

interface WatchlistButtonProps {
    slug: string;
    initialInWatchlist: boolean;
    className?: string; // Add className prop to fix interface error
    showLabel?: boolean;
    label?: string;
}

export default function WatchlistButton({ slug, initialInWatchlist, className, showLabel = false, label = "Xem sau" }: WatchlistButtonProps) {
    const [inWatchlist, setInWatchlist] = useState(initialInWatchlist);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleToggle = async () => {
        startTransition(async () => {
            if (inWatchlist) {
                const result = await removeFromWatchlist(slug);
                if (result.success) {
                    setInWatchlist(false);
                    router.refresh();
                }
            } else {
                const result = await addToWatchlist(slug);
                if (result.success) {
                    setInWatchlist(true);
                    router.refresh();
                }
            }
        });
    };

    return (
        <button
            onClick={handleToggle}
            disabled={isPending}
            className={`flex items-center justify-center ${showLabel ? "px-4 py-2 min-h-[40px] rounded-full gap-2" : "w-10 h-10 rounded-full"} bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all group ${className}`}
            title={inWatchlist ? "Xóa khỏi danh sách" : "Thêm vào danh sách"}
        >
            {inWatchlist ? (
                <Check className="w-5 h-5 text-green-500 shrink-0" />
            ) : (
                <Plus className={`w-5 h-5 text-gray-400 group-hover:text-white transition-colors shrink-0 ${isPending ? "animate-spin" : ""}`} />
            )}
            {showLabel && (
                <span className="text-sm font-medium text-white whitespace-nowrap">
                    {label}
                </span>
            )}
        </button>
    );
}
