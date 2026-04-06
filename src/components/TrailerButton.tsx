"use client";

import { useState, useEffect } from "react";
import { Play, X } from "lucide-react";

interface TrailerButtonProps {
    trailerKey: string;
}

export default function TrailerButton({ trailerKey }: TrailerButtonProps) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open]);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition-all"
            >
                <Play className="w-4 h-4" />
                Xem Trailer
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90"
                    onClick={() => setOpen(false)}
                >
                    <div
                        className="relative w-full max-w-3xl mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setOpen(false)}
                            className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors p-1"
                            aria-label="Đóng trailer"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <iframe
                            src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&rel=0`}
                            allow="autoplay; fullscreen"
                            allowFullScreen
                            className="w-full aspect-video rounded-lg"
                        />
                    </div>
                </div>
            )}
        </>
    );
}
