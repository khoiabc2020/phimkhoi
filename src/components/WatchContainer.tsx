"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import VideoPlayer from "@/components/VideoPlayer";
import WatchEngagementBar from "@/components/WatchEngagementBar";
import WatchEpisodeSection from "@/components/WatchEpisodeSection";
import { Movie } from "@/services/api";
import { Monitor, ChevronLeft, ChevronRight, SkipForward, Loader2 } from "lucide-react";
import { getWatchHistoryForEpisode, addWatchHistory } from "@/app/actions/watchHistory";

interface Episode {
    slug: string;
    name: string;
    link_embed: string;
    link_m3u8?: string;
}

interface Server {
    server_name: string;
    server_data: Episode[];
}

interface WatchContainerProps {
    movie: Movie;
    currentEpisode: Episode;
    episodes: Episode[];
    servers: Server[];
    episodeThumbnails?: Record<string, string>;
    episodeMetadata?: Record<string, { title?: string; overview?: string; airDate?: string; runtime?: number; voteAverage?: number }>;
    movieData: any;
    initialServerName: string;
    onPlayerError?: () => void;
}

export default function WatchContainer({
    movie,
    currentEpisode: initialCurrentEpisode,
    episodes: initialEpisodes,
    servers,
    episodeThumbnails,
    episodeMetadata,
    movieData,
    initialServerName,
}: WatchContainerProps) {
    const router = useRouter();
    const [isTheaterMode, setIsTheaterMode] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("theaterMode") === "true";
        }
        return false;
    });
    const [isLightOff, setIsLightOff] = useState(false);
    const [autoNext, setAutoNext] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("autoNext") !== "false";
        }
        return true;
    });
    const [activeServerName, setActiveServerName] = useState(
        initialServerName || servers?.[0]?.server_name || ""
    );
    const [progress, setProgress] = useState(0);
    const [progressLoaded] = useState(true);

    const activeServer = servers?.find((s) => s.server_name === activeServerName) || servers?.[0];
    const currentServerEpisodes = activeServer?.server_data || initialEpisodes || [];

    const currentEpisodeSlug = initialCurrentEpisode?.slug;
    const activeEpisode =
        currentServerEpisodes.find((ep: { slug?: string }) => ep.slug === currentEpisodeSlug) || initialCurrentEpisode;

    /** ArtPlayer vs Iframe control */
    const [useIframe, setUseIframe] = useState(false);
    const [playerError, setPlayerError] = useState(false);

    // Determine the content to play based on error state and server type
    // If it's NguonC, we try M3U8 first but allow quick fallback
    const effectiveM3u8 = activeEpisode?.link_m3u8;
    const canUseCustom = !!effectiveM3u8 && !useIframe && !playerError;
    const playbackKey = `${activeServerName}:${activeEpisode?.slug || currentEpisodeSlug || ""}:${effectiveM3u8 || activeEpisode?.link_embed || ""}`;

    // Compute prev/next episode index
    const currentIdx = currentServerEpisodes.findIndex((ep: { slug?: string }) => ep.slug === currentEpisodeSlug);
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

    // Fetch initial progress on client side - Non-blocking for the player
    useEffect(() => {
        let isMounted = true;
        if (movie._id && currentEpisodeSlug) {
            getWatchHistoryForEpisode(movie._id, currentEpisodeSlug)
                .then((res) => {
                    if (isMounted && res.success && res.data) {
                        const savedProgress = res.data.progress || 0;
                        setProgress(savedProgress);
                        // If player is already ready, seek it
                        if (savedProgress > 5 && (window as any).art) {
                            const art = (window as any).art;
                            if (art.duration > 0) {
                                art.seek = (savedProgress / 100) * art.duration;
                            }
                        }
                    }
                })
                .catch(() => {});
        }

        return () => { isMounted = false; };
    }, [movie._id, currentEpisodeSlug]);

    // Đồng bộ lịch sử khi chọn tập phim (ngay cả với Iframe gốc)
    useEffect(() => {
        if (movie && activeEpisode) {
            addWatchHistory({
                movieId: movie._id,
                movieSlug: movie.slug,
                movieName: movie.name,
                movieOriginName: movie.origin_name || movie.name,
                moviePoster: movie.poster_url,
                movieThumb: movie.thumb_url,
                episodeSlug: activeEpisode.slug || "",
                episodeName: activeEpisode.name || "",
                duration: 0,
                currentTime: 0,
            }).catch(() => {});
        }
    }, [movie, activeEpisode]);

    useEffect(() => {
        router.prefetch(`/phim/${movie.slug}`);
        if (prevEpisodeUrl) router.prefetch(prevEpisodeUrl);
        if (nextEpisodeUrl) router.prefetch(nextEpisodeUrl);
    }, [movie.slug, nextEpisodeUrl, prevEpisodeUrl, router]);

    return (
        <div className={cn("relative w-full", isTheaterMode ? "z-[50]" : (isLightOff ? "z-[60]" : "z-10"))}>

            {/* Light Off Overlay */}
            {isLightOff && (
                <div
                    className="fixed inset-0 bg-black/80 z-40 transition-opacity duration-500"
                    onClick={() => setIsLightOff(false)}
                />
            )}

            {/* Placeholder when theater mode on */}
            {isTheaterMode && <div className="w-full aspect-video hidden md:block" />}

            {/* Theater Mode Container */}
            <div
                className={cn(
                    "transition-all duration-300",
                    isTheaterMode
                        ? "fixed top-[70px] md:top-[80px] left-0 right-0 bottom-0 z-[100] bg-[#0a0a0a] overflow-y-auto w-full px-4 md:px-10 lg:px-20 py-6 pb-32"
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

                {/* Player Card — trên mobile full-bleed sát mép, desktop có shadow/ring */}
                <div className="relative -mx-4 sm:mx-0">
                    <div
                        className={cn(
                            "relative z-10 mx-auto transition-all duration-500",
                            isTheaterMode
                                ? "w-full max-w-[1500px] aspect-video md:aspect-[21/9] h-auto overflow-hidden rounded-xl shadow-[0_20px_60px_#00000099] ring-1 ring-white/[0.06] bg-[#0B0B10F2]"
                                : [
                                    // Mobile: full-bleed, không bo góc, không shadow để giống app native
                                    "w-full overflow-hidden bg-black",
                                    // Từ sm trở lên: bo góc + shadow nhẹ như layout desktop
                                    "sm:bg-[#0B0B10F2] sm:rounded-xl sm:shadow-[0_20px_60px_#00000099] sm:ring-1 sm:ring-white/[0.06]",
                                ]
                        )}
                    >
                        {/* Inner wrapper: luôn có aspect-ratio để container có chiều cao xác định, tránh màn đen khi chế độ rạp phim */}
                        <div className={cn(
                            "relative w-full min-h-0",
                            isTheaterMode ? "aspect-video md:aspect-[21/9]" : "aspect-video"
                        )}>

                            {!progressLoaded ? (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-white gap-3">
                                    <Loader2 className="w-8 h-8 animate-spin text-[#8FA7C5]" />
                                    <p className="text-gray-400 text-sm animate-pulse">Đang tải trình phát...</p>
                                </div>
                            ) : activeEpisode && canUseCustom ? (
                                <VideoPlayer
                                    key={playbackKey}
                                    url={activeEpisode.link_embed}
                                    m3u8={effectiveM3u8}
                                    slug={movie.slug}
                                    episode={displayEpisodeName(activeEpisode.name)}
                                    movieData={movieData}
                                    initialProgress={progress}
                                    autoNext={autoNext}
                                    nextEpisodeUrl={nextEpisodeUrl}
                                    isTheaterMode={isTheaterMode}
                                    serverName={activeServerName}
                                    onPlayerError={() => {
                                        console.warn("ArtPlayer failed, falling back to Iframe...");
                                        setPlayerError(true);
                                    }}
                                />
                            ) : activeEpisode ? (
                                <div className="w-full h-full relative">
                                    <div key={playbackKey} className="w-full h-full relative">
                                    <iframe
                                        src={activeEpisode.link_embed}
                                        className="w-full h-full border-0 overflow-hidden"
                                        allowFullScreen
                                        allow="autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                        scrolling="no"
                                    />
                                    {playerError && (
                                        <div className="absolute top-4 right-4 z-20">
                                            <div className="bg-yellow-500/90 text-black px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2">
                                                TỰ ĐỘNG CHUYỂN IFRAME (PLAYER GỐC LỖI)
                                            </div>
                                        </div>
                                    )}
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-white gap-3">
                                    <span className="text-4xl">🎬</span>
                                    <p className="text-gray-400 text-sm">Tập phim không khả dụng.</p>
                                </div>
                            )}
                        </div>{/* end inner aspect-video wrapper */}
                    </div>{/* end outer player card */}
                </div>

                {/* Info Bar below player - Inline Layout */}
                <div className="mt-1 px-3 py-2 sm:px-3 sm:py-2.5 flex flex-row items-center justify-between gap-2 overflow-hidden bg-[#09090d]/95 sm:bg-[#0B0B10] border-t border-white/[0.06] sm:rounded-[10px] sm:border sm:shadow-[0_8px_18px_#00000055]">
                    {/* Left: Title + Episode name */}
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                        <Link
                            href={`/phim/${movie.slug}`}
                            className="text-gray-300 hover:text-white transition-colors flex-shrink-0 w-8 h-8 hidden sm:flex items-center justify-center rounded-full hover:bg-white/10"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-white font-extrabold text-[15px] sm:text-lg truncate leading-tight">
                                {movie.name}
                            </h1>
                            <p className="text-[#8FA7C5] text-xs sm:text-sm mt-0.5 truncate font-semibold">
                                {activeEpisode ? displayEpisodeName(activeEpisode.name) : ""}
                            </p>
                        </div>
                    </div>

                    {/* Right: Episode navigation */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Prev episode */}
                        {prevEpisodeUrl ? (
                            <Link
                                href={prevEpisodeUrl}
                                title="Tập trước"
                                className="flex items-center justify-center text-xs font-semibold text-gray-300 hover:text-white transition-all w-8 h-8 sm:w-auto sm:px-3 sm:py-2 rounded-[10px] bg-[#0B0B10] hover:bg-white/[0.08] border border-white/[0.10] hover:border-white/[0.20] touch-manipulation active:scale-95"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                <span className="hidden sm:inline ml-1">Tập trước</span>
                            </Link>
                        ) : (
                            <div className="flex items-center justify-center text-xs font-semibold text-gray-500 w-8 h-8 sm:w-auto sm:px-3 sm:py-2 rounded-[10px] bg-[#14161d] border border-white/[0.10] cursor-not-allowed">
                                <ChevronLeft className="w-4 h-4" />
                                <span className="hidden sm:inline ml-1">Tập trước</span>
                            </div>
                        )}

                        {/* Auto-next toggle */}
                        <button
                            onClick={() => setAutoNext(!autoNext)}
                            title="Tự động chuyển tập"
                            className={cn(
                                "flex items-center justify-center transition-all w-8 h-8 sm:w-auto sm:px-3 sm:py-2 rounded-[10px] border touch-manipulation active:scale-95",
                                autoNext
                                    ? "bg-[#8FA7C5]/15 text-[#8FA7C5] border-[#8FA7C5]/30 hover:bg-[#8FA7C5]/25"
                                    : "bg-white/8 text-gray-200 border-white/15 hover:bg-white/12"
                            )}
                        >
                            <SkipForward className={cn("w-3.5 h-3.5", autoNext ? "text-[#8FA7C5]" : "text-gray-300")} />
                            <span className="hidden sm:inline ml-1.5 text-xs font-bold">Tự chuyển</span>
                            <span className={cn(
                                "hidden sm:inline ml-1.5 px-1 py-0.5 rounded text-[10px] font-bold",
                                autoNext ? "bg-[#8FA7C5]/20" : "bg-white/10"
                            )}>
                                {autoNext ? "BẬT" : "TẮT"}
                            </span>
                        </button>

                        {/* Next episode */}
                        {nextEpisodeUrl ? (
                            <Link
                                href={nextEpisodeUrl}
                                title="Tập sau"
                                className="flex items-center justify-center text-xs font-bold text-[#0a0a0a] bg-[#8FA7C5] hover:bg-[#a8bdd8] transition-all w-8 h-8 sm:w-auto sm:px-3 sm:py-2 rounded-[10px] touch-manipulation active:scale-95"
                            >
                                <span className="hidden sm:inline mr-1">Tập sau</span>
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        ) : (
                            <div className="flex items-center justify-center text-xs font-semibold text-gray-500 w-8 h-8 sm:w-auto sm:px-3 sm:py-2 rounded-[10px] bg-[#14161d] border border-white/[0.10] cursor-not-allowed">
                                <span className="hidden sm:inline mr-1">Tập sau</span>
                                <ChevronRight className="w-4 h-4" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Engagement Bar */}
                <div className="mt-3 sm:mt-4 relative z-10 px-3 sm:px-0">
                    <WatchEngagementBar
                        movie={movie}
                        isTheaterMode={isTheaterMode}
                        toggleTheater={() => {
                            const next = !isTheaterMode;
                            setIsTheaterMode(next);
                            localStorage.setItem("theaterMode", String(next));
                        }}
                        isLightOff={isLightOff}
                        toggleLight={() => setIsLightOff(!isLightOff)}
                        autoNext={autoNext}
                        onAutoNextToggle={() => {
                            const next = !autoNext;
                            setAutoNext(next);
                            localStorage.setItem("autoNext", String(next));
                        }}
                        currentEpisodeName={activeEpisode ? displayEpisodeName(activeEpisode.name) : undefined}
                        useIframe={!canUseCustom}
                        onTogglePlayer={() => {
                            if (playerError) {
                                setPlayerError(false);
                                setUseIframe(false);
                            } else {
                                setUseIframe(!useIframe);
                            }
                        }}
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
                            episodeThumbnails={episodeThumbnails}
                            episodeMetadata={episodeMetadata}
                            currentEpisodeSlug={currentEpisodeSlug}
                            activeServerName={activeServerName}
                            onServerChange={(serverName) => {
                                setUseIframe(false);
                                setPlayerError(false);
                                setActiveServerName(serverName);
                            }}
                        />
                    </div>
                )}
            </div>

        </div>
    );
}
