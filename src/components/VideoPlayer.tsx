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
    const [showSkipAd, setShowSkipAd] = useState(false);
    const shouldUseArtPlayer = !fallbackIframe && isDirectStream(streamUrl);
    const AD_START = 900;  // 15:00
    const AD_END = 930;    // 15:30

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

                const isMobileNarrow = typeof window !== "undefined" && window.innerWidth <= 768;

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
                                 theme: "#10b981", // Emerald green theme
                    i18n: { "vi": VI_LOCALE },
                    lang: "vi",
                    moreVideoAttr: { crossOrigin: "anonymous" },
                    icons: {
                        play: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>`,
                        pause: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="10" y1="15" x2="10" y2="9"/><line x1="14" y1="15" x2="14" y2="9"/></svg>`,
                        volume: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`,
                        volumeClose: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`,
                        fullscreen: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>`,
                        exitFullscreen: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h6m0 0v6m0-6l-7 7m17-7h-6m0 0v6m0-6l7 7M20 10h-6m0 0V4m0 6l7-7M4 10h6m0 0V4m0 6l-7-7"/></svg>`,
                        setting: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
                        pip: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"/><rect x="13" y="11" width="8" height="6" rx="1"/></svg>`,
                    },
                    // Controls: skip -10, skip +10 (luôn giữ), auto-next + next-episode chỉ trên màn lớn
                    controls: [
                        // Skip back 10s
                        {
                            position: "left",
                            name: "skip-back",
                            index: 11,
                            html: `<div style="display:flex; align-items:center; justify-content:center; width:36px; height:36px; margin: 0; transition: opacity 0.2s; cursor: pointer;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22">
                                  <path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10 10 10 0 0 1-10-10"/>
                                  <path d="M2 12a10 10 0 0 1 10-10"/>
                                  <polyline points="2 7 6 7 6 3"/>
                                  <text x="12" y="16" font-size="9" font-weight="900" text-anchor="middle" fill="currentColor" stroke="none">10</text>
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
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22">
                                  <path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10 10 10 0 0 1-10-10"/>
                                  <path d="M22 12a10 10 0 0 0-10-10"/>
                                  <polyline points="22 7 18 7 18 3"/>
                                  <text x="12" y="16" font-size="9" font-weight="900" text-anchor="middle" fill="currentColor" stroke="none">10</text>
                                </svg>
                            </div>`,
                            tooltip: "Tua tiếp 10s",
                            click: () => { if (art) art.currentTime = Math.min(art.duration, art.currentTime + 10); },
                        },
                        // Auto Next Episode Toggle (ẩn trên màn mobile dọc)
                        ...(!isMobileNarrow ? [{
                            position: "right",
                            name: "auto-next",
                            index: 10,
                            html: `<div style="display:flex; align-items:center; margin-right: 8px; cursor: pointer; opacity: 0.9;" id="auto-next-toggle">
                                <span style="font-size: 13px; color: rgba(255,255,255,0.8); margin-right: 8px; font-weight: 500;">Chuyển tập</span>
                                <div style="width: 32px; height: 18px; background: #10b981; border-radius: 9px; position: relative; transition: background 0.2s;" id="auto-next-bg">
                                    <div style="width: 14px; height: 14px; background: white; border-radius: 50%; position: absolute; top: 2px; left: 16px; transition: left 0.2s;" id="auto-next-dot"></div>
                                </div>
                            </div>`,
                            tooltip: "Tự động chuyển tập",
                            click: function () {
                                const bg = document.getElementById("auto-next-bg");
                                const dot = document.getElementById("auto-next-dot");
                                if (bg && dot) {
                                    const isAuto = bg.style.background === "rgb(16, 185, 129)" || bg.style.background === "#10b981";
                                    if (isAuto) {
                                        bg.style.background = "rgba(255,255,255,0.3)";
                                        dot.style.left = "2px";
                                        localStorage.setItem("autoNextEpisode", "false");
                                        autoNextRef.current = false;
                                    } else {
                                        bg.style.background = "#10b981";
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
                                        bg.style.background = "#10b981";
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
                            html: `<div style="display:flex; align-items:center; justify-content:center; width:36px; height:36px; margin: 0 4px; opacity: 0.8; transition: opacity 0.2s; cursor: pointer;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polygon points="5 4 15 12 5 20 5 4" fill="currentColor"/>
                                    <line x1="19" y1="5" x2="19" y2="19"/>
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
                    // Skip Ad: check first, regardless of paused state
                    const ct = Math.floor(art.currentTime);
                    setShowSkipAd(ct >= AD_START && ct <= AD_END);

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
            <div className="relative w-full h-full">
                <div ref={artRef} className="w-full h-full bg-black art-ios-theme" style={{ minHeight: "200px" }} />
                {showSkipAd && (
                    <button
                        onClick={() => {
                            if (artInstance.current) artInstance.current.currentTime = AD_END + 1;
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
                    height: 4px !important;
                    margin-bottom: 4px !important;
                }
                .art-ios-theme.art-video-player .art-progress-played {
                    background: #10b981 !important;
                }
                .art-ios-theme.art-video-player .art-progress-indicator {
                    background: white !important;
                    width: 14px !important;
                    height: 14px !important;
                    box-shadow: 0 0 8px rgba(0,0,0,0.5) !important;
                }
                .art-ios-theme.art-video-player .art-progress-loaded {
                    background: rgba(255,255,255,0.25) !important;
                }
                /* Transparent bottom for a cleaner look */
                .art-ios-theme.art-video-player .art-bottom {
                    background: linear-gradient(to top, rgba(0,0,0,0.6), transparent) !important;
                }
                /* Bigger bottom controls on mobile for touch */
                @media (max-width: 768px) {
                    .art-ios-theme.art-video-player .art-bottom {
                        padding: 6px 10px calc(14px + env(safe-area-inset-bottom, 0px)) 10px !important;
                    }
                    .art-ios-theme.art-video-player .art-progress {
                        height: 5px !important;
                    }
                    .art-ios-theme.art-video-player .art-progress-indicator {
                        width: 18px !important;
                        height: 18px !important;
                    }
                    .art-ios-theme.art-video-player .art-icon {
                        width: 38px !important;
                        height: 38px !important;
                    }
                    .art-ios-theme.art-video-player .art-icon svg {
                        width: 22px !important;
                        height: 22px !important;
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
                        width: 30px !important;
                        height: 30px !important;
                    }
                    /* Reduce time display font size */
                    .art-ios-theme.art-video-player .art-time {
                        font-size: 11px !important;
                        margin: 0 4px !important;
                    }
                    /* Ẩn bớt icon Setting / Aspect / Speed để thanh không bị chật */
                    .art-ios-theme.art-video-player .art-setting,
                    .art-ios-theme.art-video-player .art-playbackRate,
                    .art-ios-theme.art-video-player .art-aspect-ratio {
                        display: none !important;
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
