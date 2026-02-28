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
            setWatchlistSlugs(new Set());
            setIsLoaded(true);
            return;
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

    const addToWatchlist = useCallback((slug: string) => {
        setWatchlistSlugs((prev) => new Set([...prev, slug]));
    }, []);

    const removeFromWatchlist = useCallback((slug: string) => {
        setWatchlistSlugs((prev) => {
            const next = new Set(prev);
            next.delete(slug);
            return next;
        });
    }, []);

    return (
        <WatchlistContext.Provider value={{ watchlistSlugs, isInWatchlist, addToWatchlist, removeFromWatchlist, isLoaded }}>
            {children}
        </WatchlistContext.Provider>
    );
}

export function useWatchlist() {
    return useContext(WatchlistContext);
}
