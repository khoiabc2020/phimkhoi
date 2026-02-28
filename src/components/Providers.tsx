"use client";

import { SessionProvider } from "next-auth/react";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { WatchlistProvider } from "@/context/WatchlistContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <FavoritesProvider>
                <WatchlistProvider>
                    {children}
                </WatchlistProvider>
            </FavoritesProvider>
        </SessionProvider>
    );
}
