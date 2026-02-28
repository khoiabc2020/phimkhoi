"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from "react";
import Image from "next/image";
import { CheckCircle, Heart, Bookmark, X, AlertCircle } from "lucide-react";

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

const ToastContext = createContext<ToastContextType>({ showToast: () => { } });

export function useToast() {
    return useContext(ToastContext);
}

function getImageUrl(url: string) {
    if (!url) return "/placeholder.jpg";
    if (url.startsWith("http")) return url;
    return `https://phimimg.com/${url}`;
}

const TYPE_CONFIG: Record<ToastType, { icon: React.ReactNode; color: string; border: string }> = {
    favorite: {
        icon: <Heart className="w-4 h-4 fill-rose-400 text-rose-400" />,
        color: "text-rose-400",
        border: "border-rose-500/25",
    },
    watchlist: {
        icon: <Bookmark className="w-4 h-4 fill-yellow-400 text-yellow-400" />,
        color: "text-yellow-400",
        border: "border-yellow-500/25",
    },
    success: {
        icon: <CheckCircle className="w-4 h-4 text-emerald-400" />,
        color: "text-emerald-400",
        border: "border-emerald-500/25",
    },
    error: {
        icon: <AlertCircle className="w-4 h-4 text-red-400" />,
        color: "text-red-400",
        border: "border-red-500/25",
    },
};

function ToastItem({ toast, onRemove }: { toast: ToastData; onRemove: () => void }) {
    const [visible, setVisible] = useState(false);
    const [exiting, setExiting] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        // Slide in
        requestAnimationFrame(() => setVisible(true));

        timerRef.current = setTimeout(() => {
            setExiting(true);
            setTimeout(onRemove, 350);
        }, 3800);

        return () => clearTimeout(timerRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const cfg = TYPE_CONFIG[toast.type];

    return (
        <div
            className={`
                flex items-center gap-3 px-4 py-3
                rounded-2xl border shadow-2xl
                ${cfg.border}
                transition-all duration-350 ease-out
                ${visible && !exiting
                    ? "opacity-100 translate-y-0 scale-100"
                    : "opacity-0 -translate-y-4 scale-95"
                }
            `}
            style={{
                background: "rgba(18, 20, 28, 0.92)",
                backdropFilter: "blur(28px)",
                WebkitBackdropFilter: "blur(28px)",
                minWidth: "300px",
                maxWidth: "420px",
            }}
        >
            {/* Poster */}
            {toast.poster ? (
                <div className="relative w-10 h-14 flex-shrink-0 rounded-lg overflow-hidden ring-1 ring-white/10 shadow-lg">
                    <Image
                        src={getImageUrl(toast.poster)}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized
                    />
                </div>
            ) : (
                <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center bg-white/10`}>
                    {cfg.icon}
                </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
                {/* Type label + icon */}
                <div className={`flex items-center gap-1.5 ${cfg.color} text-[11px] font-semibold uppercase tracking-wide mb-0.5`}>
                    {cfg.icon}
                    <span>{toast.title}</span>
                </div>
                {toast.description && (
                    <p className="text-white/60 text-xs leading-snug truncate">{toast.description}</p>
                )}
            </div>

            {/* Close */}
            <button
                onClick={() => { setExiting(true); setTimeout(onRemove, 300); }}
                className="flex-shrink-0 text-white/25 hover:text-white/70 transition-colors ml-1"
            >
                <X className="w-3.5 h-3.5" />
            </button>

            {/* Bottom progress bar */}
            <div className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full overflow-hidden">
                <div className={`h-full ${toast.type === "error" ? "bg-red-400/40" : toast.type === "favorite" ? "bg-rose-400/40" : "bg-yellow-400/40"} animate-[shrink_3.8s_linear_forwards]`} />
            </div>
        </div>
    );
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastData[]>([]);

    const showToast = useCallback((toast: Omit<ToastData, "id">) => {
        const id = Math.random().toString(36).slice(2);
        // Keep max 2 toasts at a time
        setToasts((prev) => [...prev.slice(-1), { ...toast, id }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast container — centered top, below header */}
            <div
                className="fixed top-[88px] left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 items-center pointer-events-none"
                style={{ width: "max-content", maxWidth: "calc(100vw - 32px)" }}
            >
                {toasts.map((toast) => (
                    <div key={toast.id} className="pointer-events-auto relative">
                        <ToastItem toast={toast} onRemove={() => removeToast(toast.id)} />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
