"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import Image from "next/image";
import { CheckCircle, Heart, Bookmark, X } from "lucide-react";

type ToastType = "favorite" | "watchlist" | "success" | "error";

interface ToastData {
    id: string;
    type: ToastType;
    title: string;
    description?: string;
    poster?: string;
}

interface ToastContextType {
    showToast: (toast: Omit<ToastData, "id">) => void;
}

const ToastContext = createContext<ToastContextType>({
    showToast: () => { },
});

export function useToast() {
    return useContext(ToastContext);
}

function getImageUrl(url: string) {
    if (!url) return "/placeholder.jpg";
    if (url.startsWith("http")) return url;
    return `https://phimimg.com/${url}`;
}

function ToastItem({ toast, onRemove }: { toast: ToastData; onRemove: () => void }) {
    useEffect(() => {
        const t = setTimeout(onRemove, 4000);
        return () => clearTimeout(t);
    }, [onRemove]);

    const icons: Record<ToastType, React.ReactNode> = {
        favorite: <Heart className="w-4 h-4 text-red-400 fill-red-400" />,
        watchlist: <Bookmark className="w-4 h-4 text-primary fill-primary/30" />,
        success: <CheckCircle className="w-4 h-4 text-green-400" />,
        error: <X className="w-4 h-4 text-red-400" />,
    };

    const accents: Record<ToastType, string> = {
        favorite: "from-red-500/20 to-red-500/5 border-red-500/20",
        watchlist: "from-primary/20 to-primary/5 border-primary/20",
        success: "from-green-500/20 to-green-500/5 border-green-500/20",
        error: "from-red-600/20 to-red-600/5 border-red-600/20",
    };

    return (
        <div
            className={`
                group flex items-center gap-3 p-3 pr-4
                bg-gradient-to-r ${accents[toast.type]}
                bg-black/80 backdrop-blur-2xl
                border rounded-2xl shadow-2xl
                min-w-[280px] max-w-[360px]
                animate-in slide-in-from-right-4 fade-in duration-300 ease-out
            `}
        >
            {/* Poster thumbnail */}
            {toast.poster && (
                <div className="relative w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 shadow-lg ring-1 ring-white/10">
                    <Image
                        src={getImageUrl(toast.poster)}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized
                    />
                </div>
            )}

            {/* Icon when no poster */}
            {!toast.poster && (
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    {icons[toast.type]}
                </div>
            )}

            {/* Text content */}
            <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-[13px] truncate flex items-center gap-1.5">
                    {icons[toast.type]}
                    {toast.title}
                </p>
                {toast.description && (
                    <p className="text-white/50 text-[11px] truncate mt-0.5">{toast.description}</p>
                )}
            </div>

            {/* Close button */}
            <button
                onClick={onRemove}
                className="text-white/30 hover:text-white/70 transition-colors ml-1 opacity-0 group-hover:opacity-100"
            >
                <X className="w-3.5 h-3.5" />
            </button>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full overflow-hidden">
                <div
                    className="h-full bg-white/20 animate-[shrink_4s_linear_forwards]"
                    style={{ animationFillMode: "forwards" }}
                />
            </div>
        </div>
    );
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastData[]>([]);

    const showToast = useCallback((toast: Omit<ToastData, "id">) => {
        const id = Math.random().toString(36).slice(2);
        setToasts((prev) => [...prev.slice(-3), { ...toast, id }]); // max 4 toasts
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container — fixed top-right, below header */}
            <div className="fixed top-[80px] right-4 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
                {toasts.map((toast) => (
                    <div key={toast.id} className="pointer-events-auto">
                        <ToastItem
                            toast={toast}
                            onRemove={() => removeToast(toast.id)}
                        />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
