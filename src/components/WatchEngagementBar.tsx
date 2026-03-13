"use client";

import { Heart, Share2, Monitor, Moon, Flag } from "lucide-react";
import FavoriteButton from "./FavoriteButton";
import WatchlistInlineButton from "./WatchlistInlineButton";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";

interface WatchEngagementBarProps {
    movie: any;
    isTheaterMode?: boolean;
    toggleTheater?: () => void;
    isLightOff?: boolean;
    toggleLight?: () => void;
    autoNext?: boolean;
    onAutoNextToggle?: () => void;
    currentEpisodeName?: string;
}

export default function WatchEngagementBar({
    movie,
    isTheaterMode = false,
    toggleTheater,
    isLightOff = false,
    toggleLight,
    autoNext = true,
    onAutoNextToggle,
    currentEpisodeName,
}: WatchEngagementBarProps) {
    const { showToast } = useToast();
    const movieData = {
        movieId: movie._id || "",
        movieSlug: movie.slug,
        movieName: movie.name,
        movieOriginName: movie.origin_name || "",
        moviePoster: movie.poster_url || movie.thumb_url || "",
        movieYear: Number(movie.year) || new Date().getFullYear(),
        movieQuality: movie.quality || "HD",
        movieVoteAverage: movie.vote_average || 0,
        movieCategories: (movie.category as { name: string }[])?.map(c => c.name) || [],
    };

    const handleShare = async () => {
        const url = window.location.href;
        const title = `${movie.name}${currentEpisodeName ? ` - ${currentEpisodeName}` : ""}`;
        try {
            if (navigator.share) {
                await navigator.share({ title, url });
                showToast({ type: "success", title: "Đã chia sẻ" });
            } else {
                await navigator.clipboard.writeText(url);
                showToast({ type: "success", title: "Đã sao chép link", description: url });
            }
        } catch (e) {
            if ((e as Error).name !== "AbortError") {
                try {
                    await navigator.clipboard.writeText(url);
                    showToast({ type: "success", title: "Đã sao chép link" });
                } catch {
                    showToast({ type: "error", title: "Không thể chia sẻ" });
                }
            }
        }
    };

    const handleReportError = async () => {
        const report = `Báo lỗi phim:\n- Phim: ${movie.name}\n- Tập: ${currentEpisodeName || "N/A"}\n- URL: ${window.location.href}`;
        try {
            await navigator.clipboard.writeText(report);
            showToast({ type: "success", title: "Đã sao chép thông tin báo lỗi", description: "Dán vào form hoặc gửi email hỗ trợ" });
        } catch {
            showToast({ type: "error", title: "Không thể sao chép" });
        }
    };

    return (
        <div className="rounded-lg border border-white/[0.16] overflow-hidden"
            style={{ background: '#202636' }}>

            {/* Controls bar */}
            <div className="flex items-center gap-4 py-3 px-5 border-b border-white/[0.14] overflow-x-auto hide-scrollbar md:flex-wrap md:justify-between md:overflow-visible"
                style={{ background: '#1A2230' }}>

                {/* Left */}
                <div className="flex items-center shrink-0 gap-4">
                    <FavoriteButton
                        movieData={movieData}
                        size="sm"
                        className="!bg-transparent !border-0 text-gray-200 hover:text-yellow-400 flex items-center gap-2 !w-auto !h-auto !p-0 transition-colors"
                    />
                    <div className="h-4 w-[1px] bg-white/10" />
                    <WatchlistInlineButton
                        slug={movie.slug}
                        movieName={movie.name}
                        moviePoster={movie.poster_url || movie.thumb_url}
                        showLabel={true}
                        size="sm"
                        className="!bg-transparent !border-0 !rounded-none !w-auto text-gray-200 hover:text-primary gap-1.5 px-0 text-xs font-semibold uppercase tracking-wide"
                    />
                    <div className="h-4 w-[1px] bg-white/10" />
                    {onAutoNextToggle && (
                        <>
                            <button
                                onClick={onAutoNextToggle}
                                className={cn(
                                    "flex items-center gap-2 text-xs font-semibold transition-all",
                                    autoNext ? "text-yellow-400" : "text-gray-300 hover:text-white"
                                )}
                            >
                                Chuyển tập
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[10px] font-bold border",
                                    autoNext ? "bg-yellow-400/15 text-yellow-400 border-yellow-400/30" : "bg-white/8 text-gray-200 border-white/15"
                                )}>
                                    {autoNext ? "ON" : "OFF"}
                                </span>
                            </button>
                            <div className="h-4 w-[1px] bg-white/10" />
                        </>
                    )}
                </div>

                {/* Center Toggles */}
                <div className="flex items-center shrink-0 gap-5">
                    {toggleTheater && <button onClick={toggleTheater}
                        className={cn("flex items-center gap-2 text-xs font-semibold transition-all", isTheaterMode ? "text-yellow-400" : "text-gray-200 hover:text-white")}>
                        <Monitor className="w-4 h-4" /> Rạp phim
                        <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold border", isTheaterMode
                            ? "bg-yellow-400/15 text-yellow-400 border-yellow-400/30"
                            : "bg-white/8 text-gray-200 border-white/15")}>
                            {isTheaterMode ? "ON" : "OFF"}
                        </span>
                    </button>}
                    {toggleLight && <button onClick={toggleLight}
                        className={cn("flex items-center gap-2 text-xs font-semibold transition-all", isLightOff ? "text-yellow-400" : "text-gray-200 hover:text-white")}>
                        <Moon className="w-4 h-4" /> Đèn
                        <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold border", isLightOff
                            ? "bg-yellow-400/15 text-yellow-400 border-yellow-400/30"
                            : "bg-white/8 text-gray-200 border-white/15")}>
                            {isLightOff ? "OFF" : "ON"}
                        </span>
                    </button>}
                </div>

                {/* Right */}
                <div className="flex items-center shrink-0 gap-4 text-gray-200">
                    <button type="button" onClick={handleShare} className="flex items-center gap-2 hover:text-white transition-all text-xs font-semibold group">
                        <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span className="hidden sm:inline">Chia sẻ</span>
                    </button>
                    <button type="button" onClick={handleReportError} className="flex items-center gap-2 hover:text-red-400 transition-all text-xs font-semibold">
                        <Flag className="w-4 h-4" />
                        <span className="hidden sm:inline">Báo lỗi</span>
                    </button>
                </div>
            </div>

            {/* Movie Info - luôn nằm ngang trên mọi thiết bị */}
            <div className="flex flex-row gap-4 p-4 md:p-5 items-start border-t border-white/[0.08]"
                style={{ background: '#242B3D' }}>
                {/* Poster */}
                <div className="flex-shrink-0">
                    <div className="relative w-20 h-[112px] md:w-24 md:h-[134px] rounded-lg overflow-hidden shadow-xl ring-1 ring-white/10">
                        <Image
                            src={getImageUrl(movie.poster_url || movie.thumb_url)}
                            alt={movie.name}
                            fill
                            className="object-cover"
                        />
                    </div>
                </div>

                {/* Info bên phải */}
                <div className="flex-grow min-w-0 flex flex-col justify-start gap-1.5">
                    {/* Tên Tiếng Việt */}
                    <h1 className="text-[16px] md:text-[18px] font-bold text-white leading-snug tracking-tight line-clamp-2 drop-shadow-sm">
                        {movie.name}
                    </h1>
                    {/* Tên gốc */}
                    <span className="text-[13px] font-semibold text-[#F7D772] leading-snug line-clamp-1">{movie.origin_name}</span>
                    {/* Meta: năm • chất lượng • thời lượng */}
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1" style={{ fontSize: '12px', color: '#e2e8f0' }}>
                        {movie.year && <><span className="w-1 h-1 rounded-full bg-gray-600 inline-block" /><span>{movie.year}</span></>}
                        {movie.quality && <><span className="w-1 h-1 rounded-full bg-gray-600 inline-block" />
                            <span className="px-1.5 py-0.5 rounded font-semibold text-white" style={{ background: 'rgba(255,255,255,0.16)', fontSize: '11px' }}>{movie.quality}</span></>}
                        {movie.time && <><span className="w-1 h-1 rounded-full bg-gray-600 inline-block" /><span>{movie.time}</span></>}
                    </div>
                    {/* Genres + IMDB badge cùng hàng */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        {(movie.category as { id: string; name: string }[])?.slice(0, 3).map(c => (
                            <span key={c.id}
                                className="text-[11px] px-2 py-0.5 rounded-full text-gray-100 border border-white/[0.20]"
                                style={{ background: 'rgba(255,255,255,0.16)' }}>
                                {c.name}
                            </span>
                        ))}
                        {/* IMDB — iOS 26 pill */}
                        {movie.vote_average && movie.vote_average > 0 ? (
                            <div className="flex items-center gap-1 shrink-0"
                                style={{
                                    background: 'rgba(17,24,39,0.75)',
                                    backdropFilter: 'blur(12px)',
                                    WebkitBackdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '999px',
                                    padding: '3px 8px 3px 5px',
                                }}>
                                <span className="font-black px-1 py-0.5 rounded-sm"
                                    style={{ background: '#F5C518', color: '#000', fontSize: '10px' }}>
                                    IMDb
                                </span>
                                <span className="font-bold text-white" style={{ fontSize: '13px' }}>
                                    {movie.vote_average.toFixed(1)}
                                </span>
                                <span className="text-white/50" style={{ fontSize: '10px' }}>/10</span>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
