"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Database, Mic, Subtitles, Video, Volume2, Play } from "lucide-react";
import MovieCard from "./MovieCard";
import { cn, decodeHtml, getBackdropImageUrl, getImageUrl, getPosterImageUrl } from "@/lib/utils";

interface MovieTabsProps {
    movie: any;
    relatedMovies: any[];
    episodes: { server_name: string; server_data: any[] }[];
    slug: string;
    tmdbDetails?: any;
    episodeThumbnails?: Record<string, string>;
    episodeMetadata?: Record<string, { overview?: string; airDate?: string; runtime?: number }>;
    cast?: React.ReactNode;
}

const EPISODES_PER_CHUNK = 50;

export default function MovieTabs({
    movie,
    relatedMovies,
    episodes,
    slug,
    tmdbDetails,
    episodeThumbnails = {},
    episodeMetadata = {},
    cast,
}: MovieTabsProps) {
    const defaultTab = episodes?.length ? "episodes" : "related";
    const [activeTab, setActiveTab] = useState<"episodes" | "trailer" | "related" | "cast">(defaultTab);
    const [activeServer, setActiveServer] = useState(0);
    const [currentChunk, setCurrentChunk] = useState(0);
    const [activeLangTab, setActiveLangTab] = useState("");
    const [showEpisodeImages, setShowEpisodeImages] = useState(false);
    const [activeTrailerIdx, setActiveTrailerIdx] = useState(0);

    const tmdbVideos = useMemo(() => {
        const videos: any[] = tmdbDetails?.videos?.results || [];
        const youtubeVideos = videos.filter((item) => item.site === "YouTube");
        const trailers = youtubeVideos.filter((item) => item.type === "Trailer");
        const teasers = youtubeVideos.filter((item) => item.type === "Teaser");
        const others = youtubeVideos.filter((item) => item.type !== "Trailer" && item.type !== "Teaser");
        return [...trailers, ...teasers, ...others].slice(0, 6);
    }, [tmdbDetails]);

    const languageGroups = useMemo(() => {
        const map: Record<string, { server_name: string; server_data: any[] }[]> = {
            "Phụ Đề": [],
            "Lồng Tiếng": [],
            "Thuyết Minh": [],
        };
        for (const server of episodes || []) {
            if (!server?.server_data?.length) continue;
            const lower = String(server.server_name || "").toLowerCase();
            const key = lower.includes("lồng tiếng") || lower.includes("longtieng")
                ? "Lồng Tiếng"
                : lower.includes("thuyết minh") || lower.includes("thuyetminh")
                    ? "Thuyết Minh"
                    : "Phụ Đề";
            map[key].push(server);
        }
        return map;
    }, [episodes]);

    const activeLanguages = Object.keys(languageGroups).filter((key) => languageGroups[key].length > 0);

    useEffect(() => {
        if (!activeLangTab && activeLanguages.length > 0) {
            setActiveLangTab(activeLanguages[0]);
        }
    }, [activeLangTab, activeLanguages]);

    useEffect(() => {
        if (!activeLangTab || !languageGroups[activeLangTab]?.length) return;
        const currentServerName = episodes?.[activeServer]?.server_name;
        const exists = languageGroups[activeLangTab].some((server) => server.server_name === currentServerName);
        if (!exists) {
            const first = languageGroups[activeLangTab][0];
            const index = episodes.findIndex((server) => server.server_name === first.server_name);
            if (index >= 0) {
                setActiveServer(index);
                setCurrentChunk(0);
            }
        }
    }, [activeLangTab, activeServer, episodes, languageGroups]);

    useEffect(() => {
        setCurrentChunk(0);
    }, [activeServer]);

    const currentServerData = episodes?.[activeServer]?.server_data || [];
    const totalChunks = Math.ceil(currentServerData.length / EPISODES_PER_CHUNK);
    const paginatedEpisodes = currentServerData.slice(currentChunk * EPISODES_PER_CHUNK, (currentChunk + 1) * EPISODES_PER_CHUNK);
    const backdropFallback = getBackdropImageUrl(movie) || getPosterImageUrl(movie) || "";
    const activeVideo = tmdbVideos[activeTrailerIdx] || null;

    const tabs = [
        { id: "episodes", label: "DANH SÁCH TẬP", show: episodes?.length > 0 },
        { id: "cast", label: "DIỄN VIÊN", show: !!cast },
        { id: "related", label: "ĐỀ XUẤT", show: relatedMovies.length > 0 },
        { id: "trailer", label: "TRAILER", show: tmdbVideos.length > 0 || (!!movie?.trailer_url && movie.trailer_url.includes("youtube")) },
    ].filter((item) => item.show);

    return (
        <div className="w-full">
            <div className="flex items-center gap-3 sm:gap-6 border-b border-white/[0.04] mb-4 sm:mb-6 overflow-x-auto no-scrollbar pb-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn("flex items-center gap-1.5 pb-3 text-[11px] sm:text-[12px] font-black transition-all relative whitespace-nowrap uppercase tracking-wide", activeTab === tab.id ? "text-[#8FA7C5]" : "text-gray-500 hover:text-white")}
                    >
                        {tab.label}
                        {activeTab === tab.id && <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#8FA7C5]" />}
                    </button>
                ))}
            </div>

            {activeTab === "episodes" && (
                <div className="bg-[#07070b]/78 border border-white/[0.05] rounded-[10px] p-3 sm:p-5 shadow-[0_10px_26px_#00000055] space-y-6">
                    {activeLanguages.length > 0 && (
                        <div className="flex items-center gap-3 sm:gap-6 border-b border-white/[0.06] pb-1 overflow-x-auto no-scrollbar">
                            {activeLanguages.map((lang) => {
                                const Icon = lang === "Lồng Tiếng" ? Mic : lang === "Thuyết Minh" ? Volume2 : Subtitles;
                                return (
                                    <button key={lang} onClick={() => setActiveLangTab(lang)} className={cn("flex items-center gap-2 pb-3 text-[12px] sm:text-[14px] font-bold relative whitespace-nowrap", activeLangTab === lang ? "text-[#8FA7C5]" : "text-gray-400 hover:text-gray-200")}>
                                        <Icon className="w-4 h-4" />
                                        {lang}
                                        {activeLangTab === lang && <span className="absolute bottom-[-1px] left-0 right-0 h-[3px] rounded-t-full bg-[#8FA7C5]" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <div className="flex flex-row items-center gap-2 sm:gap-3 border-b border-white/[0.05] pb-4 flex-wrap">
                        <div className="flex items-center gap-1.5 text-gray-400 text-[11px] sm:text-[12px] font-bold uppercase tracking-widest shrink-0">
                            <Database className="w-[14px] h-[14px] text-gray-600" strokeWidth={2.5} />
                            Máy chủ:
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {(activeLangTab ? languageGroups[activeLangTab] : []).map((server, indexInTab) => {
                                const globalIndex = episodes.findIndex((item) => item.server_name === server.server_name);
                                const displayName = String(server.server_name || "")
                                    .split("##")[0]
                                    .replace(/lồng tiếng|longtieng|thuyết minh|thuyetminh|vietsub/gi, "")
                                    .replace(/\(\)|\[\]|--/g, " ")
                                    .trim() || `Server #${indexInTab + 1}`;
                                return (
                                    <button key={globalIndex} onClick={() => setActiveServer(globalIndex)} className={cn("h-[28px] sm:h-[34px] px-2.5 sm:px-4 rounded-full text-[11px] sm:text-[12px] font-bold transition-all duration-200 border flex items-center gap-1.5 shadow-sm", activeServer === globalIndex ? "bg-[#8FA7C5] border-[#8FA7C5] text-[#0a0a0a] scale-105" : "bg-white/[0.04] border-white/[0.10] text-gray-300 hover:text-white hover:border-white/[0.2] hover:bg-white/[0.08]")}>
                                        <span className="truncate max-w-[120px] sm:max-w-[160px]">{displayName}</span>
                                        <span className={cn("font-semibold text-[10px]", activeServer === globalIndex ? "text-black/70" : "text-gray-400")}>{server.server_data.length}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                            <div className="text-sm font-bold text-gray-200">Danh sách tập <span className="text-[#8FA7C5]">({currentServerData.length})</span></div>
                            {totalChunks > 1 && (
                                <div className="relative">
                                    <select value={currentChunk} onChange={(e) => setCurrentChunk(Number(e.target.value))} className="appearance-none bg-[#0B0B10] border border-white/[0.08] text-white text-sm font-medium py-2 px-4 pr-10 rounded-lg outline-none focus:border-[#8FA7C5]/40 transition-colors cursor-pointer">
                                        {Array.from({ length: totalChunks }).map((_, idx) => {
                                            const start = idx * EPISODES_PER_CHUNK + 1;
                                            const end = Math.min((idx + 1) * EPISODES_PER_CHUNK, currentServerData.length);
                                            return <option key={idx} value={idx}>Tập {start} - {end}</option>;
                                        })}
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2.5">
                            <span className="text-[12px] sm:text-[13px] text-gray-300 font-medium">Hiện ảnh</span>
                            <button type="button" role="switch" aria-checked={showEpisodeImages} onClick={() => setShowEpisodeImages(!showEpisodeImages)} className={cn("w-10 h-6 rounded-full transition-colors relative border border-white/10", showEpisodeImages ? "bg-white/30" : "bg-white/15")}>
                                <span className={cn("absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow transition-all", showEpisodeImages ? "left-[19px]" : "left-[3px]")} />
                            </button>
                        </div>
                    </div>

                    {showEpisodeImages ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 max-h-[520px] overflow-y-auto custom-scrollbar pr-1 sm:pr-2 pb-1 [contain:layout_paint]">
                            {paginatedEpisodes.map((ep: { slug?: string; name?: string }) => {
                                if (!ep?.slug) return null;
                                const rawName = String(ep.name || "");
                                const numberMatch = rawName.match(/(\d+)/);
                                const displayName = numberMatch ? String(Number(numberMatch[1])) : rawName || "1";
                                const meta = episodeMetadata?.[ep.slug];
                                const thumb = episodeThumbnails?.[ep.slug] || backdropFallback;
                                const episodeOverview = decodeHtml(meta?.overview || "Nội dung tập đang được cập nhật.");
                                const dateText = meta?.airDate ? new Date(meta.airDate).toLocaleDateString("vi-VN") : "";
                                const runtimeText = meta?.runtime ? `${meta.runtime}m` : "";
                                return (
                                    <Link key={ep.slug} href={`/xem-phim/${slug}/${ep.slug}?server=${activeServer}`} className="group rounded-[12px] overflow-hidden border transition-all duration-200 touch-manipulation bg-[#0C0C12] border-white/[0.08] hover:border-white/[0.20] hover:-translate-y-[1px]" title={rawName}>
                                        <div className="relative aspect-video overflow-hidden">
                                            {thumb ? <div className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.03]" style={{ backgroundImage: `url(${getImageUrl(thumb)})` }} /> : <div className="absolute inset-0 bg-gradient-to-br from-[#2A2F3D] to-[#181B24]" />}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                            <div className="absolute left-2.5 bottom-2 text-white font-bold text-[16px] drop-shadow-md">Tập {displayName}</div>
                                        </div>
                                        <div className="px-3 py-2.5">
                                            <p className="text-[12px] text-gray-200 line-clamp-2 leading-relaxed min-h-[34px]">{episodeOverview}</p>
                                            {(dateText || runtimeText) && <p className="text-[11px] text-gray-400 mt-1">{dateText}{dateText && runtimeText ? " · " : ""}{runtimeText}</p>}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-1.5 sm:gap-2 max-h-[360px] sm:max-h-[440px] overflow-y-auto custom-scrollbar pr-1 sm:pr-2 pb-1 [contain:layout_paint]">
                            {paginatedEpisodes.map((ep: { slug?: string; name?: string }) => {
                                if (!ep?.slug) return null;
                                const rawName = String(ep.name || "");
                                const numberMatch = rawName.match(/(\d+)/);
                                const displayName = numberMatch ? numberMatch[1].padStart(2, "0") : rawName || "1";
                                return (
                                    <Link key={ep.slug} href={`/xem-phim/${slug}/${ep.slug}?server=${activeServer}`} className="h-[36px] sm:h-[40px] rounded-lg text-[12px] sm:text-[13px] font-semibold flex items-center justify-center transition-all duration-200 border bg-white/[0.04] border-white/[0.08] text-gray-300 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.16] active:scale-95 shadow-sm touch-manipulation px-1.5" title={rawName}>
                                        <span className="truncate">{displayName}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    {!episodes?.length && <div className="text-center py-8 text-gray-400 text-sm">Phim đang được cập nhật tập mới.</div>}
                </div>
            )}

            {activeTab === "trailer" && (
                <div className="bg-[#07070b]/78 border border-white/[0.05] rounded-[10px] p-4 sm:p-5 space-y-4 shadow-[0_10px_26px_#00000055]">
                    <div className="aspect-video w-full rounded-lg overflow-hidden bg-[#0A0A0E] border border-white/[0.08] shadow-[0_10px_24px_#00000066]">
                        {activeVideo ? (
                            <iframe key={activeVideo.key} src={`https://www.youtube.com/embed/${activeVideo.key}?autoplay=0&rel=0&modestbranding=1`} className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" title={activeVideo.name} />
                        ) : movie.trailer_url && movie.trailer_url.includes("youtube") ? (
                            <iframe src={movie.trailer_url.replace("watch?v=", "embed/")} className="w-full h-full" allowFullScreen title="Trailer" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-[#71717A] gap-3">
                                <Video className="w-14 h-14 opacity-15" />
                                <p className="text-sm font-medium">Trailer đang được cập nhật</p>
                                <p className="text-xs text-gray-600">Quay lại sau khi có thêm thông tin từ nhà phát hành</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === "related" && (
                <div className="bg-[#07070b]/78 border border-white/[0.05] rounded-[10px] p-5 shadow-[0_10px_26px_#00000055]">
                    {relatedMovies.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 [contain:layout_paint]">
                            {relatedMovies.map((item) => <MovieCard key={item._id} movie={item} />)}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400 text-sm">Chưa có phim đề xuất.</div>
                    )}
                </div>
            )}

            {activeTab === "cast" && cast && (
                <div className="bg-[#07070b]/78 border border-white/[0.05] rounded-[10px] p-4 sm:p-6 shadow-[0_10px_26px_#00000055]">
                    {cast}
                </div>
            )}
        </div>
    );
}
