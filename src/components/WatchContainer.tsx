"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import VideoPlayer from "@/components/VideoPlayer";
import WatchEngagementBar from "@/components/WatchEngagementBar";
import WatchEpisodeSection from "@/components/WatchEpisodeSection";
import { Movie } from "@/services/api";
import { Monitor, ChevronLeft, ChevronRight, SkipForward } from "lucide-react";

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
    initialProgress: number;
    movieData: any;
    initialServerName: string;
}

export default function WatchContainer({
    movie,
    currentEpisode: initialCurrentEpisode,
    episodes: initialEpisodes,
    servers,
    episodeThumbnails,
    episodeMetadata,
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
        currentServerEpisodes.find((ep: { slug?: string }) => ep.slug === currentEpisodeSlug) || initialCurrentEpisode;

    // NguonC: mặc định phát bằng iframe (link_embed) để hạn chế lỗi CORS/Referer.
    // Các server khác vẫn ưu tiên HLS qua hls-proxy nếu có link_m3u8.
    const isNguoncServer = /nguonc/i.test(activeServerName);
    const effectiveM3u8 =
        !isNguoncServer && activeEpisode?.link_m3u8
            ? `/api/hls-proxy?url=${encodeURIComponent(activeEpisode.link_m3u8)}`
            : undefined;

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

    return (
        <div className={cn("relative isolate transition-all duration-500", isLightOff ? "z-[60]" : "")}>

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

                {/* Player Card — trên mobile cho cảm giác phẳng, sát mép; trên desktop vẫn có shadow/ring */}
                <div
                    className={cn(
                        "relative z-10 mx-auto transition-all duration-500",
                        isTheaterMode
                            ? "w-full max-w-[1500px] aspect-video md:aspect-[21/9] h-auto overflow-hidden rounded-xl shadow-[0_20px_60px_#00000099] ring-1 ring-white/[0.08] bg-[#0F121AF2]"
                            : [
                                // Mobile: full-bleed, không bo góc, không shadow để giống app native
                                "w-full overflow-hidden bg-black",
                                // Từ sm trở lên: bo góc + shadow nhẹ như layout desktop
                                "sm:bg-[#0F121AF2] sm:rounded-xl sm:shadow-[0_20px_60px_#00000099] sm:ring-1 sm:ring-white/[0.08]",
                            ]
                    )}
                >
                    {/* Inner wrapper: luôn có aspect-ratio để container có chiều cao xác định, tránh màn đen khi chế độ rạp phim */}
                    <div className={cn(
                        "relative w-full min-h-0",
                        isTheaterMode ? "aspect-video md:aspect-[21/9]" : "aspect-video"
                    )}>

                        {activeEpisode ? (
                            <VideoPlayer
                                url={activeEpisode.link_embed}
                                m3u8={effectiveM3u8}
                                slug={movie.slug}
                                episode={displayEpisodeName(activeEpisode.name)}
                                movieData={movieData}
                                initialProgress={initialProgress}
                                autoNext={autoNext}
                                nextEpisodeUrl={nextEpisodeUrl}
                                isTheaterMode={isTheaterMode}
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-white gap-3">
                                <span className="text-4xl">🎬</span>
                                <p className="text-gray-400 text-sm">Tập phim không khả dụng.</p>
                            </div>
                        )}
                    </div>{/* end inner aspect-video wrapper */}
                </div>{/* end outer player card */}

                {/* Info Bar below player - Inline Layout */}
                <div className="mt-2 px-3 py-2.5 flex flex-row items-center justify-between gap-2 overflow-hidden rounded-lg border border-white/[0.10] bg-[#171B24] shadow-sm">
                    {/* Left: Title + Episode name */}
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                        <Link
                            href={`/phim/${movie.slug}`}
                            className="text-gray-300 hover:text-white transition-colors flex-shrink-0 w-8 h-8 hidden sm:flex items-center justify-center rounded-full hover:bg-white/10"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-white font-bold text-base sm:text-lg truncate leading-tight">
                                {movie.name}
                            </h1>
                            <p className="text-yellow-300 text-xs sm:text-sm mt-0.5 truncate font-semibold">
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
                                className="flex items-center justify-center text-xs font-semibold text-gray-300 hover:text-white transition-all w-9 h-9 sm:w-auto sm:px-3 sm:py-2 rounded-lg bg-white/5 hover:bg-white/12 border border-white/10 hover:border-white/20 touch-manipulation active:scale-95"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                <span className="hidden sm:inline ml-1">Tập trước</span>
                            </Link>
                        ) : (
                            <div className="flex items-center justify-center text-xs font-semibold text-gray-500 w-9 h-9 sm:w-auto sm:px-3 sm:py-2 rounded-lg bg-[#232836] border border-white/10 cursor-not-allowed">
                                <ChevronLeft className="w-4 h-4" />
                                <span className="hidden sm:inline ml-1">Tập trước</span>
                            </div>
                        )}

                        {/* Auto-next toggle */}
                        <button
                            onClick={() => setAutoNext(!autoNext)}
                            title="Tự động chuyển tập"
                            className={cn(
                                "flex items-center justify-center transition-all w-9 h-9 sm:w-auto sm:px-3 sm:py-2 rounded-lg border touch-manipulation active:scale-95",
                                autoNext
                                    ? "bg-yellow-400/15 text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/25"
                                    : "bg-white/8 text-gray-200 border-white/15 hover:bg-white/12"
                            )}
                        >
                            <SkipForward className={cn("w-3.5 h-3.5", autoNext ? "text-yellow-400" : "text-gray-300")} />
                            <span className="hidden sm:inline ml-1.5 text-xs font-bold">Tự chuyển</span>
                            <span className={cn(
                                "hidden sm:inline ml-1.5 px-1 py-0.5 rounded text-[10px] font-bold",
                                autoNext ? "bg-yellow-400/20" : "bg-white/10"
                            )}>
                                {autoNext ? "BẬT" : "TẮT"}
                            </span>
                        </button>

                        {/* Next episode */}
                        {nextEpisodeUrl ? (
                            <Link
                                href={nextEpisodeUrl}
                                title="Tập sau"
                                className="flex items-center justify-center text-xs font-bold text-white bg-[#F4C84A] hover:bg-yellow-300 transition-all w-9 h-9 sm:w-auto sm:px-3 sm:py-2 rounded-lg touch-manipulation active:scale-95 shadow-md shadow-yellow-400/20"
                            >
                                <span className="hidden sm:inline mr-1">Tập sau</span>
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        ) : (
                            <div className="flex items-center justify-center text-xs font-semibold text-gray-500 w-9 h-9 sm:w-auto sm:px-3 sm:py-2 rounded-lg bg-[#232836] border border-white/10 cursor-not-allowed">
                                <span className="hidden sm:inline mr-1">Tập sau</span>
                                <ChevronRight className="w-4 h-4" />
                            </div>
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
                    autoNext={autoNext}
                    onAutoNextToggle={() => setAutoNext(!autoNext)}
                    currentEpisodeName={activeEpisode ? displayEpisodeName(activeEpisode.name) : undefined}
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
                        onServerChange={setActiveServerName}
                    />
                </div>
            )}

        </div>
    );
}
