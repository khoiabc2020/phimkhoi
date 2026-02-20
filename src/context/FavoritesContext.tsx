"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getFavorites, addFavorite as addFavoriteAction, removeFavorite as removeFavoriteAction } from "@/app/actions/favorites";
import { useSession } from "next-auth/react";

interface FavoritesContextType {
    favorites: Set<string>;
    isLoading: boolean;
    isFavorite: (movieId: string) => boolean;
    toggleFavorite: (movieData: any) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
    const { data: session } = useSession();
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);

    // Fetch favorites on mount
    useEffect(() => {
        if (!session?.user) {
            setFavorites(new Set());
            setIsLoading(false);
            return;
        }

        const fetchFavorites = async () => {
            try {
                const res = await getFavorites();
                if (res.success && res.data) {
                    const ids = new Set(res.data.map((item: any) => item.movieId));
                    setFavorites(ids);
                }
            } catch (error) {
                console.error("Failed to fetch favorites:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFavorites();
    }, [session]);

    const isFavorite = (movieId: string) => favorites.has(movieId);

    const toggleFavorite = async (movieData: any) => {
        if (!session?.user) return; // Should handle auth redirect in component

        const movieId = movieData.movieId;
        const isCurrentlyFavorite = favorites.has(movieId);

        // Optimistic Update
        setFavorites(prev => {
            const next = new Set(prev);
            if (isCurrentlyFavorite) {
                next.delete(movieId);
            } else {
                next.add(movieId);
            }
            return next;
        });

        try {
            if (isCurrentlyFavorite) {
                await removeFavoriteAction(movieId);
            } else {
                await addFavoriteAction(movieData);
            }
        } catch (error) {
            console.error("Failed to toggle favorite:", error);
            // Revert on error
            setFavorites(prev => {
                const next = new Set(prev);
                if (isCurrentlyFavorite) {
                    next.add(movieId);
                } else {
                    next.delete(movieId);
                }
                return next;
            });
        }
    };

    return (
        <FavoritesContext.Provider value={{ favorites, isLoading, isFavorite, toggleFavorite }}>
            {children}
        </FavoritesContext.Provider>
    );
}

export function useFavorites() {
    const context = useContext(FavoritesContext);
    if (context === undefined) {
        throw new Error("useFavorites must be used within a FavoritesProvider");
    }
    return context;
}
