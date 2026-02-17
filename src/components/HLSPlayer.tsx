import React, { useState, useRef, useEffect, useCallback } from "react";
// import ReactPlayer from "react-player"; // Causes SSR Error
import dynamic from "next/dynamic";


const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

import { Maximize2, Minimize2, Play, Pause, Volume2, VolumeX, Settings, RotateCcw, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { addWatchHistory } from "@/app/actions/watchHistory";

interface HLSPlayerProps {
    url: string; // m3u8 url
    poster?: string;
    initialProgress?: number; // 0-100
    movieData?: any;
    autoPlay?: boolean;
}

export default function HLSPlayer({ url, poster, initialProgress = 0, movieData, autoPlay = false }: HLSPlayerProps) {
    const [playing, setPlaying] = useState(autoPlay);
    const [volume, setVolume] = useState(1);
    const [muted, setMuted] = useState(false);
    const [played, setPlayed] = useState(0); // 0-1
    const [duration, setDuration] = useState(0);
    const [seeking, setSeeking] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isReady, setIsReady] = useState(false);

    const playerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastSyncTime = useRef<number>(0);

    // Initial Seek
    const onReady = useCallback(() => {
        setIsReady(true);
        if (initialProgress > 0 && playerRef.current) {
            const seekTime = (initialProgress / 100) * playerRef.current.getDuration();
            playerRef.current.seekTo(seekTime, 'seconds');
        }
    }, [initialProgress]);

    // Handle Progress & Sync
    const handleProgress = useCallback((state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => {
        if (!seeking) {
            setPlayed(state.played);

            // Sync every 5 seconds or 5% change
            const now = Date.now();
            if (movieData && (now - lastSyncTime.current > 5000)) {
                lastSyncTime.current = now;
                addWatchHistory({
                    ...movieData,
                    duration: duration,
                    currentTime: state.playedSeconds,
                }).catch(console.error);
            }
        }
    }, [seeking, movieData, duration]);

    // Controls Visibility
    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            if (playing) setShowControls(false);
        }, 3000);
    };

    const togglePlay = () => setPlaying(!playing);
    const toggleMute = () => setMuted(!muted);

    const toggleFullscreen = useCallback(() => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().then(() => setIsFullscreen(true));
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false));
        }
    }, []);

    const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPlayed(parseFloat(e.target.value));
    };

    const handleSeekMouseDown = () => setSeeking(true);

    const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
        setSeeking(false);
        if (playerRef.current) {
            playerRef.current.seekTo(parseFloat((e.target as HTMLInputElement).value));
        }
    };

    const formatTime = (seconds: number) => {
        const date = new Date(seconds * 1000);
        const hh = date.getUTCHours();
        const mm = date.getUTCMinutes();
        const ss = ("0" + date.getUTCSeconds()).slice(-2);
        if (hh) {
            return `${hh}:${("0" + mm).slice(-2)}:${ss}`;
        }
        return `${mm}:${ss}`;
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full bg-black group overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => playing && setShowControls(false)}
            onClick={() => {
                // Toggle play if clicking on video area (not controls)
                if (!showControls) togglePlay();
            }}
        >
            {/* @ts-ignore */}
            <ReactPlayer
                ref={playerRef}
                url={`/api/hls-proxy?url=${encodeURIComponent(url)}`}
                width="100%"
                height="100%"
                playing={playing}
                volume={volume}
                muted={muted}
                onReady={onReady}
                onProgress={handleProgress}
                onDuration={setDuration}
                onEnded={() => setShowControls(true)}
                config={{
                    file: {
                        forceHLS: true,
                        attributes: {
                            poster: poster
                        }
                    }
                }}
            />

            {/* Overlay Gradient */}
            <div className={cn(
                "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none transition-opacity duration-300",
                showControls ? "opacity-100" : "opacity-0"
            )} />

            {/* Loading Spinner */}
            {!isReady && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            )}

            {/* Center Play Button (Big) */}
            {isReady && !playing && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 rounded-full bg-black/50 border border-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Play className="w-8 h-8 text-white fill-white ml-1" />
                    </div>
                </div>
            )}

            {/* Controls Bar */}
            <div className={cn(
                "absolute bottom-0 left-0 right-0 p-4 transition-all duration-300 z-50",
                showControls ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
            )}>
                {/* Progress Bar */}
                <div className="w-full h-1 bg-white/20 rounded-full mb-4 relative group/slider cursor-pointer">
                    <div
                        className="absolute top-0 left-0 h-full bg-primary rounded-full"
                        style={{ width: `${played * 100}%` }}
                    />
                    <input
                        type="range"
                        min={0}
                        max={1} // 0.999999
                        step="any"
                        value={played}
                        onMouseDown={handleSeekMouseDown}
                        onChange={handleSeekChange}
                        onMouseUp={handleSeekMouseUp}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={togglePlay} className="text-white hover:text-primary transition-colors hover:scale-110 transform duration-200">
                            {playing ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
                        </button>

                        <div className="flex items-center gap-4">
                            <button onClick={() => {
                                if (playerRef.current) playerRef.current.seekTo(playerRef.current.getCurrentTime() - 10);
                            }} className="group/skip flex items-center justify-center text-white/80 hover:text-white transition-all hover:bg-white/10 rounded-full p-2" title="-10s">
                                <RotateCcw className="w-5 h-5" />
                                <span className="text-[10px] font-medium ml-1 opacity-0 group-hover/skip:opacity-100 transition-opacity absolute -bottom-4">10s</span>
                            </button>

                            <button onClick={() => {
                                if (playerRef.current) playerRef.current.seekTo(playerRef.current.getCurrentTime() + 10);
                            }} className="group/skip flex items-center justify-center text-white/80 hover:text-white transition-all hover:bg-white/10 rounded-full p-2" title="+10s">
                                <RotateCw className="w-5 h-5" />
                                <span className="text-[10px] font-medium ml-1 opacity-0 group-hover/skip:opacity-100 transition-opacity absolute -bottom-4">10s</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-2 group/volume">
                            <button onClick={toggleMute} className="text-white hover:text-primary transition-colors">
                                {muted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                            </button>
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step="any"
                                value={muted ? 0 : volume}
                                onChange={e => {
                                    setVolume(parseFloat(e.target.value));
                                    setMuted(false);
                                }}
                                className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-300 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                            />
                        </div>

                        <span className="text-xs font-medium text-gray-300 tracking-wider">
                            {formatTime(played * duration)} / {formatTime(duration)}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="text-white hover:text-primary transition-colors">
                            <Settings className="w-5 h-5" />
                        </button>
                        <button onClick={toggleFullscreen} className="text-white hover:text-primary transition-colors">
                            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
