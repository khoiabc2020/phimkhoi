"use client";

import { useEffect, useRef, useCallback } from "react";
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
        duration?: number;
    };
    initialProgress?: number;
}

// Custom Vietnamese locale for ArtPlayer
const VI_LOCALE = {
    "Video Info": "Thông tin video",
    "Close": "Đóng",
    "Video Load Failed": "Tải video thất bại",
    "Volume": "Âm lượng",
    "Play": "Phát",
    "Pause": "Dừng",
    "Rate": "Tốc độ",
    "Mute": "Tắt tiếng",
    "Unmute": "Bật tiếng",
    "Fullscreen": "Toàn màn hình",
    "Exit Fullscreen": "Thoát toàn màn hình",
    "Web Fullscreen": "Toàn cửa sổ",
    "Exit Web Fullscreen": "Thoát toàn cửa sổ",
    "Setting": "Cài đặt",
    "Normal": "Mặc định",
    "Please try to switch the video source": "Vui lòng đổi server",
    "No video yet, please check back later": "Chưa có video, thử lại sau",
    "ArtPlayer is destroyed": "ArtPlayer đã bị huỷ",
    "Subtitle Offset": "Độ lệch phụ đề",
    "Last Seen": "Đã xem",
    "PNG Screenshot": "Chụp màn hình",
    "Play Speed": "Tốc độ phát",
    "Aspect Ratio": "Tỉ lệ khung hình",
    "Default": "Mặc định",
    "Flip": "Lật",
    "Horizontal": "Ngang",
    "Vertical": "Dọc",
    "Reconnect": "Kết nối lại",
};

function isDirectStream(url: string): boolean {
    if (!url) return false;
    return url.includes(".m3u8") || url.includes(".mp4") || url.includes(".webm");
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
    const lastSavedRef = useRef<number>(0);

    const streamUrl = m3u8 || url;
    const shouldUseArtPlayer = isDirectStream(streamUrl);

    // Realtime history save — debounced every 15s based on actual video time
    const saveHistory = useCallback(async (currentTime: number, duration: number) => {
        if (!movieData || !session?.user) return;
        if (currentTime - lastSavedRef.current < 15) return; // throttle
        lastSavedRef.current = currentTime;
        try {
            await addWatchHistory({
                ...movieData,
                duration,
                currentTime,
            });
        } catch { /* silent */ }
    }, [movieData, session]);

    // ArtPlayer init for direct HLS/MP4
    useEffect(() => {
        if (!shouldUseArtPlayer || !artRef.current) return;

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
                    theme: "#F4C84A",
                    i18n: { "vi": VI_LOCALE },
                    lang: "vi",
                    moreVideoAttr: { crossOrigin: "anonymous" },
                    customType: {
                        m3u8: async (video: HTMLVideoElement, src: string) => {
                            const HlsModule = await import("hls.js");
                            const Hls = HlsModule.default;
                            if (Hls.isSupported()) {
                                const hls = new Hls({
                                    maxBufferLength: 30,
                                    maxMaxBufferLength: 60,
                                    startLevel: -1, // Auto quality
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
                });

                artInstance.current = art;

                // Seek to saved progress on ready
                art.on("ready", () => {
                    const totalDuration = art.duration;
                    if (initialProgress > 0 && totalDuration > 0) {
                        art.seek = Math.floor((initialProgress / 100) * totalDuration);
                    }
                });

                // Realtime history save every 15s of actual playback
                art.on("timeupdate", () => {
                    const currentTime = art.currentTime;
                    const duration = art.duration;
                    if (currentTime > 0 && duration > 0) {
                        saveHistory(currentTime, duration);
                    }
                });

                // Save on pause and before destroy
                const saveOnPause = () => {
                    const ct = art.currentTime;
                    const dur = art.duration;
                    if (ct > 0 && dur > 0 && movieData && session?.user) {
                        lastSavedRef.current = ct; // force save
                        addWatchHistory({ ...movieData, duration: dur, currentTime: ct }).catch(() => { });
                    }
                };
                art.on("pause", saveOnPause);
                art.on("destroy", saveOnPause);

            } catch (err) {
                console.error("ArtPlayer init error:", err);
            }
        };

        initArtPlayer();

        return () => {
            if (art) {
                art.destroy(false);
                artInstance.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [streamUrl]);

    // Iframe fallback — for embed URLs + history tracking via elapsed time
    if (!shouldUseArtPlayer) {
        return (
            <IframePlayer
                url={url}
                slug={slug}
                episode={episode}
                movieData={movieData}
                initialProgress={initialProgress}
                session={session}
            />
        );
    }

    return (
        <div
            ref={artRef}
            className="w-full h-full bg-black"
            style={{ minHeight: "200px" }}
        />
    );
}

// Separated iframe player keeps elapsed-based history tracking
function IframePlayer({ url, slug, episode, movieData, initialProgress, session }: any) {
    useEffect(() => {
        if (!movieData || !session?.user) return;
        const startTime = Date.now();
        const estimatedDuration = movieData.duration
            ? parseInt(String(movieData.duration)) * 60
            : 90 * 60;

        const firstSave = setTimeout(async () => {
            const elapsed = (Date.now() - startTime) / 1000;
            await addWatchHistory({
                ...movieData,
                duration: estimatedDuration,
                currentTime: Math.max(elapsed, initialProgress > 0 ? (initialProgress / 100) * estimatedDuration : 10),
            });
        }, 10000);

        const interval = setInterval(async () => {
            const elapsed = (Date.now() - startTime) / 1000;
            await addWatchHistory({ ...movieData, duration: estimatedDuration, currentTime: elapsed });
        }, 30000);

        return () => {
            clearTimeout(firstSave);
            clearInterval(interval);
        };
    }, [movieData, session, initialProgress]);

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
