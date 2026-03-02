"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ChevronDown, List, ChevronLeft, Database, Mic, Subtitles, Volume2, PlayCircle, Play } from "lucide-react";
import { cn } from "@/lib/utils";

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
    currentEpisodeSlug: string;
    activeServerName: string;
    onServerChange: (serverName: string) => void;
}

export default function WatchEpisodeSection({
    movieSlug,
    movieName,
    servers,
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

    return (
        <div className="bg-[#08090C] rounded-[24px] border border-white/[0.05] overflow-hidden mb-6 sm:mb-8 mt-4 mx-3 sm:mx-4 md:mx-0 shadow-2xl">
            {/* Header: DANH SÁCH TẬP */}
            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 sm:py-5 border-b border-white/[0.05] bg-white/[0.01]">
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
                    <div className="flex items-center gap-3 sm:gap-6 border-b border-white/[0.04] mb-3 sm:mb-5 overflow-x-auto no-scrollbar pb-1">
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
                                        isActive ? "text-[#F4C84A]" : "text-gray-500 hover:text-gray-300"
                                    )}
                                >
                                    <Icon className={cn("w-[14px] h-[14px] sm:w-[16px] sm:h-[16px]", isActive ? "text-[#F4C84A]" : "text-gray-500")} />
                                    {lang}
                                    {isActive && (
                                        <span className="absolute bottom-[-1px] left-0 right-0 h-[3px] rounded-t-full bg-[#F4C84A] shadow-[0_0_12px_rgba(244,200,74,0.6)]" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Server selector - compact inline on all sizes */}
                <div className="flex flex-row items-center gap-2 sm:gap-3 mb-3 sm:mb-6 flex-wrap">
                    <div className="flex items-center gap-1.5 text-gray-500 text-[11px] sm:text-[12px] font-bold uppercase tracking-widest shrink-0">
                        <Database className="w-[13px] h-[13px] sm:w-[15px] sm:h-[15px] text-gray-600" strokeWidth={2.5} />
                        Máy Chủ:
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {activeLangTab && groupedServers[activeLangTab]?.length > 0 ? (
                            groupedServers[activeLangTab].map((s, i) => {
                                const isServerActive = s.server_name === activeServerName;

                                // Clean up server name for display
                                const displayName = s.server_name.split("##")[0]
                                    .replace("Lồng Tiếng", "").replace("lồng tiếng", "").replace("longtieng", "")
                                    .replace("Thuyết Minh", "").replace("thuyết minh", "").replace("thuyetminh", "")
                                    .replace("Vietsub", "").replace("vietsub", "")
                                    .replace(/\(\)/g, "").replace(/\[\]/g, "").replace(/--/g, "-").trim()
                                    || s.server_name.split("##")[0].trim();

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
                                                ? "bg-[#F4C84A] border-[#F4C84A] text-[#08090C] shadow-[0_4px_14px_rgba(244,200,74,0.25)] scale-105 transform"
                                                : "bg-white/[0.03] border-white/[0.08] text-[#A1A1AA] hover:text-white hover:border-white/[0.15] hover:bg-white/[0.06] active:scale-95"
                                        )}
                                    >
                                        <span className="truncate max-w-[120px] sm:max-w-[150px]">{displayName}</span>
                                        <span className={cn("w-[2px] h-3 rounded-full", isServerActive ? "bg-black/20" : "bg-white/10")} />
                                        <span className={cn("font-bold", isServerActive ? "" : "text-gray-500")}>{s.server_data.length}</span>
                                    </button>
                                );
                            })
                        ) : (
                            <button className="h-[32px] sm:h-[38px] px-3 sm:px-5 rounded-full text-[12px] sm:text-[13px] font-bold bg-white/[0.03] border border-white/[0.08] text-[#A1A1AA] shadow-sm flex items-center justify-center gap-2">
                                {serverName}
                                <span className="w-[2px] h-3 bg-white/10 rounded-full" />
                                <span className="font-semibold text-gray-500">{episodes.length}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Subtitle count & Pagination Controls Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                        {/* Subtitle count */}
                        <div className="text-[13px] sm:text-[14px] text-gray-400">
                            Danh sách tập ( <span className="text-[#E4E4E5] font-bold">{episodes.length}</span> / <span className="text-[#F4C84A] font-bold">{episodes.length}</span> )
                        </div>

                        {/* Pagination Dropdown */}
                        {episodes.length > EPISODES_PER_CHUNK && (
                            <div className="relative">
                                <select
                                    className="appearance-none bg-[#111319] border border-white/[0.08] text-[#E4E4E5] font-semibold text-[13px] rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:border-[#F4C84A]/50 transition-colors cursor-pointer shadow-sm"
                                    value={currentChunk}
                                    onChange={(e) => setCurrentChunk(Number(e.target.value))}
                                >
                                    {Array.from({ length: Math.ceil(episodes.length / EPISODES_PER_CHUNK) }).map((_, i) => {
                                        const start = i * EPISODES_PER_CHUNK + 1;
                                        const end = Math.min((i + 1) * EPISODES_PER_CHUNK, episodes.length);
                                        return (
                                            <option key={i} value={i} className="bg-[#1A1D24] text-white">
                                                Tập {start} - {end}
                                            </option>
                                        );
                                    })}
                                </select>
                                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        )}
                    </div>

                    {/* Toggle Collapse */}
                    <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[12px] sm:text-[13px] text-gray-400 font-medium">Hiện ảnh</span>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={!isCollapsed}
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className={cn(
                                "w-10 h-6 rounded-full transition-colors relative border border-white/10",
                                isCollapsed ? "bg-white/10" : "bg-white/30"
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
                {!isCollapsed && (
                    <div className="grid grid-cols-3 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3 max-h-[420px] sm:max-h-[500px] overflow-y-auto custom-scrollbar pr-1 sm:pr-3 [contain:layout_paint]">
                        {episodes.slice(currentChunk * EPISODES_PER_CHUNK, (currentChunk + 1) * EPISODES_PER_CHUNK).map((ep) => {
                            const isActive = ep.slug === currentEpisodeSlug;

                            // Extract just the number if it's "Tập X" for a cleaner look
                            const match = ep.name.match(/Tập\s+(\d+)/i);
                            const displayNum = match ? match[1].padStart(2, '0') : (/^\d+$/.test(ep.name) ? ep.name.padStart(2, '0') : ep.name);

                            return (
                                <Link
                                    key={ep.slug}
                                    href={`/xem-phim/${movieSlug}/${ep.slug}?server=${safeIndex}`}
                                    className={cn(
                                        "h-[44px] rounded-[14px] flex items-center justify-center gap-2.5 text-[14px] font-semibold transition-all duration-300 border backdrop-blur-md touch-manipulation",
                                        isActive
                                            ? "bg-[#F4C84A]/[0.12] border-[#F4C84A]/50 text-[#F4C84A] shadow-[0_4px_20px_rgba(244,200,74,0.1)] scale-100"
                                            : "bg-white/[0.03] border-white/[0.06] text-[#A1A1AA] hover:text-[#E4E4E5] hover:bg-white/[0.08] hover:border-white/[0.12] hover:-translate-y-[1px] active:scale-95"
                                    )}
                                >
                                    <PlayCircle className={isActive ? "w-[15px] h-[15px] text-[#F4C84A]" : "w-[15px] h-[15px] text-gray-400/70"} strokeWidth={2.5} />
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
