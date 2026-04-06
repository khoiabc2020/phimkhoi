"use client";

import { useState } from "react";
import { Share2, Monitor, Moon, Flag, X, Keyboard } from "lucide-react";
import FavoriteButton from "./FavoriteButton";
import WatchlistInlineButton from "./WatchlistInlineButton";
import Image from "next/image";
import { getPosterImageUrl } from "@/lib/utils";
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
    useIframe?: boolean;
    onTogglePlayer?: () => void;
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
    useIframe = false,
    onTogglePlayer,
}: WatchEngagementBarProps) {
    const { showToast } = useToast();
    const [showReportModal, setShowReportModal] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [reportDescription, setReportDescription] = useState("");
    const [isSendingReport, setIsSendingReport] = useState(false);
    const movieData = {
        movieId: movie._id || "",
        movieSlug: movie.slug,
        movieName: movie.name,
        movieOriginName: movie.origin_name || "",
        moviePoster: getPosterImageUrl(movie) || "",
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

    const handleOpenReport = () => {
        setReportDescription("");
        setShowReportModal(true);
    };

    const handleSendReport = async () => {
        setIsSendingReport(true);
        const url = window.location.href;
        const payload = {
            movieName: movie.name,
            episodeName: currentEpisodeName || null,
            url,
            description: reportDescription.trim(),
        };
        try {
            const res = await fetch("/api/user/report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                showToast({ type: "success", title: "Đã gửi báo cáo", description: "Cảm ơn bạn đã phản hồi!" });
                setShowReportModal(false);
            } else {
                throw new Error("failed");
            }
        } catch {
            // Fallback: copy to clipboard
            const report = `Báo lỗi phim:\n- Phim: ${movie.name}\n- Tập: ${currentEpisodeName || "N/A"}\n- URL: ${url}\n- Mô tả: ${reportDescription.trim() || "(không có)"}`;
            try {
                await navigator.clipboard.writeText(report);
                showToast({ type: "success", title: "Đã sao chép báo cáo", description: "Dán vào form hoặc gửi email hỗ trợ" });
            } catch {
                showToast({ type: "error", title: "Không thể gửi báo cáo" });
            }
            setShowReportModal(false);
        } finally {
            setIsSendingReport(false);
        }
    };

    return (
        <>
        <div className="relative z-30 rounded-[10px] border border-white/[0.06] overflow-hidden shadow-[0_12px_28px_#00000066] bg-[#07070b]/82">

            {/* Controls bar */}
            <div className="flex items-center gap-4 py-3 px-5 border-b border-white/[0.06] overflow-x-auto hide-scrollbar md:flex-wrap md:justify-between md:overflow-visible bg-[#09090d]">

                {/* Left */}
                <div className="flex items-center shrink-0 gap-4">
                    <FavoriteButton
                        movieData={movieData}
                        size="sm"
                        className="!bg-transparent !border-0 text-gray-200 hover:text-yellow-400 flex items-center gap-2 !w-auto !h-auto !p-0 transition-colors"
                    />
                    <div className="h-4 w-[1px] bg-white/20" />
                    <WatchlistInlineButton
                        slug={movie.slug}
                        movieName={movie.name}
                        moviePoster={getPosterImageUrl(movie)}
                        showLabel={true}
                        size="sm"
                        className="!bg-transparent !border-0 !rounded-none !w-auto text-gray-200 hover:text-primary gap-1.5 px-0 text-xs font-semibold uppercase tracking-wide"
                    />
                    <div className="h-4 w-[1px] bg-white/20" />
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
                                    autoNext ? "bg-yellow-400/15 text-yellow-400 border-yellow-400/30" : "bg-white/10 text-gray-100 border-white/25"
                                )}>
                                    {autoNext ? "ON" : "OFF"}
                                </span>
                            </button>
                            <div className="h-4 w-[1px] bg-white/20" />
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
                            : "bg-white/10 text-gray-100 border-white/25")}>
                            {isTheaterMode ? "ON" : "OFF"}
                        </span>
                    </button>}
                    {toggleLight && <button onClick={toggleLight}
                        className={cn("flex items-center gap-2 text-xs font-semibold transition-all", isLightOff ? "text-yellow-400" : "text-gray-200 hover:text-white")}>
                        <Moon className="w-4 h-4" /> Đèn
                        <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold border", isLightOff
                            ? "bg-yellow-400/15 text-yellow-400 border-yellow-400/30"
                            : "bg-white/10 text-gray-100 border-white/25")}>
                            {isLightOff ? "OFF" : "ON"}
                        </span>
                    </button>}
                    {onTogglePlayer && (
                        <button onClick={onTogglePlayer}
                            className={cn("flex items-center gap-2 text-xs font-semibold transition-all", !useIframe ? "text-primary shadow-[0_0_10px_rgba(143,167,197,0.3)]" : "text-gray-200 hover:text-white")}>
                            <div className="relative">
                                <Monitor className="w-4 h-4" />
                                {!useIframe && <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-ping" />}
                            </div>
                            {useIframe ? "Dùng Elite Player" : "Dùng Player Gốc"}
                            <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold border", !useIframe
                                ? "bg-primary/20 text-primary border-primary/40"
                                : "bg-white/10 text-gray-100 border-white/25")}>
                                {!useIframe ? "ELITE" : "MODERN"}
                            </span>
                        </button>
                    )}
                </div>

                {/* Right */}
                <div className="flex items-center shrink-0 gap-4 text-gray-200">
                    <button type="button" onClick={handleShare} className="flex items-center gap-2 hover:text-white transition-all text-xs font-semibold group">
                        <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span className="hidden sm:inline">Chia sẻ</span>
                    </button>
                    <button type="button" onClick={handleOpenReport} className="flex items-center gap-2 hover:text-red-400 transition-all text-xs font-semibold">
                        <Flag className="w-4 h-4" />
                        <span className="hidden sm:inline">Báo lỗi</span>
                    </button>
                    <button type="button" onClick={() => setShowShortcuts(true)} title="Phím tắt player" className="hidden md:flex items-center gap-1.5 hover:text-white transition-all text-xs font-semibold">
                        <Keyboard className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Movie Info - luôn nằm ngang trên mọi thiết bị */}
            <div className="flex flex-row gap-4 p-4 md:p-5 items-start border-t border-white/[0.06] bg-[#07070b]/78">
                {/* Poster */}
                <div className="flex-shrink-0">
                    <div className="relative w-20 h-[112px] md:w-24 md:h-[134px] rounded-lg overflow-hidden shadow-xl ring-1 ring-white/20">
                        <Image
                            src={getPosterImageUrl(movie) || "/placeholder.svg"}
                            alt={movie.name}
                            fill
                            className="object-cover"
                            sizes="96px"
                            quality={68}
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
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1" style={{ fontSize: '12px', color: '#f1f5f9' }}>
                        {movie.year && <><span className="w-1 h-1 rounded-full bg-white/50 inline-block" /><span>{movie.year}</span></>}
                        {movie.quality && <><span className="w-1 h-1 rounded-full bg-white/50 inline-block" />
                            <span className="px-1.5 py-0.5 rounded font-semibold text-white" style={{ background: 'rgba(255,255,255,0.16)', fontSize: '11px' }}>{movie.quality}</span></>}
                        {movie.time && <><span className="w-1 h-1 rounded-full bg-white/50 inline-block" /><span>{movie.time}</span></>}
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

            {/* Report Modal */}
            {showReportModal && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) setShowReportModal(false); }}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

                    {/* Dialog */}
                    <div className="relative w-full max-w-md bg-[#0c0c14] border border-white/[0.10] rounded-xl shadow-2xl p-5 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-red-400">
                                <Flag className="w-4 h-4" />
                                <span className="text-sm font-bold uppercase tracking-wide">Báo lỗi phim</span>
                            </div>
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="w-7 h-7 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Info */}
                        <div className="flex flex-col gap-1 text-xs text-white/50 bg-white/[0.04] rounded-lg px-3 py-2.5 border border-white/[0.06]">
                            <div><span className="text-white/30">Phim:</span> <span className="text-white/80 font-medium">{movie.name}</span></div>
                            {currentEpisodeName && (
                                <div><span className="text-white/30">Tập:</span> <span className="text-white/80 font-medium">{currentEpisodeName}</span></div>
                            )}
                            <div className="truncate text-white/40 text-[10px] mt-0.5">{typeof window !== "undefined" ? window.location.pathname : ""}</div>
                        </div>

                        {/* Textarea */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-white/30 uppercase tracking-wider">Mô tả lỗi</label>
                            <textarea
                                value={reportDescription}
                                onChange={(e) => setReportDescription(e.target.value)}
                                placeholder="Ví dụ: Không có âm thanh, video bị đứng, sai tập..."
                                rows={3}
                                className="w-full bg-white/[0.04] border border-white/[0.10] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-primary/40 resize-none"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="px-4 py-2 rounded-lg text-xs font-bold text-white/50 hover:text-white hover:bg-white/[0.06] transition-all"
                            >
                                Đóng
                            </button>
                            <button
                                onClick={handleSendReport}
                                disabled={isSendingReport}
                                className="px-5 py-2 rounded-lg text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 hover:text-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSendingReport ? "Đang gửi..." : "Gửi báo cáo"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* === Keyboard Shortcuts Modal === */}
            {showShortcuts && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowShortcuts(false)}>
                    <div className="w-full max-w-sm bg-[#0c0c18] border border-white/10 rounded-2xl shadow-2xl p-5 space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-white font-bold text-base flex items-center gap-2">
                                <Keyboard className="w-4 h-4 text-[#8FA7C5]" /> Phím tắt player
                            </h2>
                            <button onClick={() => setShowShortcuts(false)} className="text-gray-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                            {([
                                ["Space", "Phát / Dừng"],
                                ["← →", "Tua ±10 giây"],
                                ["↑ ↓", "Âm lượng ±10%"],
                                ["F", "Toàn màn hình"],
                                ["M", "Tắt/bật tiếng"],
                                ["C", "Bật/tắt phụ đề"],
                                ["0–9", "Nhảy đến %"],
                                ["Esc", "Thoát toàn màn"],
                            ] as [string, string][]).map(([key, desc]) => (
                                <div key={key} className="flex items-center gap-2">
                                    <kbd className="px-2 py-1 rounded-md bg-white/10 border border-white/20 text-white text-xs font-mono min-w-[40px] text-center shrink-0">{key}</kbd>
                                    <span className="text-gray-300 text-xs">{desc}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 text-center pt-1">Vuốt ngang màn hình cảm ứng để tua nhanh</p>
                    </div>
                </div>
            )}
        </>
    );
}
