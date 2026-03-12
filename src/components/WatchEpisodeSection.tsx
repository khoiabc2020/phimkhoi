"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ChevronDown, List, ChevronLeft, Database, Mic, Subtitles, Volume2 } from "lucide-react";
import { cn, getImageUrl } from "@/lib/utils";
import { parseServerLabel } from "@/services/api";

interface Episode {
    slug: string;
    name: string;
}

interface Server {
    server_name: string;
    server_data: Episode[];
}

interface WatchEpisodeSectionProps {
    movieSlug: string;
    movieName: string;
    servers: Server[];
    episodeThumbnails?: Record<string, string>;
    episodeMetadata?: Record<string, { title?: string; overview?: string; airDate?: string; runtime?: number; voteAverage?: number }>;
    currentEpisodeSlug: string;
    activeServerName: string;
    onServerChange: (serverName: string) => void;
}

export default function WatchEpisodeSection({
    movieSlug,
    movieName,
    servers,
    episodeThumbnails = {},
    episodeMetadata = {},
    currentEpisodeSlug,
    activeServerName,
    onServerChange,
}: WatchEpisodeSectionProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [currentChunk, setCurrentChunk] = useState(0);
    const [activeLangTab, setActiveLangTab] = useState<string>("");

    // Parse language from server name
    const getLanguageGroup = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes("lồng tiếng") || lower.includes("longtieng")) return "Lồng Tiếng";
        if (lower.includes("thuyết minh") || lower.includes("thuyetminh")) return "Thuyết Minh";
        return "Phụ Đề";
    };

    // Group servers — only include servers that actually have episode data
    const groupedServers = useMemo(() => {
        const groups: Record<string, Server[]> = {
            "Phụ Đề": [],
            "Lồng Tiếng": [],
            "Thuyết Minh": []
        };
        servers
            .filter(s => s.server_data && s.server_data.length > 0) // only non-empty servers
            .forEach(s => {
                groups[getLanguageGroup(s.server_name)].push(s);
            });
        return groups;
    }, [servers]);

    const activeLanguageGroups = Object.keys(groupedServers).filter(k => groupedServers[k].length > 0);

    // Initial load: identify which tab the activeServerName belongs to
    useEffect(() => {
        if (activeServerName) {
            const group = getLanguageGroup(activeServerName);
            setActiveLangTab(group);
        } else if (activeLanguageGroups.length > 0) {
            setActiveLangTab(activeLanguageGroups[0]);
        }
    }, [activeServerName, activeLanguageGroups.length]);

    // Find active server index based on name
    const activeServerIndex = servers.findIndex(s => s.server_name === activeServerName);
    const safeIndex = activeServerIndex !== -1 ? activeServerIndex : 0;
    const episodes = servers[safeIndex]?.server_data || [];

    // Pagination settings
    const EPISODES_PER_CHUNK = 50;

    useEffect(() => {
        if (episodes.length > 0) {
            const activeIdx = episodes.findIndex((ep) => ep.slug === currentEpisodeSlug);
            if (activeIdx !== -1) {
                setCurrentChunk(Math.floor(activeIdx / EPISODES_PER_CHUNK));
            } else {
                setCurrentChunk(0);
            }
        }
    }, [currentEpisodeSlug, episodes]);


    const serverName = activeServerName || servers[0]?.server_name || "VIP";

    const pageEpisodes = episodes.slice(currentChunk * EPISODES_PER_CHUNK, (currentChunk + 1) * EPISODES_PER_CHUNK);
    const getEpisodeNumber = (name: string) => {
        const match = String(name || "").match(/(\d+)/);
        return match ? match[1] : null;
    };

    return (
        <div className="bg-[#020617]/90 rounded-[16px] border border-slate-700/40 overflow-hidden mb-6 sm:mb-8 mt-4 mx-3 sm:mx-4 md:mx-0 shadow-2xl">
            {/* Header: DANH SÁCH TẬP */}
            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-700/40 bg-[#0b1220]/80">
                <div className="flex items-center gap-2">
                    <List className="w-[18px] h-[18px] text-[#F4C84A]" />
                    <h3 className="text-[14px] font-bold text-white uppercase tracking-wider">
                        Danh Sách Tập
                    </h3>
                </div>
            </div>

            <div className="px-3 sm:px-6 pt-3 sm:pt-5 pb-4 sm:pb-8">
                {/* Back Link - compact on mobile */}
                <div className="mb-4 sm:mb-6">
                    <Link
                        href={`/phim/${movieSlug}`}
                        className="inline-flex items-center gap-2 group"
                    >
                        <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1A1D24] border border-white/5 group-hover:bg-[#28282B] flex items-center justify-center text-white transition-colors">
                            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-[-1px]" />
                        </span>
                        <span className="text-[13px] sm:text-[15px] font-bold text-white group-hover:text-[#F4C84A] transition-colors truncate max-w-[240px] sm:max-w-none">
                            {movieName}
                        </span>
                    </Link>
                </div>

                {/* Language Tabs Row */}
                {activeLanguageGroups.length > 0 && (
                    <div className="flex items-center gap-3 sm:gap-6 border-b border-slate-700/35 mb-3 sm:mb-5 overflow-x-auto no-scrollbar pb-1">
                        {activeLanguageGroups.map((lang) => {
                            const isActive = activeLangTab === lang;
                            const Icon = lang === "Lồng Tiếng" ? Mic : lang === "Thuyết Minh" ? Volume2 : Subtitles;

                            return (
                                <button
                                    key={lang}
                                    onClick={() => {
                                        setActiveLangTab(lang);
                                        const firstServerInGroup = groupedServers[lang][0];
                                        if (firstServerInGroup) {
                                            onServerChange(firstServerInGroup.server_name);
                                            setCurrentChunk(0);
                                        }
                                    }}
                                    className={cn(
                                        "flex items-center gap-1.5 sm:gap-2 pb-2 sm:pb-3 text-[12px] sm:text-[14px] font-bold transition-all relative whitespace-nowrap uppercase tracking-wider",
                                        isActive ? "text-[#F4C84A]" : "text-slate-400 hover:text-slate-200"
                                    )}
                                >
                                    <Icon className={cn("w-[14px] h-[14px] sm:w-[16px] sm:h-[16px]", isActive ? "text-[#F4C84A]" : "text-slate-500")} />
                                    {lang}
                                    {isActive && (
                                        <span className="absolute bottom-[-1px] left-0 right-0 h-[3px] rounded-t-full bg-[#F4C84A] shadow-[0_0_12px_#F4C84A99]" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Server selector - compact inline on all sizes */}
                <div className="flex flex-row items-center gap-2 sm:gap-3 mb-3 sm:mb-6 flex-wrap">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] sm:text-[12px] font-bold uppercase tracking-widest shrink-0">
                        <Database className="w-[13px] h-[13px] sm:w-[15px] sm:h-[15px] text-slate-500" strokeWidth={2.5} />
                        Máy Chủ:
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {activeLangTab && groupedServers[activeLangTab]?.length > 0 ? (
                            (() => {
                                const serverCountMap = new Map<string, number>();
                                return groupedServers[activeLangTab].map((s, i) => {
                                    const isServerActive = s.server_name === activeServerName;
                                    const displayName = parseServerLabel(s.server_name, serverCountMap);

                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => {
                                                onServerChange(s.server_name);
                                                setCurrentChunk(0);
                                            }}
                                            className={cn(
                                                "h-[32px] sm:h-[38px] px-3 sm:px-5 rounded-full text-[12px] sm:text-[13px] font-bold transition-all duration-300 border flex items-center justify-center gap-2 shadow-sm",
                                                isServerActive
                                                    ? "bg-[#F4C84A] border-[#F4C84A] text-[#08090C] shadow-[0_4px_14px_#F4C84A40] scale-105 transform"
                                                    : "bg-slate-900/60 border-slate-700/50 text-slate-300 hover:text-white hover:border-slate-500/70 hover:bg-slate-800/70 active:scale-95"
                                            )}
                                        >
                                            <span className="truncate max-w-[120px] sm:max-w-[150px]">{displayName}</span>
                                            <span className={cn("w-[2px] h-3 rounded-full", isServerActive ? "bg-black/20" : "bg-white/10")} />
                                            <span className={cn("font-bold", isServerActive ? "" : "text-gray-500")}>{s.server_data.length}</span>
                                        </button>
                                    );
                                });
                            })()
                        ) : (
                            <button className="h-[32px] sm:h-[38px] px-3 sm:px-5 rounded-full text-[12px] sm:text-[13px] font-bold bg-slate-900/60 border border-slate-700/50 text-slate-300 shadow-sm flex items-center justify-center gap-2">
                                {serverName}
                                <span className="w-[2px] h-3 bg-white/10 rounded-full" />
                                <span className="font-semibold text-slate-400">{episodes.length}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Subtitle count & Pagination Controls Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                        {/* Subtitle count */}
                        <div className="text-[13px] sm:text-[14px] text-slate-300">
                            Danh sách tập ( <span className="text-[#E4E4E5] font-bold">{episodes.length}</span> / <span className="text-[#F4C84A] font-bold">{episodes.length}</span> )
                        </div>

                        {/* Pagination Dropdown */}
                        {episodes.length > EPISODES_PER_CHUNK && (
                            <div className="relative">
                                <select
                                    className="appearance-none bg-[#0b1220] border border-slate-600/60 text-slate-100 font-semibold text-[13px] rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:border-[#F4C84A]/50 transition-colors cursor-pointer shadow-sm"
                                    value={currentChunk}
                                    onChange={(e) => setCurrentChunk(Number(e.target.value))}
                                >
                                    {Array.from({ length: Math.ceil(episodes.length / EPISODES_PER_CHUNK) }).map((_, i) => {
                                        const start = i * EPISODES_PER_CHUNK + 1;
                                        const end = Math.min((i + 1) * EPISODES_PER_CHUNK, episodes.length);
                                        return (
                                            <option key={i} value={i} className="bg-[#0b1220] text-white">
                                                Tập {start} - {end}
                                            </option>
                                        );
                                    })}
                                </select>
                                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                            </div>
                        )}
                    </div>

                    {/* Toggle Collapse */}
                    <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[12px] sm:text-[13px] text-slate-300 font-medium">Hiện ảnh</span>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={!isCollapsed}
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className={cn(
                                "w-10 h-6 rounded-full transition-colors relative border border-white/10",
                                isCollapsed ? "bg-slate-800/90" : "bg-slate-600/90"
                            )}
                        >
                            <span
                                className={cn(
                                    "absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow transition-all",
                                    isCollapsed ? "left-[3px]" : "left-[19px]"
                                )}
                            />
                        </button>
                    </div>
                </div>

                {/* Episode grid */}
                {!isCollapsed ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 max-h-[520px] overflow-y-auto custom-scrollbar pr-1 sm:pr-2 [contain:layout_paint]">
                        {pageEpisodes.map((ep) => {
                            const isActive = ep.slug === currentEpisodeSlug;
                            const displayNum = getEpisodeNumber(ep.name) || ep.name;
                            const thumb = episodeThumbnails?.[ep.slug];
                            const meta = episodeMetadata?.[ep.slug];
                            const episodeTitle = meta?.title || `Tập ${displayNum}`;
                            const episodeOverview = meta?.overview || "";
                            const dateText = meta?.airDate ? new Date(meta.airDate).toLocaleDateString("vi-VN") : "";
                            const runtimeText = meta?.runtime ? `${meta.runtime}m` : "";

                            return (
                                <Link
                                    key={ep.slug}
                                    href={`/xem-phim/${movieSlug}/${ep.slug}?server=${safeIndex}`}
                                    className={cn(
                                        "group rounded-[12px] overflow-hidden border transition-all duration-200 touch-manipulation bg-[#0b1220]",
                                        isActive
                                            ? "border-[#F4C84A]/70 ring-1 ring-[#F4C84A]/45 shadow-[0_0_18px_#F4C84A33]"
                                            : "border-slate-700/45 hover:border-slate-400/60 hover:-translate-y-[1px]"
                                    )}
                                >
                                    <div className="relative aspect-video overflow-hidden">
                                        {thumb ? (
                                            <div
                                                className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.03]"
                                                style={{ backgroundImage: `url(${getImageUrl(thumb)})` }}
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-br from-[#212632] to-[#13161e]" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                        <div className="absolute left-2.5 bottom-2 text-white font-bold text-[16px] drop-shadow-md">
                                            Tập {displayNum}
                                        </div>
                                    </div>

                                    <div className="px-3 py-2.5">
                                        <p className="text-[13px] font-bold text-white line-clamp-1">{episodeTitle}</p>
                                        {episodeOverview && (
                                            <p className="text-[12px] text-slate-300 line-clamp-2 mt-1 leading-relaxed">
                                                {episodeOverview}
                                            </p>
                                        )}
                                        {(dateText || runtimeText) && (
                                            <p className="text-[11px] text-slate-400 mt-1">
                                                {dateText}{dateText && runtimeText ? " · " : ""}{runtimeText}
                                            </p>
                                        )}
                                    </div>

                                    {isActive && (
                                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-[#F4C84A] text-black text-[10px] font-black uppercase shadow-sm">
                                            Đang xem
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3 max-h-[360px] sm:max-h-[440px] overflow-y-auto custom-scrollbar pr-1 sm:pr-2 [contain:layout_paint]">
                        {pageEpisodes.map((ep) => {
                            const isActive = ep.slug === currentEpisodeSlug;
                            const displayNum = getEpisodeNumber(ep.name)?.padStart(2, '0') || ep.name;
                            return (
                                <Link
                                    key={ep.slug}
                                    href={`/xem-phim/${movieSlug}/${ep.slug}?server=${safeIndex}`}
                                    className={cn(
                                        "h-[40px] sm:h-[44px] rounded-[12px] flex items-center justify-center gap-1.5 text-[13px] sm:text-[14px] font-semibold transition-all duration-200 border backdrop-blur-md touch-manipulation",
                                        isActive
                                            ? "bg-[#F4C84A]/[0.15] border-[#F4C84A]/60 text-[#F4C84A] shadow-[0_0_16px_#F4C84A1F]"
                                            : "bg-slate-900/55 border-slate-700/40 text-slate-300 hover:text-slate-100 hover:bg-slate-800/60 hover:border-slate-500/70 hover:-translate-y-[1px] active:scale-95"
                                    )}
                                >
                                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#F4C84A] flex-shrink-0" />}
                                    <span>Tập {displayNum}</span>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
