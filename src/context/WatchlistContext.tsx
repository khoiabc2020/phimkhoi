"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useSession } from "next-auth/react";

interface WatchlistContextType {
    watchlistSlugs: Set<string>;
    isInWatchlist: (slug: string) => boolean;
    addToWatchlist: (slug: string) => void;
    removeFromWatchlist: (slug: string) => void;
    isLoaded: boolean;
}

const WatchlistContext = createContext<WatchlistContextType>({
    watchlistSlugs: new Set(),
    isInWatchlist: () => false,
    addToWatchlist: () => { },
    removeFromWatchlist: () => { },
    isLoaded: false,
});

export function WatchlistProvider({ children }: { children: ReactNode }) {
    const { data: session } = useSession();
    const [watchlistSlugs, setWatchlistSlugs] = useState<Set<string>>(new Set());
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (!session?.user) {
            // Use setTimeout to avoid synchronous setState in effect body
            const t = setTimeout(() => {
                setWatchlistSlugs(new Set());
                setIsLoaded(true);
            }, 0);
            return () => clearTimeout(t);
        }

        fetch("/api/user/watchlist")
            .then((res) => res.json())
            .then((data) => {
                if (data.slugs) {
                    setWatchlistSlugs(new Set(data.slugs));
                }
            })
            .catch(console.error)
            .finally(() => setIsLoaded(true));
    }, [session?.user]);

    const isInWatchlist = useCallback((slug: string) => watchlistSlugs.has(slug), [watchlistSlugs]);

    const addToWatchlist = useCallback(async (slug: string) => {
        if (!session?.user) return;
        
        // Optimistic update
        setWatchlistSlugs((prev) => new Set([...prev, slug]));

        try {
            const res = await fetch("/api/user/watchlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slug, action: "add" }),
            });
            if (!res.ok) throw new Error("Failed to add to watchlist");
            const data = await res.json();
            if (data.slugs) setWatchlistSlugs(new Set(data.slugs));
        } catch (error) {
            console.error("addToWatchlist error:", error);
            // Rollback on error
            setWatchlistSlugs((prev) => {
                const next = new Set(prev);
                next.delete(slug);
                return next;
            });
        }
    }, [session?.user]);

    const removeFromWatchlist = useCallback(async (slug: string) => {
        if (!session?.user) return;

        // Optimistic update
        setWatchlistSlugs((prev) => {
            const next = new Set(prev);
            next.delete(slug);
            return next;
        });

        try {
            const res = await fetch("/api/user/watchlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slug, action: "remove" }),
            });
            if (!res.ok) throw new Error("Failed to remove from watchlist");
            const data = await res.json();
            if (data.slugs) setWatchlistSlugs(new Set(data.slugs));
        } catch (error) {
            console.error("removeFromWatchlist error:", error);
            // Rollback on error
            setWatchlistSlugs((prev) => new Set([...prev, slug]));
        }
    }, [session?.user]);

    return (
        <WatchlistContext.Provider value={{ watchlistSlugs, isInWatchlist, addToWatchlist, removeFromWatchlist, isLoaded }}>
            {children}
        </WatchlistContext.Provider>
    );
}

export function useWatchlist() {
    return useContext(WatchlistContext);
}
