"use client";

import { useEffect, useRef, useCallback, useState } from "react";
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
    autoNext?: boolean;
    nextEpisodeUrl?: string;
    onEnded?: () => void;
    /** Khi bật chế độ rạp phim, container đổi kích thước — cần resize player */
    isTheaterMode?: boolean;
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
    isTheaterMode = false,
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
    const [fallbackIframe, setFallbackIframe] = useState(false);
    const shouldUseArtPlayer = !fallbackIframe && isDirectStream(streamUrl);

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
            // Thay vì nhảy ngay lập tức, ta cho countdown 5s để tăng UX
            let countdown = 5;
            const container = artRef.current;
            let countdownEl: HTMLDivElement | null = null;

            if (container) {
                countdownEl = document.createElement('div');
                countdownEl.style.position = 'absolute';
                countdownEl.style.top = '10%';
                countdownEl.style.right = '4%';
                countdownEl.style.background = 'rgba(0,0,0,0.7)';
                countdownEl.style.color = 'white';
                countdownEl.style.padding = '8px 16px';
                countdownEl.style.borderRadius = '8px';
                countdownEl.style.zIndex = '999';
                countdownEl.style.fontFamily = 'monospace';
                countdownEl.style.fontSize = '14px';
                countdownEl.innerHTML = `Tập tiếp theo sau <b>${countdown}s</b> <span style="margin-left:8px; cursor:pointer; color:#F4C84A;" id="cancel-next">✖</span>`;
                container.appendChild(countdownEl);
            }

            const interval = setInterval(() => {
                countdown--;
                if (countdownEl) {
                    countdownEl.innerHTML = `Tập tiếp theo sau <b>${countdown}s</b> <span style="margin-left:8px; cursor:pointer; color:#F4C84A;" id="cancel-next">✖</span>`;
                    const cancelBtn = countdownEl.querySelector('#cancel-next');
                    if (cancelBtn) {
                        cancelBtn.addEventListener('click', () => {
                            clearInterval(interval);
                            if (countdownEl && countdownEl.parentNode) {
                                countdownEl.parentNode.removeChild(countdownEl);
                            }
                        });
                    }
                }

                if (countdown === 0) {
                    clearInterval(interval);
                    if (countdownEl && countdownEl.parentNode) {
                        countdownEl.parentNode.removeChild(countdownEl);
                    }
                    if (nextEpisodeUrlRef.current) {
                        router.push(nextEpisodeUrlRef.current);
                    }
                }
            }, 1000);
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
                    // Controls: skip -10, skip +10
                    controls: [
                        // Skip back 10s
                        {
                            position: "left",
                            name: "skip-back",
                            index: 11,
                            html: `<div style="display:flex; align-items:center; justify-content:center; width:36px; height:36px; margin: 0; transition: opacity 0.2s; cursor: pointer;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                                <svg viewBox="0 0 24 24" fill="white" width="22" height="22">
                                  <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8zm-1.1 11h-.85v-3.26l-1.01.31v-.69l1.77-.63h.09V16zm4.28-1.76c0 .32-.03.6-.1.82s-.17.42-.29.57-.28.26-.45.33-.37.1-.59.1-.41-.03-.59-.1-.33-.18-.46-.33-.23-.34-.3-.57-.11-.5-.11-.82v-.74c0-.32.03-.6.1-.82s.17-.42.29-.57.28-.26.45-.33.37-.1.59-.1.41.03.59.1.33.18.46.33.23.34.3.57.11.5.11.82v.74zm-.85-.86c0-.19-.01-.35-.04-.48s-.07-.23-.12-.31-.11-.14-.19-.17-.16-.04-.25-.04-.18.01-.25.04-.12.1-.18.17-.09.18-.12.31-.04.29-.04.48v.97c0 .19.01.35.04.48s.07.24.12.32.11.14.19.17.16.05.25.05.18-.01.25-.05.12-.1.18-.17.09-.18.12-.32.04-.29.04-.48v-.97z"/>
                                </svg>
                            </div>`,
                            tooltip: "Tua lùi 10s",
                            click: () => { if (art) art.currentTime = Math.max(0, art.currentTime - 10); },
                        },
                        // Skip forward 10s
                        {
                            position: "left",
                            name: "skip-forward",
                            index: 12,
                            html: `<div style="display:flex; align-items:center; justify-content:center; width:36px; height:36px; margin: 0; transition: opacity 0.2s; cursor: pointer;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                                <svg viewBox="0 0 24 24" fill="white" width="22" height="22">
                                  <path d="M18 13c0 3.31-2.69 6-6 6s-6-2.69-6-6 2.69-6 6-6v4l5-5-5-5v4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8h-2zm-5.66 3h-.85v-3.26l-1.01.31v-.69l1.77-.63h.09V16zm4.28-1.76c0 .32-.03.6-.1.82s-.17.42-.29.57-.28.26-.45.33-.37.1-.59.1-.41-.03-.59-.1-.33-.18-.46-.33-.23-.34-.3-.57-.11-.5-.11-.82v-.74c0-.32.03-.6.1-.82s.17-.42.29-.57.28-.26.45-.33.37-.1.59-.1.41.03.59.1.33.18.46.33.23.34.3.57.11.5.11.82v.74zm-.85-.86c0-.19-.01-.35-.04-.48s-.07-.23-.12-.31-.11-.14-.19-.17-.16-.04-.25-.04-.18.01-.25.04-.12.1-.18.17-.09.18-.12.31-.04.29-.04.48v.97c0 .19.01.35.04.48s.07.24.12.32.11.14.19.17.16.05.25.05.18-.01.25-.05.12-.1.18-.17.09-.18.12-.32.04-.29.04-.48v-.97z"/>
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
                                <div style="width: 32px; height: 18px; background: #F4C84A; border-radius: 9px; position: relative; transition: background 0.2s;" id="auto-next-bg">
                                    <div style="width: 14px; height: 14px; background: white; border-radius: 50%; position: absolute; top: 2px; left: 16px; transition: left 0.2s;" id="auto-next-dot"></div>
                                </div>
                            </div>`,
                            tooltip: "Tự động chuyển tập",
                            click: function () {
                                const bg = document.getElementById("auto-next-bg");
                                const dot = document.getElementById("auto-next-dot");
                                if (bg && dot) {
                                    const isAuto = bg.style.background === "rgb(244, 200, 74)" || bg.style.background === "#F4C84A" || bg.style.background === "#f4c84a";
                                    if (isAuto) {
                                        bg.style.background = "rgba(255,255,255,0.3)";
                                        dot.style.left = "2px";
                                        localStorage.setItem("autoNextEpisode", "false");
                                        autoNextRef.current = false;
                                    } else {
                                        bg.style.background = "#F4C84A";
                                        dot.style.left = "16px";
                                        localStorage.setItem("autoNextEpisode", "true");
                                        autoNextRef.current = true;
                                    }
                                }
                            },
                            mounted: function () {
                                const isAuto = localStorage.getItem("autoNextEpisode") !== "false";
                                const bg = document.getElementById("auto-next-bg");
                                const dot = document.getElementById("auto-next-dot");
                                if (bg && dot) {
                                    if (isAuto) {
                                        bg.style.background = "#F4C84A";
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
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="white" stroke="none">
                                    <polygon points="5 4 15 12 5 20 5 4" />
                                    <rect x="17" y="5" width="3" height="14" rx="1" />
                                </svg>
                            </div>`,
                            tooltip: "Tập tiếp theo",
                            click: () => {
                                if (nextEpisodeUrlRef.current) {
                                    router.push(nextEpisodeUrlRef.current);
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
                                    enableWorker: true,
                                    lowLatencyMode: true,
                                    backBufferLength: 30,
                                    maxBufferLength: 20,
                                    maxMaxBufferLength: 40,
                                    maxBufferHole: 0.5,
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
                    const savedVolume = localStorage.getItem("volume");
                    if (savedVolume) art.volume = parseFloat(savedVolume);

                    const savedRate = localStorage.getItem("playbackRate");
                    if (savedRate) art.playbackRate = parseFloat(savedRate);

                    if (initialProgress > 0 && art.duration > 0) {
                        const percent = Math.min(Math.max(initialProgress, 0), 100);
                        const seekTo = Math.floor((percent / 100) * art.duration);
                        if (seekTo > 10) art.seek = seekTo;
                    }
                });

                // Realtime history save
                art.on("timeupdate", () => {
                    if (!art.playing) return;
                    saveHistory(art.currentTime, art.duration);
                });

                // Save volume/rate config
                art.on("video:volumechange", () => {
                    localStorage.setItem("volume", String(art.volume));
                });
                art.on("video:ratechange", () => {
                    localStorage.setItem("playbackRate", String(art.playbackRate));
                });

                // Auto-next on video end
                art.on("video:ended", () => {
                    handleVideoEnd();
                });

                // Nếu player báo lỗi (nguồn chặn, HLS lỗi, CORS...), fallback sang iframe embed gốc
                art.on("error", () => {
                    setFallbackIframe(true);
                });
                art.on("video:error", () => {
                    setFallbackIframe(true);
                });

                // Thêm một timeout an toàn: nếu sau 10s vẫn không play được thì cũng fallback
                setTimeout(() => {
                    try {
                        if (!art || !art.duration || Number.isNaN(art.duration)) {
                            setFallbackIframe(true);
                        }
                    } catch {
                        setFallbackIframe(true);
                    }
                }, 10000);

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
                window.addEventListener("beforeunload", forceHistorySave);

                // Keyboard shortcuts
                const handleKeydown = (e: KeyboardEvent) => {
                    if (!art || document.activeElement?.tagName === "INPUT") return;
                    if (e.key === "ArrowLeft") { art.currentTime = Math.max(0, art.currentTime - 10); e.preventDefault(); }
                    if (e.key === "ArrowRight") { art.currentTime = Math.min(art.duration, art.currentTime + 10); e.preventDefault(); }
                };
                document.addEventListener("keydown", handleKeydown);
                (artInstance.current as any).handleKeydown = handleKeydown;

            } catch (err) {
                console.error("ArtPlayer init error:", err);
            }
        };

        initArtPlayer();

        return () => {
            if (artInstance.current && (artInstance.current as any).handleKeydown) {
                document.removeEventListener("keydown", (artInstance.current as any).handleKeydown);
            }
            if (art) {
                art.destroy(false);
                artInstance.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [streamUrl]);

    // Khi bật/tắt chế độ rạp phim, container đổi kích thước — gọi resize để player vẽ lại đúng, tránh màn đen
    useEffect(() => {
        if (!shouldUseArtPlayer || !artInstance.current) return;
        const art = artInstance.current as any;
        const t = setTimeout(() => {
            if (typeof art.resize === "function") art.resize();
        }, 350);
        return () => clearTimeout(t);
    }, [isTheaterMode, shouldUseArtPlayer]);

    // ResizeObserver: khi kích thước container thay đổi (resize window, chế độ rạp phim), player tự resize
    useEffect(() => {
        if (!shouldUseArtPlayer || !artRef.current) return;
        const el = artRef.current;
        const ro = new ResizeObserver(() => {
            const art = artInstance.current as any;
            if (art && typeof art.resize === "function") art.resize();
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [shouldUseArtPlayer]);

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
                    background: #F4C84A !important;
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
                /* Bigger bottom controls on mobile for touch */
                @media (max-width: 768px) {
                    .art-ios-theme.art-video-player .art-bottom {
                        padding: 6px 10px calc(14px + env(safe-area-inset-bottom, 0px)) 10px !important;
                    }
                    .art-ios-theme.art-video-player .art-progress {
                        height: 6px !important;
                    }
                    .art-ios-theme.art-video-player .art-progress-indicator {
                        width: 20px !important;
                        height: 20px !important;
                    }
                    .art-ios-theme.art-video-player .art-icon {
                        width: 38px !important;
                        height: 38px !important;
                    }
                    .art-ios-theme.art-video-player .art-icon svg {
                        width: 22px !important;
                        height: 22px !important;
                    }
                    /* Hide less important controls on tiny screens */
                    .art-ios-theme.art-video-player .art-screenshot { display: none !important; }
                    /* Force fullscreen button always visible on mobile */
                    .art-ios-theme.art-video-player .art-fullscreen,
                    .art-ios-theme.art-video-player .art-fullscreen-web {
                        display: flex !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                    }
                    /* Hide pip and setting on very small screens to save space */
                    .art-ios-theme.art-video-player .art-pip { display: none !important; }
                }

                /* Hide "Chuyển tập" text on small mobile, only keep toggle */
                @media (max-width: 540px) {
                    #auto-next-toggle > span:first-child {
                        display: none !important;
                    }
                    #auto-next-toggle {
                        margin-right: 4px !important;
                    }
                    /* Shrink skip buttons on very small screens */
                    .art-ios-theme.art-video-player .art-controls-left [name="skip-back"] > div,
                    .art-ios-theme.art-video-player .art-controls-left [name="skip-forward"] > div {
                        width: 30px !important;
                        height: 30px !important;
                    }
                    /* Reduce time display font size */
                    .art-ios-theme.art-video-player .art-time {
                        font-size: 11px !important;
                        margin: 0 4px !important;
                    }
                }
            `}</style>
        </>
    );
}

interface IframePlayerProps {
    url: string;
    slug?: string;
    episode?: string;
    movieData?: VideoPlayerProps["movieData"];
    initialProgress: number;
    session: any;
    onEnded: () => void;
}

function IframePlayer({ url, slug, episode, movieData, initialProgress, session, onEnded }: IframePlayerProps) {
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
