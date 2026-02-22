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
        duration?: number; // duration phim (phút) để tính progress
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

    // Track elapsed time và cập nhật progress mỗi 30 giây
    useEffect(() => {
        if (!movieData || !session) return;

        // Thời điểm bắt đầu xem
        const startTime = Date.now();

        // Lấy duration phim từ movieData (tính bằng giây, fallback 90 phút)
        const estimatedDuration = movieData.duration
            ? parseInt(String(movieData.duration)) * 60
            : 90 * 60;

        // Lưu lần đầu sau 10 giây
        const firstSave = setTimeout(async () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const currentProgress = Math.min(
                Math.round((elapsed / estimatedDuration) * 100),
                98
            );
            await addWatchHistory({
                ...movieData,
                duration: estimatedDuration,
                currentTime: Math.max(elapsed, initialProgress > 0 ? (initialProgress / 100) * estimatedDuration : 10),
            });
        }, 10000);

        // Cập nhật định kỳ mỗi 30 giây
        const interval = setInterval(async () => {
            const elapsed = (Date.now() - startTime) / 1000;
            await addWatchHistory({
                ...movieData,
                duration: estimatedDuration,
                currentTime: elapsed,
            });
        }, 30000);

        return () => {
            clearTimeout(firstSave);
            clearInterval(interval);
        };
    }, [movieData, session, initialProgress]);

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
