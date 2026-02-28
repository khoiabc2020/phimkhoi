"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { addWatchHistory } from "@/app/actions/watchHistory";
import { useSession } from "next-auth/react";

declare global {
    interface Window {
        Hls: any;
    }
}

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
        duration?: number;
    };
    initialProgress?: number;
}

// Detect if a URL is a direct HLS stream or video file
function isDirectStream(url: string): boolean {
    if (!url) return false;
    return (
        url.includes(".m3u8") ||
        url.includes(".mp4") ||
        url.includes(".webm") ||
        url.includes(".ogg")
    );
}

export default function VideoPlayer({
    url,
    m3u8,
    slug,
    episode,
    movieData,
    initialProgress = 0,
}: VideoPlayerProps) {
    const artRef = useRef<HTMLDivElement>(null);
    const artInstance = useRef<any>(null);
    const { data: session } = useSession();
    const [useIframe, setUseIframe] = useState(false);

    // Use the best available URL
    const streamUrl = m3u8 || url;
    const shouldUseArtPlayer = isDirectStream(streamUrl);

    // Watch history tracking (same as before)
    useEffect(() => {
        if (!movieData || !session) return;
        const startTime = Date.now();
        const estimatedDuration = movieData.duration
            ? parseInt(String(movieData.duration)) * 60
            : 90 * 60;

        const firstSave = setTimeout(async () => {
            const elapsed = (Date.now() - startTime) / 1000;
            await addWatchHistory({
                ...movieData,
                duration: estimatedDuration,
                currentTime: Math.max(
                    elapsed,
                    initialProgress > 0 ? (initialProgress / 100) * estimatedDuration : 10
                ),
            });
        }, 10000);

        const interval = setInterval(async () => {
            const elapsed = (Date.now() - startTime) / 1000;
            // If artplayer is playing, use its currentTime
            const currentTime = artInstance.current?.currentTime || elapsed;
            await addWatchHistory({
                ...movieData,
                duration: estimatedDuration,
                currentTime,
            });
        }, 30000);

        return () => {
            clearTimeout(firstSave);
            clearInterval(interval);
        };
    }, [movieData, session, initialProgress]);

    // ArtPlayer initialization for direct streams
    useEffect(() => {
        if (!shouldUseArtPlayer || !artRef.current || useIframe) return;

        let art: any = null;

        const initArtPlayer = async () => {
            try {
                const Artplayer = (await import("artplayer")).default;

                const isHls = streamUrl.includes(".m3u8");

                art = new Artplayer({
                    container: artRef.current!,
                    url: streamUrl,
                    type: isHls ? "m3u8" : "",
                    autoplay: true,
                    autoSize: false,
                    autoMini: false,
                    loop: false,
                    flip: true,
                    playbackRate: true,
                    aspectRatio: true,
                    setting: true,
                    hotkey: true,
                    pip: true,
                    mutex: true,
                    fullscreen: true,
                    fullscreenWeb: true,
                    subtitleOffset: true,
                    miniProgressBar: true,
                    theme: "#eab308",
                    lang: "zh-cn",
                    quality: [],
                    moreVideoAttr: {
                        crossOrigin: "anonymous",
                    },
                    customType: {
                        m3u8: async (video: HTMLVideoElement, src: string) => {
                            // Load hls.js dynamically
                            const HlsModule = await import("hls.js");
                            const Hls = HlsModule.default;
                            if (Hls.isSupported()) {
                                const hls = new Hls({
                                    xhrSetup: (xhr: XMLHttpRequest) => {
                                        xhr.withCredentials = false;
                                    },
                                    maxBufferLength: 30,
                                    maxMaxBufferLength: 60,
                                    lowLatencyMode: false,
                                    startLevel: -1,
                                });
                                hls.loadSource(src);
                                hls.attachMedia(video);
                                (art as any).hls = hls;
                                art.on("destroy", () => hls.destroy());
                            } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                                video.src = src;
                            }
                        },
                    },
                    icons: {
                        loading: `<svg viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2.5" class="animate-spin w-10 h-10"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke="#eab308"/></svg>`,
                    },
                    controls: [
                        {
                            position: "right",
                            html: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
                            tooltip: "Toàn màn hình",
                            click: () => art.fullscreen && art.fullscreen(true),
                        },
                    ],
                });

                // Seek to saved progress
                if (initialProgress > 0) {
                    art.on("ready", () => {
                        const totalDuration = art.duration;
                        if (totalDuration > 0) {
                            art.seek = (initialProgress / 100) * totalDuration;
                        }
                    });
                }

                artInstance.current = art;

            } catch (err) {
                console.error("ArtPlayer init error:", err);
                // Fallback to iframe
                setUseIframe(true);
            }
        };

        initArtPlayer();

        return () => {
            if (art) {
                art.destroy(false);
                artInstance.current = null;
            }
        };
    }, [streamUrl, shouldUseArtPlayer, useIframe]);

    // === IFRAME fallback (embed URLs or non-stream URLs) ===
    if (!shouldUseArtPlayer || useIframe) {
        return (
            <div className="relative w-full h-full bg-black">
                <iframe
                    src={url}
                    className="w-full h-full"
                    allowFullScreen
                    allow="autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    title={`${slug} - ${episode}`}
                    frameBorder="0"
                />
            </div>
        );
    }

    // === ArtPlayer for direct HLS/MP4 streams ===
    return (
        <div
            ref={artRef}
            className="w-full h-full bg-black [&_.art-video-player]:!rounded-none"
            style={{ minHeight: "200px" }}
        />
    );
}
