"use client";

import { useState, useTransition } from "react";
import { Heart, Loader2 } from "lucide-react";
import { addFavoriteActor, removeFavoriteActor } from "@/app/actions/actorFavorites";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface FavoriteActorButtonProps {
    actorName: string;
    initialIsFavorite: boolean;
}

export default function FavoriteActorButton({ actorName, initialIsFavorite }: FavoriteActorButtonProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
    const [isPending, startTransition] = useTransition();

    const toggleFavorite = () => {
        if (status === "unauthenticated") {
            router.push("/login");
            return;
        }

        const newStatus = !isFavorite;
        setIsFavorite(newStatus); // Optimistic UI update

        startTransition(async () => {
            let result;
            if (newStatus) {
                result = await addFavoriteActor(actorName, `/dien-vien/${encodeURIComponent(actorName)}`);
            } else {
                result = await removeFavoriteActor(actorName, `/dien-vien/${encodeURIComponent(actorName)}`);
            }

            if (!result.success) {
                setIsFavorite(!newStatus); // Revert on failure
                console.error(result.error);
                alert("Có lỗi xảy ra, vui lòng thử lại sau.");
            }
        });
    };

    return (
        <button
            onClick={toggleFavorite}
            disabled={isPending}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors border ${isFavorite
                    ? "bg-[#e50914] hover:bg-[#b81d24] text-white border-transparent"
                    : "bg-white/5 hover:bg-white/10 text-gray-300 border-white/10"
                }`}
        >
            {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
            )}
            {isFavorite ? "Đã thích" : "Yêu thích"}
        </button>
    );
}
