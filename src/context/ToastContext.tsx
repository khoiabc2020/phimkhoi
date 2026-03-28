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
    if (!url) return "/placeholder.svg";
    // Keep internal app routes as-is (e.g. /api/img-proxy?...).
    if (url.startsWith("/")) return url;
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
        requestAnimationFrame(() => setVisible(true));
        timerRef.current = setTimeout(() => {
            setExiting(true);
            setTimeout(onRemove, 350);
        }, 3800);
        return () => clearTimeout(timerRef.current);
    }, [onRemove]);

    const cfg = TYPE_CONFIG[toast.type];

    return (
        <div
            className={`
                relative flex items-stretch gap-4 p-0
                rounded-2xl border shadow-[0_30px_60px_rgba(0,0,0,0.5)]
                ${cfg.border}
                transition-all duration-500 cubic-bezier(0.2, 1, 0.2, 1)
                ${visible && !exiting
                    ? "opacity-100 translate-y-0 scale-100"
                    : "opacity-0 -translate-y-6 scale-90 blur-md"
                }
                overflow-hidden backdrop-blur-[32px] bg-[#0a0a0f]/85
            `}
            style={{
                width: "420px",
                maxWidth: "calc(100vw - 32px)",
            }}
        >
            {/* Cinematic Poster - Bigger for "Elite" impact */}
            <div className="relative w-[80px] sm:w-[100px] aspect-[2/3] shrink-0 overflow-hidden border-r border-white/5 group">
                <Image
                    src={getImageUrl(toast.poster || "")}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-700 hover:scale-110"
                    unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
                {/* Status Icon Overlay */}
                <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center">
                    {cfg.icon}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col justify-center py-4 pr-10 pl-1 min-w-0">
                <div className={`flex items-center gap-2 ${cfg.color} text-[13px] font-black uppercase tracking-[2px] mb-1`}>
                    <span>{toast.title}</span>
                </div>
                {toast.description && (
                    <p className="text-white/50 text-[12px] leading-[1.4] font-medium tracking-tight line-clamp-2">
                        {toast.description}
                    </p>
                )}
            </div>

            {/* Close Button */}
            <button
                onClick={() => { setExiting(true); setTimeout(onRemove, 300); }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 transition-all pointer-events-auto"
            >
                <X className="w-4 h-4" />
            </button>

            {/* Bottom Progress Bar - Styled for "Elite" */}
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/[0.03]">
                <div 
                    className={`h-full ${cfg.color.replace('text-', 'bg-')} shadow-[0_0_10px_rgba(255,255,255,0.3)] animate-shrink`}
                    style={{ animationDuration: '3.8s', animationTimingFunction: 'linear', animationFillMode: 'forwards' }}
                />
            </div>
        </div>
    );
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastData[]>([]);
    const lastToastRef = useRef<{ signature: string; at: number } | null>(null);

    const showToast = useCallback((toast: Omit<ToastData, "id">) => {
        const now = Date.now();
        const signature = `${toast.type}|${toast.title}|${toast.description || ""}`;
        if (lastToastRef.current && lastToastRef.current.signature === signature && now - lastToastRef.current.at < 800) {
            return;
        }
        lastToastRef.current = { signature, at: now };
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
