"use client";

import { useEffect, useRef, useCallback } from "react";
import { addWatchHistory } from "@/app/actions/watchHistory";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

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
    // Auto-next episode support
    autoNext?: boolean;
    nextEpisodeUrl?: string; // Route path for next episode, e.g. /xem-phim/slug/ep-02
    onEnded?: () => void;
}

// Vietnamese i18n for ArtPlayer
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
    "Normal": "Thường",
    "Please try to switch the video source": "Vui lòng đổi server khác",
    "No video yet, please check back later": "Chưa có video",
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
    "0.5x": "0.5x (Chậm)",
    "1.0x": "Bình thường",
    "1.25x": "1.25x",
    "1.5x": "1.5x (Nhanh)",
    "2.0x": "2.0x (Rất nhanh)",
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
    autoNext = false,
    nextEpisodeUrl,
    onEnded,
}: VideoPlayerProps) {
    const artRef = useRef<HTMLDivElement>(null);
    const artInstance = useRef<any>(null);
    const { data: session } = useSession();
    const router = useRouter();
    const lastSavedRef = useRef<number>(0);
    const autoNextRef = useRef(autoNext);
    const nextEpisodeUrlRef = useRef(nextEpisodeUrl);

    // Keep refs in sync so closure captures latest values
    useEffect(() => { autoNextRef.current = autoNext; }, [autoNext]);
    useEffect(() => { nextEpisodeUrlRef.current = nextEpisodeUrl; }, [nextEpisodeUrl]);

    const streamUrl = m3u8 || url;
    const shouldUseArtPlayer = isDirectStream(streamUrl);

    // Realtime watch history save — throttled every 15s
    const saveHistory = useCallback(async (currentTime: number, duration: number) => {
        if (!movieData || !session?.user) return;
        if (currentTime - lastSavedRef.current < 15) return;
        lastSavedRef.current = currentTime;
        try {
            await addWatchHistory({ ...movieData, duration, currentTime });
        } catch { /* silent */ }
    }, [movieData, session]);

    const handleVideoEnd = useCallback(() => {
        onEnded?.();
        if (autoNextRef.current && nextEpisodeUrlRef.current) {
            router.push(nextEpisodeUrlRef.current);
        }
    }, [onEnded, router]);

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
                    screenshot: true,
                    theme: "#F4C84A",
                    i18n: { "vi": VI_LOCALE },
                    lang: "vi",
                    moreVideoAttr: { crossOrigin: "anonymous" },
                    icons: {
                        play: `<div style="display:flex; align-items:center; justify-content:center; width:36px; height:36px; margin: 0 4px; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M10.5 8.5L15.5 12L10.5 15.5V8.5Z" fill="white" stroke="none"></path></svg></div>`,
                        pause: `<div style="display:flex; align-items:center; justify-content:center; width:36px; height:36px; margin: 0 4px; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9 8.5H11V15.5H9V8.5Z" fill="white" stroke="none"></path><path d="M13 8.5H15V15.5H13V8.5Z" fill="white" stroke="none"></path></svg></div>`,
                        volume: `<div style="display:flex; align-items:center; justify-content:center; width:36px; height:36px; margin: 0; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="white" stroke="none"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg></div>`,
                        volumeClose: `<div style="display:flex; align-items:center; justify-content:center; width:36px; height:36px; margin: 0; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="white" stroke="none"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg></div>`,
                        setting: `<div style="display:flex; align-items:center; justify-content:center; width:36px; height:36px; transition: opacity 0.2s; position: relative;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg><span style="position: absolute; top: 0px; right: -2px; background: white; color: black; font-size: 8px; font-weight: 800; padding: 1px 4px; border-radius: 6px; letter-spacing: -0.2px;">Auto</span></div>`,
                        fullscreenWebOff: `<div style="display:flex; align-items:center; justify-content:center; width:36px; height:36px; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg></div>`,
                        fullscreenWebOn: `<div style="display:flex; align-items:center; justify-content:center; width:36px; height:36px; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3h-3m18 0h-3v-3m0 18v-3h3m-18 0h3v3"></path></svg></div>`,
                        fullscreen: `<div style="display:flex; align-items:center; justify-content:center; width:36px; height:36px; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg></div>`,
                        fullscreenClose: `<div style="display:flex; align-items:center; justify-content:center; width:36px; height:36px; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3h-3m18 0h-3v-3m0 18v-3h3m-18 0h3v3"></path></svg></div>`,
                        pip: `<div style="display:flex; align-items:center; justify-content:center; width:36px; height:36px; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="none" fill="rgba(255,255,255,0.2)"></rect><rect x="11" y="11" width="10" height="10" rx="1" ry="1" fill="white" stroke="none"></rect></svg></div>`,
                    },
                    // Controls: skip -10, skip +10
                    controls: [
                        // Skip back 10s
                        {
                            position: "left",
                            name: "skip-back",
                            index: 1,
                            html: `<div style="display:flex; align-items:center; justify-content:center; width:36px; height:36px; margin: 0; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">
                                <svg viewBox="0 0 24 24" width="24" height="24" stroke="white" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M12 5.5v-3.5l-4 3.5 4 3.5v-2.5a7.5 7.5 0 1 1-7.5 7.5" />
                                    <text x="12" y="15.5" font-size="8" font-family="system-ui, -apple-system, sans-serif" font-weight="600" text-anchor="middle" fill="white" stroke="none">10</text>
                                </svg>
                            </div>`,
                            tooltip: "Tua lùi 10s",
                            click: () => { if (art) art.currentTime = Math.max(0, art.currentTime - 10); },
                        },
                        // Skip forward 10s
                        {
                            position: "left",
                            name: "skip-forward",
                            index: 2,
                            html: `<div style="display:flex; align-items:center; justify-content:center; width:36px; height:36px; margin: 0; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">
                                <svg viewBox="0 0 24 24" width="24" height="24" stroke="white" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M12 5.5v-3.5l4 3.5-4 3.5v-2.5a7.5 7.5 0 1 0 7.5 7.5" />
                                    <text x="12" y="15.5" font-size="8" font-family="system-ui, -apple-system, sans-serif" font-weight="600" text-anchor="middle" fill="white" stroke="none">10</text>
                                </svg>
                            </div>`,
                            tooltip: "Tua tiếp 10s",
                            click: () => { if (art) art.currentTime = Math.min(art.duration, art.currentTime + 10); },
                        },
                        // Auto Next Episode Toggle
                        {
                            position: "right",
                            name: "auto-next",
                            index: 10,
                            html: `<div style="display:flex; align-items:center; margin-right: 8px; cursor: pointer; opacity: 0.9;" id="auto-next-toggle">
                                <span style="font-size: 13px; color: rgba(255,255,255,0.8); margin-right: 8px; font-weight: 500;">Chuyển tập</span>
                                <div style="width: 32px; height: 18px; background: #00A65F; border-radius: 9px; position: relative; transition: background 0.2s;" id="auto-next-bg">
                                    <div style="width: 14px; height: 14px; background: white; border-radius: 50%; position: absolute; top: 2px; left: 16px; transition: left 0.2s;" id="auto-next-dot"></div>
                                </div>
                            </div>`,
                            tooltip: "Tự động chuyển tập",
                            click: function () {
                                const bg = document.getElementById("auto-next-bg");
                                const dot = document.getElementById("auto-next-dot");
                                if (bg && dot) {
                                    const isAuto = bg.style.background === "rgb(0, 166, 95)" || bg.style.background === "#00A65F" || bg.style.background === "#00a65f";
                                    if (isAuto) {
                                        bg.style.background = "rgba(255,255,255,0.3)";
                                        dot.style.left = "2px";
                                        localStorage.setItem("autoNextEpisode", "false");
                                    } else {
                                        bg.style.background = "#00A65F";
                                        dot.style.left = "16px";
                                        localStorage.setItem("autoNextEpisode", "true");
                                    }
                                }
                            },
                            mounted: function () {
                                const isAuto = localStorage.getItem("autoNextEpisode") !== "false";
                                const bg = document.getElementById("auto-next-bg");
                                const dot = document.getElementById("auto-next-dot");
                                if (bg && dot) {
                                    if (isAuto) {
                                        bg.style.background = "#00A65F";
                                        dot.style.left = "16px";
                                    } else {
                                        bg.style.background = "rgba(255,255,255,0.3)";
                                        dot.style.left = "2px";
                                    }
                                }
                            }
                        },
                        // Next Episode Button
                        {
                            position: "right",
                            name: "next-episode",
                            index: 11,
                            html: `<div style="display:flex; align-items:center; justify-content:center; width:36px; height:36px; margin: 0 4px; opacity: 0.8; transition: opacity 0.2s; cursor: pointer;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polygon points="5 4 15 12 5 20 5 4" fill="white" stroke="none"/>
                                    <line x1="19" y1="5" x2="19" y2="19" />
                                </svg>
                            </div>`,
                            tooltip: "Tập tiếp theo",
                            click: () => {
                                const currentActiveStr = window.location.pathname;
                                const episodeLinks = document.querySelectorAll('a[href^="/xem-phim/"]');
                                let foundCurrent = false;
                                let nextUrl = null;
                                for (let i = 0; i < episodeLinks.length; i++) {
                                    const link = episodeLinks[i] as HTMLAnchorElement;
                                    const href = link.getAttribute('href');
                                    if (href === currentActiveStr || href === decodeURIComponent(currentActiveStr)) {
                                        foundCurrent = true;
                                    } else if (foundCurrent && href && href.split('/').length >= 4) {
                                        nextUrl = href;
                                        break;
                                    }
                                }
                                if (nextUrl) {
                                    window.location.href = nextUrl;
                                }
                            },
                        },
                    ],
                    customType: {
                        m3u8: async (video: HTMLVideoElement, src: string) => {
                            const HlsModule = await import("hls.js");
                            const Hls = HlsModule.default;
                            if (Hls.isSupported()) {
                                const hls = new Hls({
                                    maxBufferLength: 30,
                                    maxMaxBufferLength: 60,
                                    startLevel: -1,
                                    xhrSetup: (xhr: XMLHttpRequest) => {
                                        xhr.withCredentials = false;
                                    },
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
                    if (initialProgress > 0 && art.duration > 0) {
                        const seekTo = Math.floor((initialProgress / 100) * art.duration);
                        if (seekTo > 10) art.seek = seekTo;
                    }
                });

                // Realtime history save
                art.on("timeupdate", () => {
                    saveHistory(art.currentTime, art.duration);
                });

                // Auto-next on video end
                art.on("video:ended", () => {
                    handleVideoEnd();
                });

                // Save on pause/destroy
                const forceHistorySave = () => {
                    const ct = art?.currentTime;
                    const dur = art?.duration;
                    if (ct > 0 && dur > 0 && movieData && session?.user) {
                        lastSavedRef.current = ct;
                        addWatchHistory({ ...movieData, duration: dur, currentTime: ct }).catch(() => { });
                    }
                };
                art.on("pause", forceHistorySave);
                art.on("destroy", forceHistorySave);

                // Keyboard shortcuts
                document.addEventListener("keydown", (e) => {
                    if (!art || document.activeElement?.tagName === "INPUT") return;
                    if (e.key === "ArrowLeft") { art.currentTime = Math.max(0, art.currentTime - 10); e.preventDefault(); }
                    if (e.key === "ArrowRight") { art.currentTime = Math.min(art.duration, art.currentTime + 10); e.preventDefault(); }
                });

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

    // Iframe fallback
    if (!shouldUseArtPlayer) {
        return (
            <IframePlayer
                url={url}
                slug={slug}
                episode={episode}
                movieData={movieData}
                initialProgress={initialProgress}
                session={session}
                onEnded={handleVideoEnd}
            />
        );
    }

    return (
        <>
            <div ref={artRef} className="w-full h-full bg-black art-ios-theme" style={{ minHeight: "200px" }} />
            <style jsx global>{`
                .art-ios-theme.art-video-player .art-bottom {
                    padding-bottom: 8px;
                    padding-left: 12px;
                    padding-right: 12px;
                }
                .art-ios-theme.art-video-player .art-controls-left .art-volume {
                    margin-left: 8px !important;
                }
                .art-ios-theme.art-video-player .art-volume-slider {
                    width: 70px !important;
                }
                .art-ios-theme.art-video-player .art-volume-slider-handle {
                    border-radius: 50% !important;
                    background: white !important;
                    width: 14px !important;
                    height: 14px !important;
                    box-shadow: 0 0 4px rgba(0,0,0,0.4) !important;
                }
                .art-ios-theme.art-video-player .art-volume-slider-track {
                    background: rgba(255,255,255,0.25) !important;
                    height: 4px !important;
                }
                .art-ios-theme.art-video-player .art-volume-slider-progress {
                    background: white !important;
                    height: 4px !important;
                }
                /* Thin progress bar like iOS */
                .art-ios-theme.art-video-player .art-progress {
                    height: 6px !important;
                    margin-bottom: 0px !important;
                }
                .art-ios-theme.art-video-player .art-progress-played {
                    background: #fff !important;
                }
                .art-ios-theme.art-video-player .art-progress-indicator {
                    background: white !important;
                    width: 16px !important;
                    height: 16px !important;
                    box-shadow: 0 0 6px rgba(0,0,0,0.5) !important;
                }
                .art-ios-theme.art-video-player .art-progress-loaded {
                    background: rgba(255,255,255,0.3) !important;
                }
            `}</style>
        </>
    );
}

function IframePlayer({ url, slug, episode, movieData, initialProgress, session, onEnded }: any) {
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
