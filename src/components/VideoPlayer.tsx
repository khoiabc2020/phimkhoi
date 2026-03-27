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
    serverName?: string;
    onPlayerError?: () => void;
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

function isNguonC(url: string, serverName: string): boolean {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    const lowerServer = serverName.toLowerCase();
    return lowerUrl.includes('nguonc.com') || lowerUrl.includes('streamc.xyz') || lowerServer.includes('nguonc');
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
    serverName = "",
    onPlayerError,
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
    const [showSkipAd, setShowSkipAd] = useState(false);
    const [useProxy, setUseProxy] = useState(false); // New state to trigger proxy

    useEffect(() => {
        setFallbackIframe(false);
        setUseProxy(false);
        setShowSkipAd(false);
    }, [streamUrl, serverName]);
    // Logic to determine the final stream URL (potentially proxied)
    const finalStreamUrl = useProxy 
        ? `/api/hls-proxy?url=${encodeURIComponent(streamUrl)}`
        : streamUrl;

    const isNguoncSource = isNguonC(streamUrl, serverName);
    const shouldUseArtPlayer = !fallbackIframe && isDirectStream(streamUrl) && !isNguoncSource;
    const AD_START = 900;  // 15:00
    const AD_END = 930;    // 15:30

    // Realtime watch history save — throttled every 10s (Netflix-style)
    const saveHistory = useCallback(async (currentTime: number, duration: number) => {
        if (!movieData || !session?.user) return;
        if (currentTime - lastSavedRef.current < 10) return;
        lastSavedRef.current = currentTime;
        try {
            const res = await addWatchHistory({ ...movieData, duration, currentTime });
            if (res.success) {
                // Broadcast update to other tabs (e.g. ContinueWatchingRow on home)
                const channel = new BroadcastChannel('phimkhoi_history_sync');
                channel.postMessage({
                    type: 'HISTORY_UPDATE',
                    movieId: movieData.movieId,
                    movieSlug: movieData.movieSlug,
                    episodeSlug: movieData.episodeSlug,
                    currentTime,
                    duration,
                    progress: Math.min(100, Math.round((currentTime / duration) * 100)),
                    movieName: movieData.movieName,
                    moviePoster: movieData.moviePoster,
                    episodeName: movieData.episodeName,
                    lastWatched: new Date().toISOString()
                });
                channel.close();
            }
        } catch { /* silent */ }
    }, [movieData, session]);

    const nextIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const handleVideoEnd = useCallback(() => {
        onEnded?.();
        if (autoNextRef.current && nextEpisodeUrlRef.current) {
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
                countdownEl.innerHTML = `Tập tiếp theo sau <b>${countdown}s</b> <span style="margin-left:8px; cursor:pointer; color:#8FA7C5;" id="cancel-next">✖</span>`;
                container.appendChild(countdownEl);
            }

            const interval = setInterval(() => {
                countdown--;
                if (countdownEl) {
                    countdownEl.innerHTML = `Tập tiếp theo sau <b>${countdown}s</b> <span style="margin-left:8px; cursor:pointer; color:#8FA7C5;" id="cancel-next">✖</span>`;
                    const cancelBtn = countdownEl.querySelector('#cancel-next');
                    if (cancelBtn) {
                        cancelBtn.addEventListener('click', () => {
                            if (nextIntervalRef.current) clearInterval(nextIntervalRef.current);
                            if (countdownEl && countdownEl.parentNode) {
                                countdownEl.parentNode.removeChild(countdownEl);
                            }
                        });
                    }
                }

                if (countdown === 0) {
                    if (nextIntervalRef.current) clearInterval(nextIntervalRef.current);
                    if (countdownEl && countdownEl.parentNode) {
                        countdownEl.parentNode.removeChild(countdownEl);
                    }
                    if (nextEpisodeUrlRef.current) {
                        router.push(nextEpisodeUrlRef.current);
                    }
                }
            }, 1000);
            nextIntervalRef.current = interval;
        }
    }, [onEnded, router]);

    useEffect(() => {
        if (!shouldUseArtPlayer || !artRef.current) return;
        let art: any = null;

        const initArtPlayer = async () => {
            try {
                const Artplayer = (await import("artplayer")).default;
                const isHls = streamUrl.includes(".m3u8");

                const isMobileNarrow = typeof window !== "undefined" && window.innerWidth <= 768;

                let hasAutoSkipped = false;

                art = new Artplayer({
                    container: artRef.current!,
                    url: finalStreamUrl,
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
                    theme: "#8FA7C5",
                    i18n: { "vi": VI_LOCALE },
                    lang: "vi",
                    moreVideoAttr: { crossOrigin: "anonymous" },
                    settings: serverName.toLowerCase().includes("kkphim") ? [
                        {
                            html: 'Bỏ qua QC Server (15:00)',
                            tooltip: localStorage.getItem("autoSkipAds") === "false" ? "Tắt" : "Bật",
                            switch: localStorage.getItem("autoSkipAds") !== "false",
                            onSwitch: function (item: any) {
                                item.tooltip = item.switch ? 'Tắt' : 'Bật';
                                localStorage.setItem("autoSkipAds", String(!item.switch));
                                return !item.switch;
                            },
                        }
                    ] : [],
                    // Controls: skip -10, skip +10 (luôn giữ), auto-next + next-episode chỉ trên màn lớn
                    controls: [
                        // Skip back 10s
                        {
                            position: "left",
                            name: "skip-back",
                            index: 11,
                            html: `<div style="display:flex; align-items:center; justify-content:center; width:40px; height:40px; margin: 0; transition: opacity 0.2s; cursor: pointer;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                                <svg viewBox="0 0 24 24" fill="white" width="26" height="26">
                                  <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8zm-1.1 11h-.85v-3.26l-1.01.31v-.69l1.77-.63h.09V16zm4.28-1.76c0 .32-.03.6-.1.82s-.17.42-.29.57-.28.26-.45.33-.37.1-.59.1-.41-.03-.59-.1-.33-.18-.46-.33-.23-.34-.3-.57-.11-.5-.11-.82v-.74c0-.32.03-.6.1-.82s.17-.42.29-.57.28-.26.45-.33.37-.1.59-.1.41.03.59.1.33.18.46.33.23.34.3.57.11.5.11.82v.74zm-.85-.86c0-.19-.01-.35-.04-.48s-.07-.23-.12-.31-.11-.14-.19-.17-.16-.04-.25-.04-.18.01-.25.04-.12.1-.18.17-.09.18-.12.31-.04.29-.04.48v.97c0 .19.01.35.04.48s.07.24.12.32.11.14.19.17.16.05.25.05.18-.01.25-.05.12-.1.18-.17.09-.18.12-.32.04-.29.04-.48v-.97z"/>
                                </svg>
                            </div>`,
                            tooltip: "Tua lùi 10s",
                            click: () => { if (art) art.seek = Math.max(0, art.currentTime - 10); },
                        },
                        // Skip forward 10s
                        {
                            position: "left",
                            name: "skip-forward",
                            index: 12,
                            html: `<div style="display:flex; align-items:center; justify-content:center; width:40px; height:40px; margin: 0; transition: opacity 0.2s; cursor: pointer;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                                <svg viewBox="0 0 24 24" fill="white" width="26" height="26">
                                  <path d="M18 13c0 3.31-2.69 6-6 6s-6-2.69-6-6 2.69-6 6-6v4l5-5-5-5v4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8h-2zm-5.66 3h-.85v-3.26l-1.01.31v-.69l1.77-.63h.09V16zm4.28-1.76c0 .32-.03.6-.1.82s-.17.42-.29.57-.28.26-.45.33-.37.1-.59.1-.41-.03-.59-.1-.33-.18-.46-.33-.23-.34-.3-.57-.11-.5-.11-.82v-.74c0-.32.03-.6.1-.82s.17-.42.29-.57.28-.26.45-.33.37-.1.59-.1.41.03.59.1.33.18.46.33.23.34.3.57.11.5.11.82v.74zm-.85-.86c0-.19-.01-.35-.04-.48s-.07-.23-.12-.31-.11-.14-.19-.17-.16-.04-.25-.04-.18.01-.25.04-.12.1-.18.17-.09.18-.12.31-.04.29-.04.48v.97c0 .19.01.35.04.48s.07.24.12.32.11.14.19.17.16.05.25.05.18-.01.25-.05.12-.1.18-.17.09-.18.12-.32.04-.29.04-.48v-.97z"/>
                                </svg>
                            </div>`,
                            tooltip: "Tua tiếp 10s",
                            click: () => { if (art) art.seek = Math.min(art.duration, art.currentTime + 10); },
                        },
                        // Auto Next Episode Toggle (ẩn trên màn mobile dọc)
                        ...(!isMobileNarrow ? [{
                            position: "right",
                            name: "auto-next",
                            index: 10,
                            html: `<div style="display:flex; align-items:center; margin-right: 8px; cursor: pointer; opacity: 0.9;" id="auto-next-toggle">
                                <span style="font-size: 13px; color: rgba(255,255,255,0.8); margin-right: 8px; font-weight: 500;">Chuyển tập</span>
                                <div style="width: 34px; height: 20px; background: #8FA7C5; border-radius: 10px; position: relative; transition: background 0.2s;" id="auto-next-bg">
                                    <div style="width: 16px; height: 16px; background: white; border-radius: 50%; position: absolute; top: 2px; left: 16px; transition: left 0.2s;" id="auto-next-dot"></div>
                                </div>
                            </div>`,
                            tooltip: "Tự động chuyển tập",
                            click: function () {
                                const bg = document.getElementById("auto-next-bg");
                                const dot = document.getElementById("auto-next-dot");
                                if (bg && dot) {
                                    const isAuto = bg.style.background === "rgb(143, 167, 197)" || bg.style.background === "#8FA7C5";
                                    if (isAuto) {
                                        bg.style.background = "rgba(255,255,255,0.3)";
                                        dot.style.left = "2px";
                                        localStorage.setItem("autoNextEpisode", "false");
                                        autoNextRef.current = false;
                                    } else {
                                        bg.style.background = "#8FA7C5";
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
                                        bg.style.background = "#8FA7C5";
                                        dot.style.left = "16px";
                                    } else {
                                        bg.style.background = "rgba(255,255,255,0.3)";
                                        dot.style.left = "2px";
                                    }
                                }
                            }
                        } as any] : []),
                        // Next Episode Button (ẩn trên màn mobile dọc)
                        ...(!isMobileNarrow ? [{
                            position: "right",
                            name: "next-episode",
                            index: 11,
                            html: `<div style="display:flex; align-items:center; justify-content:center; width:40px; height:40px; margin: 0 4px; opacity: 0.8; transition: opacity 0.2s; cursor: pointer;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'">
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="white" stroke="none">
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
                        } as any] : []),
                    ],
                    customType: {
                        m3u8: async (video: HTMLVideoElement, src: string) => {
                            const HlsModule = await import("hls.js");
                            const Hls = HlsModule.default;
                            if (Hls.isSupported()) {
                                const hls = new Hls({
                                    enableWorker: true,
                                    lowLatencyMode: true,
                                    backBufferLength: 90,
                                    maxBufferLength: 30,
                                    maxMaxBufferLength: 60,
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

                    // Expose art instance for external seeking (like progress sync)
                    (window as any).art = art;
                });

                // Realtime history save - Thêm Logic AUTO SKIP
                art.on("timeupdate", () => {
                    const ct = Math.floor(art.currentTime);
                    
                    if (serverName.toLowerCase().includes("kkphim") && ct >= AD_START && ct <= AD_END) {
                        const isAutoSkipEnabled = localStorage.getItem("autoSkipAds") !== "false";
                        if (isAutoSkipEnabled && !hasAutoSkipped) {
                            art.seek = AD_END + 1;
                            hasAutoSkipped = true;
                            setShowSkipAd(false);
                            if (art.notice) {
                                art.notice.show = "Đã tự động bỏ qua quảng cáo Server";
                            }
                        } else if (!hasAutoSkipped) {
                            setShowSkipAd(true);
                        }
                    } else {
                        // Reset auto-skip if we scrubbed back before the ad or past it significantly
                        if (ct < AD_START || ct > AD_END + 5) {
                             hasAutoSkipped = false;
                        }
                        setShowSkipAd(false);
                    }

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

                // Nếu player báo lỗi (nguồn chặn, HLS lỗi, CORS...), thử qua PROXY trước khi sang iframe
                art.on("error", () => {
                    setTimeout(() => {
                        if (artInstance.current && artInstance.current.video && artInstance.current.video.readyState === 0) {
                            if (!useProxy) {
                                console.log("ArtPlayer error detected, retrying with Proxy...");
                                setUseProxy(true);
                            } else {
                                console.warn("ArtPlayer failed even with proxy, falling back to Iframe...");
                                onPlayerError?.();
                                setFallbackIframe(true);
                            }
                        }
                    }, 4000); 
                });
                art.on("video:error", () => {
                    setTimeout(() => {
                        if (artInstance.current && artInstance.current.video && artInstance.current.video.readyState === 0) {
                            if (!useProxy) {
                                console.log("ArtPlayer video error, retrying with Proxy...");
                                setUseProxy(true);
                            } else {
                                setFallbackIframe(true);
                                onPlayerError?.();
                            }
                        }
                    }, 4000);
                });

                // Thêm một timeout an toàn: nếu sau 10s vẫn không play được thì thử proxy hoặc fallback
                setTimeout(() => {
                    try {
                        if (!art || !art.duration || Number.isNaN(art.duration)) {
                            if (!useProxy) {
                                setUseProxy(true);
                            } else {
                                setFallbackIframe(true);
                            }
                        }
                    } catch {
                        setFallbackIframe(true);
                    }
                }, 12000);

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
                (artInstance.current as any).forceHistorySave = forceHistorySave;

                // Keyboard shortcuts
                const handleKeydown = (e: KeyboardEvent) => {
                    if (!art || document.activeElement?.tagName === "INPUT") return;
                    if (e.key === "ArrowLeft") { art.seek = Math.max(0, art.currentTime - 10); e.preventDefault(); }
                    if (e.key === "ArrowRight") { art.seek = Math.min(art.duration, art.currentTime + 10); e.preventDefault(); }
                };
                document.addEventListener("keydown", handleKeydown);
                (artInstance.current as any).handleKeydown = handleKeydown;

            } catch (err) {
                console.error("ArtPlayer init error:", err);
            }
        };

        initArtPlayer();

        return () => {
            if (nextIntervalRef.current) clearInterval(nextIntervalRef.current);
            if (artInstance.current && (artInstance.current as any).handleKeydown) {
                document.removeEventListener("keydown", (artInstance.current as any).handleKeydown);
            }
            if (artInstance.current && (artInstance.current as any).forceHistorySave) {
                window.removeEventListener("beforeunload", (artInstance.current as any).forceHistorySave);
            }
            if (art) {
                art.destroy(false);
                artInstance.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [finalStreamUrl, handleVideoEnd, initialProgress, movieData, onPlayerError, saveHistory, serverName, session, shouldUseArtPlayer, streamUrl, useProxy]);

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
            <div className="relative w-full h-full">
                <div ref={artRef} className="w-full h-full bg-black art-ios-theme" style={{ minHeight: "200px" }}>
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0b] z-0">
                        <div className="w-12 h-12 border-4 border-[#8FA7C5]/20 border-t-[#8FA7C5] rounded-full animate-spin mb-4" />
                        <p className="text-[#8FA7C5] text-xs font-bold uppercase tracking-[0.2em] animate-pulse">KHOIPHIM Player</p>
                    </div>
                </div>
                {showSkipAd && (
                    <button
                        onClick={() => {
                            if (artInstance.current) artInstance.current.seek = AD_END + 1;
                            setShowSkipAd(false);
                        }}
                        style={{
                            position: 'absolute',
                            bottom: '72px',
                            right: '12px',
                            zIndex: 9999,
                            background: 'rgba(0,0,0,0.82)',
                            color: 'white',
                            border: '1.5px solid rgba(255,255,255,0.3)',
                            borderRadius: '6px',
                            padding: '7px 16px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            backdropFilter: 'blur(6px)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 14px rgba(0,0,0,0.5)',
                            fontFamily: 'inherit',
                        }}
                        onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(16,185,129,0.95)'; (e.currentTarget as HTMLButtonElement).style.color = '#0a0a0a'; }}
                        onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.82)'; (e.currentTarget as HTMLButtonElement).style.color = 'white'; }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z" /></svg>
                        Bỏ qua quảng cáo
                    </button>
                )}
            </div>
            <style jsx global>{`
                .art-ios-theme.art-video-player .art-bottom {
                    padding-bottom: 8px;
                    padding-left: 12px;
                    padding-right: 12px;
                }
                .art-ios-theme.art-video-player .art-controls-left .art-volume {
                    margin-left: 8px !important;
                }
                /* Tăng kích thước icon chung */
                .art-ios-theme.art-video-player .art-icon {
                    width: 32px !important;
                    height: 32px !important;
                }
                .art-ios-theme.art-video-player .art-icon svg {
                    width: 24px !important;
                    height: 24px !important;
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
                /* Progress bar size */
                .art-ios-theme.art-video-player .art-progress {
                    height: 6px !important;
                    margin-bottom: 2px !important;
                }
                .art-ios-theme.art-video-player .art-progress-played {
                    background: #8FA7C5 !important;
                }
                .art-ios-theme.art-video-player .art-progress-indicator {
                    background: white !important;
                    width: 16px !important;
                    height: 16px !important;
                    box-shadow: 0 0 8px rgba(0,0,0,0.5) !important;
                }
                .art-ios-theme.art-video-player .art-progress-loaded {
                    background: rgba(255,255,255,0.15) !important;
                }
                /* Loading spinner custom color */
                .art-ios-theme.art-video-player .art-loading svg {
                    color: #8FA7C5 !important;
                }
                /* Transparent bottom for a cleaner look - Premium Gradient */
                .art-ios-theme.art-video-player .art-bottom {
                    background: linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 100%) !important;
                }
                .art-ios-theme.art-video-player .art-controls-left,
                .art-ios-theme.art-video-player .art-controls-right {
                    padding-bottom: 2px !important;
                }
                /* Bigger bottom controls on mobile for touch */
                @media (max-width: 768px) {
                    .art-ios-theme.art-video-player .art-bottom {
                        padding: 6px 10px calc(14px + env(safe-area-inset-bottom, 0px)) 10px !important;
                    }
                    .art-ios-theme.art-video-player .art-progress {
                        height: 7px !important;
                    }
                    .art-ios-theme.art-video-player .art-progress-indicator {
                        width: 20px !important;
                        height: 20px !important;
                    }
                    .art-ios-theme.art-video-player .art-icon {
                        width: 42px !important;
                        height: 42px !important;
                    }
                    .art-ios-theme.art-video-player .art-icon svg {
                        width: 26px !important;
                        height: 26px !important;
                    }
                    /* Hide less important controls on small screens */
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

                /* Extra-compact controls on very small mobile (dọc) */
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
                        width: 34px !important;
                        height: 34px !important;
                    }
                    /* Reduce time display font size */
                    .art-ios-theme.art-video-player .art-time {
                        font-size: 11px !important;
                        margin: 0 4px !important;
                    }
                    /* Ẩn bớt icon Setting / Aspect / Speed để thanh không bị chật */
                    .art-ios-theme.art-video-player .art-setting,
                    .art-ios-theme.art-video-player .art-playbackRate,
                    .art-ios-theme.art-video-player .art-aspect-ratio,
                    .art-ios-theme.art-video-player .art-pip {
                        display: none !important;
                    }
                }

                /* Custom scrollbar for settings */
                .art-ios-theme.art-video-player .art-setting-panel::-webkit-scrollbar {
                    width: 4px;
                }
                .art-ios-theme.art-video-player .art-setting-panel::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.2);
                    border-radius: 2px;
                }
                
                /* Elite: Subtle glass backdrop for all panels */
                .art-ios-theme.art-video-player .art-setting-panel,
                .art-ios-theme.art-video-player .art-contextmenu-panel {
                    background: rgba(10, 10, 14, 0.92) !important;
                    backdrop-filter: blur(12px) !important;
                    border: 1px solid rgba(255,255,255,0.08) !important;
                    border-radius: 12px !important;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
                    animation: art-panel-in 0.3s ease-out;
                }
                @keyframes art-panel-in {
                    from { transform: translateY(10px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
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
            const currentTime = Math.max(elapsed, initialProgress > 0 ? (initialProgress / 100) * estimatedDuration : 10);
            const res = await addWatchHistory({
                ...movieData,
                duration: estimatedDuration,
                currentTime,
            });
            if (res.success) {
                const channel = new BroadcastChannel('phimkhoi_history_sync');
                channel.postMessage({ 
                    type: 'HISTORY_UPDATE', 
                    movieId: movieData.movieId, 
                    movieSlug: movieData.movieSlug,
                    episodeSlug: movieData.episodeSlug,
                    movieName: movieData.movieName,
                    moviePoster: movieData.moviePoster,
                    episodeName: movieData.episodeName,
                    progress: Math.min(100, Math.round((currentTime / estimatedDuration) * 100)),
                    lastWatched: new Date().toISOString()
                });
                channel.close();
            }
        }, 8000);

        const interval = setInterval(async () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const res = await addWatchHistory({ ...movieData, duration: estimatedDuration, currentTime: elapsed });
            if (res.success) {
                const channel = new BroadcastChannel('phimkhoi_history_sync');
                channel.postMessage({ 
                    type: 'HISTORY_UPDATE', 
                    movieId: movieData.movieId, 
                    movieSlug: movieData.movieSlug,
                    episodeSlug: movieData.episodeSlug,
                    movieName: movieData.movieName,
                    moviePoster: movieData.moviePoster,
                    episodeName: movieData.episodeName,
                    progress: Math.min(100, Math.round((elapsed / estimatedDuration) * 100)),
                    lastWatched: new Date().toISOString()
                });
                channel.close();
            }
        }, 15000);

        return () => {
            clearTimeout(firstSave);
            clearInterval(interval);
        };

    }, [movieData, session, initialProgress]);

    return (
        <div className="relative w-full h-full bg-black">
            <iframe
                src={url}
                className="w-full h-full block"
                allowFullScreen
                allow="autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                title={`${slug} - ${episode}`}
                frameBorder="0"
                scrolling="no"
                style={{ border: "none", overflow: "hidden" }}
            />
        </div>
    );
}
