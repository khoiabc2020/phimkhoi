"use client";

import { SessionProvider } from "next-auth/react";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { WatchlistProvider } from "@/context/WatchlistContext";
import { ToastProvider } from "@/context/ToastContext";
import VersionWatcher from "./VersionWatcher";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <FavoritesProvider>
                <WatchlistProvider>
                    <ToastProvider>
                        <VersionWatcher />
                        {children}
                    </ToastProvider>
                </WatchlistProvider>
            </FavoritesProvider>
        </SessionProvider>
    );
}
