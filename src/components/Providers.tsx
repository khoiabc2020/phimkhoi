"use client";

import { SessionProvider } from "next-auth/react";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { WatchlistProvider } from "@/context/WatchlistContext";
import { ToastProvider } from "@/context/ToastContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <FavoritesProvider>
                <WatchlistProvider>
                    <ToastProvider>
                        {children}
                    </ToastProvider>
                </WatchlistProvider>
            </FavoritesProvider>
        </SessionProvider>
    );
}
