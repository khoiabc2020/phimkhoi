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
            await addWatchHistory({
                ...movieData,
                duration: 100,
                currentTime: initialProgress > 0 ? initialProgress : 5,
            });
            setSaved(true);
        }, 10000);

        return () => clearTimeout(timer);
    }, [movieData, session, saved, initialProgress]);

    // Use iframe embed directly — HLS is blocked by upstream servers (Referer/IP check)
    // This is the most reliable playback method
    return (
        <div ref={containerRef} className="relative w-full h-full bg-black group">
            <iframe
                src={url}
                className="w-full h-full"
                allowFullScreen
                allow="autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                title={`${slug} - ${episode}`}
                frameBorder="0"
            />
            {/* Custom fullscreen button */}
            <button
                type="button"
                onClick={toggleFullscreen}
                className="absolute top-2 right-2 z-20 w-9 h-9 flex items-center justify-center rounded-md bg-black/50 hover:bg-black/70 text-white/90 hover:text-white border border-white/20 transition-all backdrop-blur-sm active:scale-95 opacity-0 group-hover:opacity-100"
                title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
            >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
        </div>
    );
}
