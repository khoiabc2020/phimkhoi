"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { addWatchHistory } from "@/app/actions/watchHistory";
import { useSession } from "next-auth/react";

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
    const { data: session } = useSession();

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
        <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 group">
            <iframe
                src={url}
                className="w-full h-full"
                allowFullScreen
                allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                title={`${slug} - ${episode}`}
            />
        </div>
    );
}
