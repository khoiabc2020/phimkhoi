"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import VideoPlayer from "@/components/VideoPlayer";
import WatchEngagementBar from "@/components/WatchEngagementBar";
import WatchEpisodeSection from "@/components/WatchEpisodeSection";
import { Movie } from "@/services/api";
import { List as ListIcon } from "lucide-react";

interface WatchContainerProps {
    movie: Movie;
    currentEpisode: any; // Initial current episode from page (server 0)
    episodes: any[]; // Initial episodes from page (server 0) -> we might replace this with servers usage
    servers: any[]; // New prop
    initialProgress: number;
    movieData: any;
}

export default function WatchContainer({
    movie,
    currentEpisode: initialCurrentEpisode,
    episodes: initialEpisodes,
    servers,
    initialProgress,
    movieData,
}: WatchContainerProps) {
    const [isTheaterMode, setIsTheaterMode] = useState(false);
    const [isLightOff, setIsLightOff] = useState(false);
    const [activeServerName, setActiveServerName] = useState(servers?.[0]?.server_name || "");

    // Find the server object matching activeServerName
    const activeServer = servers?.find(s => s.server_name === activeServerName) || servers?.[0];
    // Episodes list for the active server
    const currentServerEpisodes = activeServer?.server_data || initialEpisodes || [];

    // Find the current episode in the ACTIVE server's list. 
    // We match by slug. If not found (e.g. server doesn't have this episode), fallback to something reasonable 
    // or keep the initial one if it matches.
    // NOTE: initialCurrentEpisode is from the FIRST server. 
    // If we switch server, we want the SAME episode (same slug) but with the NEW link.
    const currentEpisodeSlug = initialCurrentEpisode?.slug;
    const activeEpisode = currentServerEpisodes.find((ep: any) => ep.slug === currentEpisodeSlug) || initialCurrentEpisode;

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
                    {activeEpisode ? (
                        <VideoPlayer
                            url={activeEpisode.link_embed}
                            m3u8={activeEpisode.link_m3u8}
                            slug={movie.slug}
                            episode={displayEpisodeName(activeEpisode.name)}
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

            {/* Episodes List (Moved inside WatchContainer) */}
            {servers && servers.length > 0 && (
                <div className="mt-6 rounded-2xl border border-white/[0.06] relative"
                    style={{ background: 'rgba(15,18,26,0.8)', backdropFilter: 'blur(20px)' }}>
                    <div className="px-6 pt-5 pb-4 border-b border-white/[0.06]">
                        <h3 className="text-white font-semibold text-base flex items-center gap-2 uppercase tracking-wide">
                            <ListIcon className="w-4 h-4 text-yellow-400" /> Danh sách tập
                        </h3>
                    </div>
                    <div className="p-6">
                        <WatchEpisodeSection
                            movieSlug={movie.slug}
                            movieName={movie.name}
                            servers={servers}
                            currentEpisodeSlug={currentEpisodeSlug}
                            activeServerName={activeServerName}
                            onServerChange={setActiveServerName}
                        />
                    </div>
                </div>
            )}

        </div>
    );
}
