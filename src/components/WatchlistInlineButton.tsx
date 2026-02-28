"use client";

import { useState, useTransition } from "react";
import { Plus, Check, Loader2 } from "lucide-react";
import { addToWatchlist, removeFromWatchlist } from "@/app/actions/watchlist";
import { useWatchlist } from "@/context/WatchlistContext";
import { useToast } from "@/context/ToastContext";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface WatchlistInlineButtonProps {
    slug: string;
    movieName?: string;
    moviePoster?: string;
    className?: string;
    size?: "sm" | "md";
    showLabel?: boolean;
}

export default function WatchlistInlineButton({
    slug,
    movieName,
    moviePoster,
    className,
    size = "md",
    showLabel = false,
}: WatchlistInlineButtonProps) {
    const { isInWatchlist, addToWatchlist: addLocal, removeFromWatchlist: removeLocal } = useWatchlist();
    const { showToast } = useToast();
    const { data: session } = useSession();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const inWatchlist = isInWatchlist(slug);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!session?.user) {
            router.push("/login");
            return;
        }

        startTransition(async () => {
            if (inWatchlist) {
                removeLocal(slug);
                const result = await removeFromWatchlist(slug);
                if (!result.success) {
                    addLocal(slug); // rollback
                } else {
                    showToast({
                        type: "success",
                        title: "Đã xóa khỏi Xem Sau",
                        description: movieName,
                    });
                }
            } else {
                addLocal(slug);
                const result = await addToWatchlist(slug);
                if (!result.success) {
                    removeLocal(slug); // rollback
                } else {
                    showToast({
                        type: "watchlist",
                        title: movieName || "Phim đã được lưu",
                        description: "Đã thêm vào Danh Sách Xem Sau",
                        poster: moviePoster,
                    });
                }
            }
        });
    };

    const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

    return (
        <button
            onClick={handleClick}
            disabled={isPending}
            title={inWatchlist ? "Xóa khỏi Xem Sau" : "Thêm vào Xem Sau"}
            className={cn(
                "flex items-center justify-center gap-1.5 rounded-full border transition-all duration-300",
                inWatchlist
                    ? "border-primary/60 bg-primary/15 text-primary hover:bg-red-500/15 hover:border-red-500/50 hover:text-red-400"
                    : "border-white/20 bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white",
                size === "sm" ? "w-6 h-6" : "w-8 h-8",
                showLabel && "px-3 w-auto rounded",
                className
            )}
        >
            {isPending ? (
                <Loader2 className={cn(iconSize, "animate-spin")} />
            ) : inWatchlist ? (
                <Check className={cn(iconSize, "text-primary")} />
            ) : (
                <Plus className={iconSize} />
            )}
            {showLabel && (
                <span className="text-[11px] font-bold">
                    {inWatchlist ? "Đã lưu" : "Xem sau"}
                </span>
            )}
        </button>
    );
}
