"use client";

import { FavoritesProvider } from "@/context/FavoritesContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <FavoritesProvider>
                {children}
            </FavoritesProvider>
        </SessionProvider>
    );
}
