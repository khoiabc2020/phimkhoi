"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import VideoPlayer from "@/components/VideoPlayer";
import WatchEngagementBar from "@/components/WatchEngagementBar";
import { Movie } from "@/services/api";

interface WatchContainerProps {
    movie: Movie;
    currentEpisode: any;
    episodes: any[];
    initialProgress: number;
    movieData: any;
}

export default function WatchContainer({
    movie,
    currentEpisode,
    episodes,
    initialProgress,
    movieData,
}: WatchContainerProps) {
    const [isTheaterMode, setIsTheaterMode] = useState(false);
    const [isLightOff, setIsLightOff] = useState(false);

    const displayEpisodeName = (name: string) => name?.startsWith('Tập') ? name : `Tập ${name}`;

    return (
        <div className={cn("relative transition-all duration-500", isLightOff ? "z-50" : "")}>

            {/* Light Off Overlay */}
            {isLightOff && (
                <div
                    className="fixed inset-0 bg-black/90 z-40 transition-opacity duration-500"
                    onClick={() => setIsLightOff(false)}
                />
            )}

            {/* Player Container */}
            <div className={cn(
                "relative transition-all duration-500 z-50",
                isTheaterMode ? "w-full max-w-[100vw] -mx-4 lg:-mx-8" : "w-full"
            )}>
                <div className={cn(
                    "bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 relative group",
                    isTheaterMode ? "aspect-video md:aspect-[21/9] h-[80vh]" : "aspect-video"
                )}>
                    {currentEpisode ? (
                        <VideoPlayer
                            url={currentEpisode.link_embed}
                            m3u8={currentEpisode.link_m3u8}
                            slug={movie.slug}
                            episode={displayEpisodeName(currentEpisode.name)}
                            movieData={movieData}
                            initialProgress={initialProgress}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-white">
                            <p>Tập phim không khả dụng.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Engagement Bar & Info */}
            <div className="mt-4">
                <WatchEngagementBar
                    movie={movie}
                    isTheaterMode={isTheaterMode}
                    toggleTheater={() => setIsTheaterMode(!isTheaterMode)}
                    isLightOff={isLightOff}
                    toggleLight={() => setIsLightOff(!isLightOff)}
                />
            </div>

        </div>
    );
}
