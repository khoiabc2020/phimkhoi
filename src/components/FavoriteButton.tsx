"use client";

import { Heart } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFavorites } from "@/context/FavoritesContext";

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
}

export default function FavoriteButton({ movieData, size = "md", className = "" }: FavoriteButtonProps) {
    const { isFavorite, toggleFavorite, isLoading } = useFavorites();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const isFav = isFavorite(movieData.movieId);

    const sizeClasses = {
        sm: "w-8 h-8",
        md: "w-10 h-10",
        lg: "w-12 h-12",
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
        });
    };

    if (isLoading) {
        return (
            <div className={`${sizeClasses[size]} rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center animate-pulse ${className}`} />
        );
    }

    return (
        <button
            onClick={handleToggle}
            disabled={isPending}
            className={`${sizeClasses[size]} rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all group disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            title={isFav ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
        >
            <Heart
                className={`${iconSizes[size]} transition-all ${isFav
                    ? "text-red-500 fill-red-500"
                    : "text-white group-hover:text-red-400"
                    } ${isPending ? "animate-pulse" : ""}`}
            />
        </button>
    );
}
