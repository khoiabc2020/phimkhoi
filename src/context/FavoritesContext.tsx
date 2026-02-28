"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getFavorites, addFavorite as addFavoriteAction, removeFavorite as removeFavoriteAction } from "@/app/actions/favorites";
import { useSession } from "next-auth/react";

interface FavoritesContextType {
    favorites: Set<string>;
    isLoading: boolean;
    isFavorite: (movieSlug: string) => boolean;
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
                    const slugs = new Set(res.data.map((item: any) => item.movieSlug));
                    setFavorites(slugs);
                }
            } catch (error) {
                console.error("Failed to fetch favorites:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFavorites();
    }, [session]);

    const isFavorite = (movieSlug: string) => favorites.has(movieSlug);

    const toggleFavorite = async (movieData: any) => {
        if (!session?.user) return; // Should handle auth redirect in component

        const movieSlug = movieData.movieSlug;
        const isCurrentlyFavorite = favorites.has(movieSlug);

        // Optimistic Update
        setFavorites(prev => {
            const next = new Set(prev);
            if (isCurrentlyFavorite) {
                next.delete(movieSlug);
            } else {
                next.add(movieSlug);
            }
            return next;
        });

        try {
            if (isCurrentlyFavorite) {
                await removeFavoriteAction(movieSlug);
            } else {
                await addFavoriteAction(movieData);
            }
        } catch (error) {
            console.error("Failed to toggle favorite:", error);
            // Revert on error
            setFavorites(prev => {
                const next = new Set(prev);
                if (isCurrentlyFavorite) {
                    next.add(movieSlug);
                } else {
                    next.delete(movieSlug);
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
