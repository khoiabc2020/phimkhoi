"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import VideoPlayer from "@/components/VideoPlayer";
import WatchEngagementBar from "@/components/WatchEngagementBar";
import WatchEpisodeSection from "@/components/WatchEpisodeSection";
import { Movie } from "@/services/api";
import { List as ListIcon, Monitor, ChevronLeft, ChevronRight, SkipForward } from "lucide-react";

interface WatchContainerProps {
    movie: Movie;
    currentEpisode: any;
    episodes: any[];
    servers: any[];
    initialProgress: number;
    movieData: any;
    initialServerName: string;
}

export default function WatchContainer({
    movie,
    currentEpisode: initialCurrentEpisode,
    episodes: initialEpisodes,
    servers,
    initialProgress,
    movieData,
    initialServerName,
}: WatchContainerProps) {
    const [isTheaterMode, setIsTheaterMode] = useState(false);
    const [isLightOff, setIsLightOff] = useState(false);
    const [autoNext, setAutoNext] = useState(true);
    const [activeServerName, setActiveServerName] = useState(
        initialServerName || servers?.[0]?.server_name || ""
    );

    const activeServer = servers?.find((s) => s.server_name === activeServerName) || servers?.[0];
    const currentServerEpisodes = activeServer?.server_data || initialEpisodes || [];

    const currentEpisodeSlug = initialCurrentEpisode?.slug;
    const activeEpisode =
        currentServerEpisodes.find((ep: any) => ep.slug === currentEpisodeSlug) || initialCurrentEpisode;

    // Compute prev/next episode index
    const currentIdx = currentServerEpisodes.findIndex((ep: any) => ep.slug === currentEpisodeSlug);
    const prevEpisode = currentIdx > 0 ? currentServerEpisodes[currentIdx - 1] : null;
    const nextEpisode = currentIdx >= 0 && currentIdx < currentServerEpisodes.length - 1
        ? currentServerEpisodes[currentIdx + 1]
        : null;

    const nextEpisodeUrl = nextEpisode ? `/xem-phim/${movie.slug}/${nextEpisode.slug}` : undefined;
    const prevEpisodeUrl = prevEpisode ? `/xem-phim/${movie.slug}/${prevEpisode.slug}` : undefined;

    const displayEpisodeName = (name: string) => name?.startsWith("Tập") ? name : `Tập ${name}`;

    // Lock scroll in theater mode
    useEffect(() => {
        if (isTheaterMode) {
            document.body.style.overflow = "hidden";
            return () => { document.body.style.overflow = ""; };
        }
    }, [isTheaterMode]);

    return (
        <div className={cn("relative transition-all duration-500", isLightOff ? "z-[60]" : "")}>

            {/* Light Off Overlay */}
            {isLightOff && (
                <div
                    className="fixed inset-0 bg-black/90 z-40 transition-opacity duration-500"
                    onClick={() => setIsLightOff(false)}
                />
            )}

            {/* Glow Aura */}
            <div
                className="absolute -inset-8 pointer-events-none z-0"
                style={{
                    background: "radial-gradient(ellipse at center, rgba(251,191,36,0.06) 0%, transparent 65%)",
                    filter: "blur(20px)",
                }}
            />

            {/* Placeholder when theater mode on */}
            {isTheaterMode && <div className="w-full aspect-video hidden md:block" />}

            {/* Theater Mode Container */}
            <div
                className={cn(
                    "transition-all duration-500",
                    isTheaterMode
                        ? "fixed top-[70px] md:top-[80px] left-0 right-0 bottom-0 z-[100] bg-[#080b12] overflow-y-auto w-full px-4 md:px-10 lg:px-20 py-6 pb-32"
                        : "relative z-10 w-full"
                )}
            >
                {/* Theater Mode Close Button */}
                {isTheaterMode && (
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-white text-base font-semibold tracking-wide flex items-center gap-2">
                            <Monitor className="w-4 h-4 text-yellow-500" /> CHẾ ĐỘ RẠP PHIM
                        </h2>
                        <button
                            onClick={() => setIsTheaterMode(false)}
                            className="text-gray-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm"
                        >
                            Đóng ×
                        </button>
                    </div>
                )}

                {/* Player Card */}
                <div
                    className={cn(
                        "rounded-xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)] ring-1 ring-white/[0.08] relative z-10 mx-auto transition-all duration-500",
                        isTheaterMode ? "w-full max-w-[1500px] aspect-video md:aspect-[21/9] h-auto" : "w-full aspect-video"
                    )}
                    style={{ background: "rgba(15,18,26,0.95)" }}
                >
                    {activeEpisode ? (
                        <VideoPlayer
                            url={activeEpisode.link_embed}
                            m3u8={activeEpisode.link_m3u8}
                            slug={movie.slug}
                            episode={displayEpisodeName(activeEpisode.name)}
                            movieData={movieData}
                            initialProgress={initialProgress}
                            autoNext={autoNext}
                            nextEpisodeUrl={nextEpisodeUrl}
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-white gap-3">
                            <span className="text-4xl">🎬</span>
                            <p className="text-gray-400 text-sm">Tập phim không khả dụng.</p>
                        </div>
                    )}
                </div>

                {/* Info Bar below player (onflix-style) */}
                <div className="mt-2 px-1 flex items-center justify-between gap-3 flex-wrap">
                    {/* Left: Title + Episode */}
                    <div className="flex items-center gap-2 min-w-0">
                        <Link
                            href={`/phim/${movie.slug}`}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Link>
                        <div className="min-w-0">
                            <p className="text-white font-semibold text-sm truncate leading-tight">
                                {movie.name}
                            </p>
                            <p className="text-yellow-400/70 text-xs">
                                {activeEpisode ? displayEpisodeName(activeEpisode.name) : ""}
                            </p>
                        </div>
                    </div>

                    {/* Right: controls */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {/* Prev episode */}
                        {prevEpisodeUrl && (
                            <Link
                                href={prevEpisodeUrl}
                                className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                Tập trước
                            </Link>
                        )}

                        {/* Auto-next toggle */}
                        <button
                            onClick={() => setAutoNext(!autoNext)}
                            className="flex items-center gap-2 text-xs font-semibold transition-colors"
                        >
                            <SkipForward className={cn("w-4 h-4", autoNext ? "text-yellow-400" : "text-gray-500")} />
                            <span className={autoNext ? "text-yellow-400" : "text-gray-500"}>Tự chuyển tập</span>
                            <span
                                className={cn(
                                    "px-1.5 py-0.5 rounded text-[10px] font-bold border",
                                    autoNext
                                        ? "bg-yellow-400/15 text-yellow-400 border-yellow-400/30"
                                        : "bg-white/5 text-gray-500 border-white/10"
                                )}
                            >
                                {autoNext ? "ON" : "OFF"}
                            </span>
                        </button>

                        {/* Next episode */}
                        {nextEpisodeUrl && (
                            <Link
                                href={nextEpisodeUrl}
                                className="flex items-center gap-1 text-xs font-semibold text-gray-300 hover:text-white transition-colors px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10"
                            >
                                Tập sau
                                <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        )}
                    </div>
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

            {/* Episodes Section */}
            {servers && servers.length > 0 && (
                <div
                    className={cn(
                        "relative mx-auto w-full",
                        isTheaterMode ? "max-w-[1500px]" : "w-full lg:max-w-none"
                    )}
                >
                    <WatchEpisodeSection
                        movieSlug={movie.slug}
                        movieName={movie.name}
                        servers={servers}
                        currentEpisodeSlug={currentEpisodeSlug}
                        activeServerName={activeServerName}
                        onServerChange={setActiveServerName}
                    />
                </div>
            )}
        </div>
    );
}
