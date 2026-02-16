"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { addWatchHistory } from "@/app/actions/watchHistory";
import { useSession } from "next-auth/react";
import { Maximize2, Minimize2 } from "lucide-react";

interface VideoPlayerProps {
    url: string;
    m3u8?: string;
    slug?: string;
    episode?: string;
    movieData?: {
        movieId: string;
        movieSlug: string;
        movieName: string;
        movieOriginName: string;
        moviePoster: string;
        episodeSlug: string;
        episodeName: string;
    };
    initialProgress?: number;
}

export default function VideoPlayer({
    url,
    m3u8,
    slug,
    episode,
    movieData,
    initialProgress = 0
}: VideoPlayerProps) {
    const [saved, setSaved] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { data: session } = useSession();

    const toggleFullscreen = useCallback(() => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().then(() => setIsFullscreen(true));
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false));
        }
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    // Auto-save watch history after 10 seconds
    useEffect(() => {
        if (!movieData || !session || saved) return;

        const timer = setTimeout(async () => {
            // Save with estimated progress (since iframe can't track actual progress)
            await addWatchHistory({
                ...movieData,
                duration: 100, // Dummy duration
                currentTime: initialProgress > 0 ? initialProgress : 5, // Use initial or default 5%
            });
            setSaved(true);
        }, 10000);

        return () => clearTimeout(timer);
    }, [movieData, session, saved, initialProgress]);

    return (
        <div ref={containerRef} className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 group">
            <iframe
                src={url}
                className="w-full h-full"
                allowFullScreen
                allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                title={`${slug} - ${episode}`}
            />
            {/* Custom fullscreen button - visible on mobile where embed often hides it */}
            <button
                type="button"
                onClick={toggleFullscreen}
                className="absolute top-2 right-2 z-20 w-10 h-10 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-black/60 hover:bg-black/80 text-white border border-white/20 transition-colors backdrop-blur-sm active:scale-95"
                title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
                aria-label={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
            >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
        </div>
    );
}
