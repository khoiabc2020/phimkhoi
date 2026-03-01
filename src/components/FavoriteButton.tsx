"use client";

import { Heart } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFavorites } from "@/context/FavoritesContext";
import { useToast } from "@/context/ToastContext";

interface FavoriteButtonProps {
    movieData: {
        movieId: string;
        movieSlug: string;
        movieName: string;
        movieOriginName: string;
        moviePoster: string;
        movieYear: number;
        movieQuality: string;
        movieCategories: string[];
    };
    size?: "sm" | "md" | "lg";
    className?: string;
    showLabel?: boolean;
    label?: string;
}

export default function FavoriteButton({ movieData, size = "md", className = "", showLabel = false, label = "Thích" }: FavoriteButtonProps) {
    const { isFavorite, toggleFavorite, isLoading } = useFavorites();
    const { showToast } = useToast();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const isFav = isFavorite(movieData.movieSlug);

    const sizeClasses = {
        sm: showLabel ? "px-3 py-1.5 min-h-[32px]" : "w-8 h-8",
        md: showLabel ? "px-4 py-2 min-h-[40px]" : "w-10 h-10",
        lg: showLabel ? "px-6 py-3 min-h-[48px]" : "w-12 h-12",
    };

    const iconSizes = {
        sm: "w-4 h-4",
        md: "w-5 h-5",
        lg: "w-6 h-6",
    };

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        startTransition(async () => {
            await toggleFavorite(movieData);
            router.refresh();

            if (!isFav) {
                showToast({
                    type: "favorite",
                    title: movieData.movieName,
                    description: "Đã thêm vào danh sách yêu thích",
                    poster: movieData.moviePoster,
                });
            } else {
                showToast({
                    type: "success",
                    title: "Đã xóa khỏi yêu thích",
                    description: movieData.movieName,
                });
            }
        });
    };

    if (isLoading) {
        return (
            <div className={`${sizeClasses[size]} ${showLabel ? "rounded-full" : "rounded-full"} bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center animate-pulse ${className}`} />
        );
    }

    return (
        <button
            onClick={handleToggle}
            disabled={isPending}
            className={`${sizeClasses[size]} ${showLabel ? "rounded-full gap-2" : "rounded-full"} bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all group disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            title={isFav ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
        >
            <Heart
                className={`${iconSizes[size]} transition-all shrink-0 ${isFav
                    ? "text-red-500 fill-red-500"
                    : "text-white group-hover:text-red-400"
                    } ${isPending ? "animate-pulse" : ""}`}
            />
            {showLabel && (
                <span className="text-sm font-medium text-white whitespace-nowrap">
                    {label}
                </span>
            )}
        </button>
    );
}
