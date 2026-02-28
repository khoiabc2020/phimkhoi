"use client";

import { useState, useTransition } from "react";
import { Plus, Check, Loader2 } from "lucide-react";
import { addToWatchlist, removeFromWatchlist } from "@/app/actions/watchlist";
import { useWatchlist } from "@/context/WatchlistContext";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface WatchlistInlineButtonProps {
    slug: string;
    className?: string;
    size?: "sm" | "md";
    showLabel?: boolean;
}

export default function WatchlistInlineButton({
    slug,
    className,
    size = "md",
    showLabel = false,
}: WatchlistInlineButtonProps) {
    const { isInWatchlist, addToWatchlist: addLocal, removeFromWatchlist: removeLocal } = useWatchlist();
    const { data: session } = useSession();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    const inWatchlist = isInWatchlist(slug);

    const showToast = (msg: string) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 2500);
    };

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
                    showToast("Có lỗi xảy ra!");
                } else {
                    showToast("Đã xóa khỏi Xem Sau");
                }
            } else {
                addLocal(slug);
                const result = await addToWatchlist(slug);
                if (!result.success) {
                    removeLocal(slug); // rollback
                    showToast("Có lỗi xảy ra!");
                } else {
                    showToast("Đã thêm vào Xem Sau ✓");
                }
            }
        });
    };

    const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

    return (
        <div className="relative">
            {/* Toast notification */}
            {toastMsg && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap bg-black/90 text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-white/10 shadow-xl z-50 animate-in fade-in slide-in-from-bottom-1 duration-200">
                    {toastMsg}
                </div>
            )}

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
        </div>
    );
}
