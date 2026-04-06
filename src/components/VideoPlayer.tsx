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
    subtitles?: Array<{
        _id: string;
        label: string;
        language: string;
        format: string;
        url?: string;
        sourceType: string;
        isDefault?: boolean;
        // OpenSubtitles auto-search fields
        fileId?: number;
        fileName?: string;
        movieSlug?: string;
        episodeSlug?: string;
        movieName?: string;
    }>;
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
    subtitles = [],
}: VideoPlayerProps) {
    const artRef = useRef<HTMLDivElement>(null);
    const artInstance = useRef<any>(null);
    const { data: session } = useSession();
    const router = useRouter();
    const lastSavedRef = useRef<number>(0);
    const autoNextRef = useRef(autoNext);
    const nextEpisodeUrlRef = useRef(nextEpisodeUrl);
    const subtitlesRef = useRef(subtitles);

    // Keep refs in sync so closures always see latest values
    useEffect(() => { autoNextRef.current = autoNext; }, [autoNext]);
    useEffect(() => { nextEpisodeUrlRef.current = nextEpisodeUrl; }, [nextEpisodeUrl]);
    useEffect(() => { subtitlesRef.current = subtitles; }, [subtitles]);

    const streamUrl = m3u8 || url;
    const [fallbackIframe, setFallbackIframe] = useState(false);
    const [showSkipAd, setShowSkipAd] = useState(false);
    const [showSkipIntro, setShowSkipIntro] = useState(false);
    const [useProxy, setUseProxy] = useState(false); // New state to trigger proxy
    // Swipe-to-seek state (mobile gesture)
    const [seekIndicator, setSeekIndicator] = useState<{ delta: number; side: "left" | "right" } | null>(null);
    const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

    useEffect(() => {
        setFallbackIframe(false);
        setUseProxy(false);
        setShowSkipAd(false);
        setShowSkipIntro(false);
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
                const cancelBtn = countdownEl.querySelector('#cancel-next');
                if (cancelBtn) {
                    cancelBtn.addEventListener('click', () => {
                        if (nextIntervalRef.current) clearInterval(nextIntervalRef.current);
                        if (countdownEl && countdownEl.parentNode) {
                            countdownEl.parentNode.removeChild(countdownEl);
                        }
                    }, { once: true });
                }
            }

            const interval = setInterval(() => {
                countdown--;
                if (countdownEl) {
                    countdownEl.innerHTML = `Tập tiếp theo sau <b>${countdown}s</b> <span style="margin-left:8px; cursor:pointer; color:#8FA7C5;" id="cancel-next">✖</span>`;
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

                // ── Subtitle setup ────────────────────────────────────────
                function getSubUrl(sub: NonNullable<typeof subtitles>[0]): string {
                    if (sub.sourceType === "content") return `/api/subtitles/content?id=${sub._id}`;
                    // Auto-download from OpenSubtitles (+ lazy-cache to DB)
                    if (sub.sourceType === "opensubtitles" && sub.fileId) {
                        const p = new URLSearchParams({ fileId: String(sub.fileId) });
                        if (sub.fileName)    p.set("fileName",    sub.fileName);
                        if (sub.language)    p.set("lang",         sub.language);
                        if (sub.movieSlug)   p.set("movieSlug",    sub.movieSlug);
                        if (sub.episodeSlug) p.set("episodeSlug",  sub.episodeSlug);
                        if ((sub as any).movieName) p.set("movieName", (sub as any).movieName);
                        return `/api/subtitles/content?${p}`;
                    }
                    if (sub.url) return `/api/subtitles/content?url=${encodeURIComponent(sub.url)}`;
                    return "";
                }
                const savedLang = typeof localStorage !== "undefined" ? localStorage.getItem("subtitleLang") : null;
                const defaultSub = subtitles.find(s => savedLang ? s.language === savedLang : s.isDefault)
                    || (savedLang ? undefined : subtitles[0]);

                const subtitleConfig = defaultSub ? {
                    url: getSubUrl(defaultSub),
                    type: (defaultSub.format === "ass" || defaultSub.format === "ssa" ? "ass" : defaultSub.format) as any,
                    style: {
                        color: "#ffffff",
                        fontSize: isMobileNarrow ? "16px" : "22px",
                        textShadow: "0 2px 6px rgba(0,0,0,0.9)",
                    },
                    encoding: "utf-8",
                    escape: false,
                } : undefined;

                const subtitleSelectorItems = [
                    { html: "⊘ Tắt phụ đề", default: !defaultSub || subtitles.length === 0, value: null },
                    ...subtitles.map(s => ({
                        html: s.label || s.language.toUpperCase(),
                        default: s._id === defaultSub?._id,
                        value: { url: getSubUrl(s), type: s.format, lang: s.language },
                    })),
                ];
                // ─────────────────────────────────────────────────────────

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
                    ...(subtitleConfig ? { subtitle: subtitleConfig } : {}),
                    subtitleOffset: subtitles.length > 0,
                    settings: [
                        // Phụ đề — luôn hiển thị trong Settings
                        {
                            html: "Phụ đề",
                            width: 220,
                            tooltip: defaultSub?.label || (subtitles.length === 0 ? "Chưa có" : "Tắt"),
                            selector: subtitleSelectorItems,
                            onSelect(item: any) {
                                const wrap = document.getElementById("cc-btn-wrap");
                                if (!item.value) {
                                    if (art.subtitle?.url) art.subtitle.hide();
                                    localStorage.setItem("subtitleLang", "");
                                    if (wrap) wrap.style.opacity = "0.35";
                                } else {
                                    art.subtitle.show();
                                    art.subtitle.switch(item.value.url, {
                                        name: item.html,
                                        type: item.value.type === "ass" || item.value.type === "ssa" ? "ass" : item.value.type,
                                        escape: false,
                                    });
                                    localStorage.setItem("subtitleLang", item.value.lang);
                                    if (wrap) wrap.style.opacity = "1";
                                }
                                return item.html;
                            },
                        },
                        // Bỏ qua QC (KKPhim only)
                        ...(serverName.toLowerCase().includes("kkphim") ? [{
                            html: 'Bỏ qua QC Server (15:00)',
                            tooltip: localStorage.getItem("autoSkipAds") === "false" ? "Tắt" : "Bật",
                            switch: localStorage.getItem("autoSkipAds") !== "false",
                            onSwitch: function (item: any) {
                                item.tooltip = item.switch ? 'Tắt' : 'Bật';
                                localStorage.setItem("autoSkipAds", String(!item.switch));
                                return !item.switch;
                            },
                        }] : []),
                    ],
                    // Controls: CC toggle (luôn hiện), skip -10, skip +10, auto-next + next-episode (lớn)
                    controls: [
                        // CC (subtitle) toggle — always visible; grayed-out when no subs
                        {
                            position: "right" as const,
                            name: "cc-toggle",
                            index: 6,
                            html: `<div id="cc-btn-wrap" style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;cursor:pointer;opacity:${defaultSub ? 1 : 0.35};transition:opacity 0.2s;" title="Phụ đề (C)">
                                <svg viewBox="0 0 24 24" fill="white" width="22" height="22">
                                    <path d="M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H5V6h14v12zm-8-2H9.5v-2h-2v2H6v-4h1.5v1h2v-1H11v4zm4.5-4H14v4h-1.5v-4H11v-1.5h6V12h-1.5z"/>
                                </svg>
                            </div>`,
                            tooltip: defaultSub ? `Phụ đề: ${defaultSub.label}` : "Chưa có phụ đề",
                            click: function () {
                                const subs = subtitlesRef.current;
                                const wrap = document.getElementById("cc-btn-wrap");
                                if (!subs.length || !art) {
                                    if (art?.notice) art.notice.show = "Phim này chưa có phụ đề";
                                    return;
                                }
                                const isVisible = art.subtitle?.show;
                                if (isVisible) {
                                    art.subtitle.hide();
                                    localStorage.setItem("subtitleLang", "");
                                    if (wrap) wrap.style.opacity = "0.35";
                                    if (art.notice) art.notice.show = "Tắt phụ đề";
                                } else {
                                    const savedLang = localStorage.getItem("subtitleLang");
                                    const sub = subs.find((s: any) => s.language === savedLang) || subs.find((s: any) => s.isDefault) || subs[0];
                                    if (!sub) return;
                                    art.subtitle.switch(getSubUrl(sub as any), {
                                        name: sub.label || sub.language.toUpperCase(),
                                        type: (sub.format === "ass" || sub.format === "ssa") ? "ass" : sub.format,
                                        escape: false,
                                    });
                                    art.subtitle.show();
                                    localStorage.setItem("subtitleLang", sub.language);
                                    if (wrap) wrap.style.opacity = "1";
                                    if (art.notice) art.notice.show = `Phụ đề: ${sub.label}`;
                                }
                            },
                        },
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

                    // Skip intro: show button from 30s to 3 minutes
                    if (ct >= 30 && ct <= 180) {
                        setShowSkipIntro(true);
                    } else {
                        setShowSkipIntro(false);
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
                    // 'C' — toggle subtitle on/off
                    if (e.key === "c" || e.key === "C") {
                        e.preventDefault();
                        const subs = subtitlesRef.current;
                        if (!subs.length) return;
                        const wrap = document.getElementById("cc-btn-wrap");
                        if (art.subtitle?.show) {
                            art.subtitle.hide();
                            localStorage.setItem("subtitleLang", "");
                            if (wrap) wrap.style.opacity = "0.4";
                            if (art.notice) art.notice.show = "Tắt phụ đề";
                        } else {
                            const savedLang = localStorage.getItem("subtitleLang");
                            const sub = subs.find((s: any) => s.language === savedLang) || subs.find((s: any) => s.isDefault) || subs[0];
                            if (!sub) return;
                            art.subtitle.switch(getSubUrl(sub as any), {
                                name: sub.label || sub.language.toUpperCase(),
                                type: (sub.format === "ass" || sub.format === "ssa") ? "ass" : sub.format,
                                escape: false,
                            });
                            art.subtitle.show();
                            localStorage.setItem("subtitleLang", sub.language);
                            if (wrap) wrap.style.opacity = "1";
                            if (art.notice) art.notice.show = `Phụ đề: ${sub.label}`;
                        }
                    }
                };
                document.addEventListener("keydown", handleKeydown);
                (artInstance.current as any).handleKeydown = handleKeydown;

                // Mobile swipe-to-seek: horizontal swipe on player → tua video
                // Mỗi 30px ngang = ±10 giây; vuốt dọc >45° sẽ bị bỏ qua (scroll)
                const playerEl = artRef.current;
                if (playerEl) {
                    const onTouchStart = (e: TouchEvent) => {
                        const t = e.touches[0];
                        touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
                    };
                    const onTouchMove = (e: TouchEvent) => {
                        if (!touchStartRef.current || !art) return;
                        const t = e.touches[0];
                        const dx = t.clientX - touchStartRef.current.x;
                        const dy = t.clientY - touchStartRef.current.y;
                        // Chỉ xử lý nếu góc vuốt chủ yếu là ngang (|dx| > |dy| * 1.2)
                        if (Math.abs(dx) < Math.abs(dy) * 1.2) return;
                        if (Math.abs(dx) < 15) return; // dead zone nhỏ
                        e.preventDefault(); // ngăn scroll khi vuốt ngang
                        const seekDelta = Math.round((dx / 30) * 10); // 30px = 10s
                        setSeekIndicator({ delta: seekDelta, side: dx > 0 ? "right" : "left" });
                    };
                    const onTouchEnd = (e: TouchEvent) => {
                        if (!touchStartRef.current || !art) { touchStartRef.current = null; return; }
                        const t = e.changedTouches[0];
                        const dx = t.clientX - touchStartRef.current.x;
                        const dy = t.clientY - touchStartRef.current.y;
                        const dt = Date.now() - touchStartRef.current.time;
                        touchStartRef.current = null;
                        setSeekIndicator(null);
                        if (Math.abs(dx) < Math.abs(dy) * 1.2) return;
                        if (Math.abs(dx) < 20 || dt > 800) return; // tránh tap thường
                        const seekDelta = Math.round((dx / 30) * 10);
                        if (seekDelta === 0) return;
                        art.seek = Math.max(0, Math.min(art.duration, art.currentTime + seekDelta));
                    };
                    playerEl.addEventListener("touchstart", onTouchStart, { passive: true });
                    playerEl.addEventListener("touchmove", onTouchMove, { passive: false });
                    playerEl.addEventListener("touchend", onTouchEnd, { passive: true });
                    (artInstance.current as any).touchHandlers = { playerEl, onTouchStart, onTouchMove, onTouchEnd };
                }

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
            if (artInstance.current && (artInstance.current as any).touchHandlers) {
                const { playerEl, onTouchStart, onTouchMove, onTouchEnd } = (artInstance.current as any).touchHandlers;
                playerEl.removeEventListener("touchstart", onTouchStart);
                playerEl.removeEventListener("touchmove", onTouchMove);
                playerEl.removeEventListener("touchend", onTouchEnd);
            }
            if (art) {
                art.destroy(false);
                artInstance.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [finalStreamUrl, handleVideoEnd, initialProgress, movieData, onPlayerError, saveHistory, serverName, session, shouldUseArtPlayer, streamUrl, useProxy]);

    // Late-loading subtitles: if the player was already initialized without subtitles,
    // auto-apply them when they arrive (e.g. subtitle API responded after player init).
    useEffect(() => {
        if (!shouldUseArtPlayer || !artInstance.current || subtitles.length === 0) return;
        const art = artInstance.current as any;
        if (!art || typeof art.subtitle?.switch !== "function") return;

        try {
            const savedLang = typeof localStorage !== "undefined" ? localStorage.getItem("subtitleLang") : null;
            if (savedLang === "") return; // user explicitly turned off
            const sub = subtitles.find((s) => savedLang ? s.language === savedLang : s.isDefault)
                || (savedLang ? null : subtitles[0]);
            if (!sub) return;

            // Build URL using same logic as getSubUrl inside initArtPlayer
            let subUrl = "";
            if (sub.sourceType === "content") {
                subUrl = `/api/subtitles/content?id=${sub._id}`;
            } else if (sub.sourceType === "opensubtitles" && (sub as any).fileId) {
                const p = new URLSearchParams({ fileId: String((sub as any).fileId) });
                if ((sub as any).fileName)    p.set("fileName",    (sub as any).fileName);
                if (sub.language)             p.set("lang",         sub.language);
                if ((sub as any).movieSlug)   p.set("movieSlug",    (sub as any).movieSlug);
                if ((sub as any).episodeSlug) p.set("episodeSlug",  (sub as any).episodeSlug);
                if ((sub as any).movieName)   p.set("movieName",    (sub as any).movieName);
                subUrl = `/api/subtitles/content?${p}`;
            } else if (sub.url) {
                subUrl = `/api/subtitles/content?url=${encodeURIComponent(sub.url)}`;
            }
            if (!subUrl) return;

            // Only switch if the player currently has no subtitle loaded
            if (art.subtitle?.url) {
                // Already has a subtitle; just make sure CC button shows active
                const wrap = document.getElementById("cc-btn-wrap");
                if (wrap) wrap.style.opacity = "1";
                return;
            }

            art.subtitle.switch(subUrl, {
                name: sub.label || sub.language.toUpperCase(),
                type: (sub.format === "ass" || sub.format === "ssa") ? "ass" : sub.format,
                escape: false,
            });
            // Update CC button appearance to active
            const wrap = document.getElementById("cc-btn-wrap");
            if (wrap) wrap.style.opacity = "1";
        } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subtitles, shouldUseArtPlayer]);

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

                {/* Swipe-to-seek indicator — hiện khi đang vuốt trên mobile */}
                {seekIndicator && (
                    <div
                        className={`absolute inset-y-0 flex items-center justify-center pointer-events-none z-[9998] transition-opacity duration-150 ${seekIndicator.side === "left" ? "left-0 w-1/2" : "right-0 w-1/2"}`}
                        style={{ background: seekIndicator.side === "left" ? "linear-gradient(to right, rgba(0,0,0,0.45), transparent)" : "linear-gradient(to left, rgba(0,0,0,0.45), transparent)" }}
                    >
                        <div className="flex flex-col items-center gap-1.5 px-6 py-4 rounded-2xl bg-black/50 backdrop-blur-sm border border-white/10">
                            <span className="text-white text-2xl font-black">
                                {seekIndicator.side === "left" ? "◀◀" : "▶▶"}
                            </span>
                            <span className="text-white text-sm font-bold">
                                {seekIndicator.delta > 0 ? "+" : ""}{seekIndicator.delta}s
                            </span>
                        </div>
                    </div>
                )}
                {showSkipIntro && (
                    <button
                        onClick={() => {
                            if (artInstance.current) {
                                artInstance.current.seek = Math.min(artInstance.current.duration, artInstance.current.currentTime + 85);
                            }
                            setShowSkipIntro(false);
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
                        onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(143,167,197,0.95)'; (e.currentTarget as HTMLButtonElement).style.color = '#0a0a0a'; }}
                        onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.82)'; (e.currentTarget as HTMLButtonElement).style.color = 'white'; }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z" /></svg>
                        Bỏ qua intro
                    </button>
                )}
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
