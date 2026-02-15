"use client";

import { Heart } from "lucide-react";
import { useState, useTransition } from "react";
import { addFavorite, removeFavorite } from "@/app/actions/favorites";
import { useRouter } from "next/navigation";

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
    initialIsFavorite: boolean;
    size?: "sm" | "md" | "lg";
}

export default function FavoriteButton({ movieData, initialIsFavorite, size = "md" }: FavoriteButtonProps) {
    const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

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
            if (isFavorite) {
                const result = await removeFavorite(movieData.movieId);
                if (result.success) {
                    setIsFavorite(false);
                    router.refresh();
                }
            } else {
                const result = await addFavorite(movieData);
                if (result.success) {
                    setIsFavorite(true);
                    router.refresh();
                }
            }
        });
    };

    return (
        <button
            onClick={handleToggle}
            disabled={isPending}
            className={`${sizeClasses[size]} rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all group disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
        >
            <Heart
                className={`${iconSizes[size]} transition-all ${isFavorite
                    ? "text-red-500 fill-red-500"
                    : "text-white group-hover:text-red-400"
                    } ${isPending ? "animate-pulse" : ""}`}
            />
        </button>
    );
}
