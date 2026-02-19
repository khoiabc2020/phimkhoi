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

            {/* Cinematic Glow Aura */}
            <div className="absolute -inset-8 pointer-events-none z-0"
                style={{
                    background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.06) 0%, transparent 65%)',
                    filter: 'blur(20px)',
                }} />

            {/* Player Card */}
            <div className={cn(
                "relative z-10 transition-all duration-500",
                isTheaterMode ? "w-full max-w-[100vw] -mx-4 lg:-mx-10" : "w-full"
            )}>
                {/* Glass Border Ring */}
                <div className={cn(
                    "rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)] ring-1 ring-white/[0.08]",
                    isTheaterMode ? "aspect-video md:aspect-[21/9] h-[80vh]" : "aspect-video"
                )}
                    style={{ background: 'rgba(15,18,26,0.95)' }}>
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
                        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-white gap-3">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                <span className="text-3xl">🎬</span>
                            </div>
                            <p className="text-gray-400 text-sm">Tập phim không khả dụng.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Engagement Bar */}
            <div className="mt-4 relative z-10">
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
