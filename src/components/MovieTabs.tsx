"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { PlayCircle, Video, LayoutGrid, ChevronDown, Database, Subtitles, Mic, Volume2 } from "lucide-react";
import { Movie } from "@/services/api";
import MovieCard from "./MovieCard";
import { cn } from "@/lib/utils";

interface Server {
    server_name: string;
    server_data: any[];
}

interface MovieTabsProps {
    movie: any;
    relatedMovies: any[];
    episodes: { server_name: string; server_data: any[] }[];
    slug: string;
}

const EPISODES_PER_CHUNK = 50;

export default function MovieTabs({ movie, relatedMovies, episodes, slug }: MovieTabsProps) {
    const defaultTab = (episodes && episodes.length > 0) ? "episodes" : "related";
    const [activeTab, setActiveTab] = useState<"episodes" | "trailer" | "related">(defaultTab);
    const [activeServer, setActiveServer] = useState(0);
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
        (episodes || [])
            .filter(s => s.server_data && s.server_data.length > 0) // only non-empty servers
            .forEach(s => {
                groups[getLanguageGroup(s.server_name)].push(s as any);
            });
        return groups;
    }, [episodes]);

    const activeLanguageGroups = Object.keys(groupedServers).filter(k => groupedServers[k].length > 0);

    // Default to the first valid language tab if none selected
    useEffect(() => {
        if (!activeLangTab && activeLanguageGroups.length > 0) {
            setActiveLangTab(activeLanguageGroups[0]);
        }
    }, [activeLangTab, activeLanguageGroups]);

    // Handle mapping the "Global activeServer index" from the filtered Sub-list index.
    const activeServerData = episodes?.[activeServer];

    // Ensure activeServer exists in current LangTab. If not, auto switch to 1st item in LangTab.
    useEffect(() => {
        if (activeLanguageGroups.length > 0 && activeLangTab && groupedServers[activeLangTab].length > 0) {
            const currentTabServers = groupedServers[activeLangTab];
            const isCurrentActiveInTab = currentTabServers.some(s => s.server_name === episodes[activeServer]?.server_name);

            if (!isCurrentActiveInTab) {
                // Find global index of the first server in this new tab
                const firstServerInTab = currentTabServers[0];
                const newGlobalIndex = episodes.findIndex(s => s.server_name === firstServerInTab.server_name);
                if (newGlobalIndex !== -1) {
                    setActiveServer(newGlobalIndex);
                    setCurrentChunk(0);
                }
            }
        }
    }, [activeLangTab, activeServer, episodes, groupedServers, activeLanguageGroups.length]);

    const tabs = [
        { id: "episodes", label: "DANH SÁCH TẬP", icon: PlayCircle },
        { id: "related", label: "ĐỀ XUẤT", icon: LayoutGrid },
        { id: "trailer", label: "TRAILER", icon: Video },
    ];

    const currentServerData = episodes?.[activeServer]?.server_data || [];
    const totalChunks = Math.ceil(currentServerData.length / EPISODES_PER_CHUNK);
    const paginatedEpisodes = currentServerData.slice(currentChunk * EPISODES_PER_CHUNK, (currentChunk + 1) * EPISODES_PER_CHUNK);

    // Reset chunk when server changes
    useEffect(() => {
        setCurrentChunk(0);
    }, [activeServer]);

    return (
        <div className="w-full">
            {/* Tab Navigation - Minimalist */}
            <div className="flex items-center gap-8 border-b border-white/[0.04] mb-6 overflow-x-auto no-scrollbar pb-1">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 pb-3 text-sm font-bold transition-all relative whitespace-nowrap ${isActive ? "text-[#F4C84A]" : "text-gray-400 hover:text-white"
                                }`}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? "text-[#F4C84A]" : "hidden"}`} />
                            {tab.label}
                            {isActive && (
                                <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#F4C84A] shadow-[0_0_10px_#F4C84A]" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content - Dark Pill UI */}
            <div className="animate-in fade-in duration-300">
                {/* EPISODES TAB */}
                {activeTab === "episodes" && (
                    <div className="bg-[#08090C] border border-white/[0.05] rounded-[24px] p-3 sm:p-6 shadow-2xl">
                        {episodes && episodes.length > 0 ? (
                            <div className="space-y-6">
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
                                                        const firstServerInGroupIdx = episodes.findIndex(s => s.server_name === firstServerInGroup.server_name);
                                                        if (firstServerInGroupIdx !== -1) {
                                                            setActiveServer(firstServerInGroupIdx);
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

                                {/* Servers Row - compact inline */}
                                <div className="flex flex-row items-center gap-2 sm:gap-3 border-b border-white/[0.05] pb-3 sm:pb-5 flex-wrap">
                                    <div className="flex items-center gap-1.5 text-gray-500 text-[11px] sm:text-[12px] font-bold uppercase tracking-widest shrink-0">
                                        <Database className="w-[13px] h-[13px] sm:w-[15px] sm:h-[15px] text-gray-600" strokeWidth={2.5} />
                                        Máy Chủ:
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {activeLangTab && groupedServers[activeLangTab]?.map((server, indexInTab) => {
                                            const globalIndex = episodes.findIndex(e => e.server_name === server.server_name);
                                            const isActive = activeServer === globalIndex;

                                            const displayName = server.server_name.split("##")[0]
                                                .replace("Lồng Tiếng", "").replace("lồng tiếng", "").replace("longtieng", "")
                                                .replace("Thuyết Minh", "").replace("thuyết minh", "").replace("thuyetminh", "")
                                                .replace("Vietsub", "").replace("vietsub", "")
                                                .replace(/\(\)/g, "").replace(/\[\]/g, "").replace(/--/g, "-").trim()
                                                || server.server_name.split("##")[0].trim();

                                            return (
                                                <button
                                                    key={globalIndex}
                                                    onClick={() => {
                                                        setActiveServer(globalIndex);
                                                        setCurrentChunk(0);
                                                    }}
                                                    className={cn(
                                                        "h-[32px] sm:h-[38px] px-3 sm:px-5 rounded-full text-[12px] sm:text-[13px] font-bold transition-all duration-300 border flex items-center gap-2 shadow-sm",
                                                        isActive
                                                            ? "bg-[#F4C84A] border-[#F4C84A] text-[#08090C] shadow-[0_4px_14px_rgba(244,200,74,0.25)] scale-105 transform"
                                                            : "bg-white/[0.03] border-white/[0.08] text-[#A1A1AA] hover:text-white hover:border-white/[0.15] hover:bg-white/[0.06] active:scale-95"
                                                    )}
                                                >
                                                    <span className="truncate max-w-[150px]">{displayName}</span>
                                                    {isActive ? (
                                                        <>
                                                            <span className="w-[2px] h-3.5 bg-black/20 rounded-full" />
                                                            <span className="font-extrabold">{server.server_data.length}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="w-[2px] h-3.5 bg-white/10 rounded-full" />
                                                            <span className="font-semibold text-gray-500">#{indexInTab + 1}</span>
                                                        </>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Pagination Header */}
                                {totalChunks > 1 && (
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-bold text-gray-300">
                                            Danh sách tập <span className="text-[#F4C84A]">({currentServerData.length})</span>
                                        </div>
                                        <div className="relative">
                                            <select
                                                value={currentChunk}
                                                onChange={(e) => setCurrentChunk(Number(e.target.value))}
                                                className="appearance-none bg-[#111113] border border-white/[0.05] text-white text-sm font-medium py-2 px-4 pr-10 rounded-lg outline-none focus:border-[#F4C84A]/50 transition-colors cursor-pointer"
                                            >
                                                {Array.from({ length: totalChunks }).map((_, idx) => {
                                                    const start = idx * EPISODES_PER_CHUNK + 1;
                                                    const end = Math.min((idx + 1) * EPISODES_PER_CHUNK, currentServerData.length);
                                                    return (
                                                        <option key={idx} value={idx}>
                                                            Tập {start} - {end}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>
                                    </div>
                                )}

                                {/* Episode Grid */}
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                                    {paginatedEpisodes.map((ep: any) => {
                                        let displayName = ep.name;
                                        const match = ep.name.match(/Tập\s+(\d+)/i);
                                        if (match) {
                                            displayName = match[1].padStart(2, '0');
                                        } else if (/^\d+$/.test(ep.name)) {
                                            displayName = ep.name.padStart(2, '0');
                                        }

                                        return (
                                            <Link
                                                key={ep.slug}
                                                href={`/xem-phim/${slug}/${ep.slug}`}
                                                className="h-[44px] rounded-[14px] text-[14px] font-semibold flex items-center justify-center gap-2.5 transition-all duration-300 border bg-white/[0.03] border-white/[0.06] backdrop-blur-md text-[#A1A1AA] hover:text-[#E4E4E5] hover:bg-white/[0.08] hover:border-white/[0.12] hover:-translate-y-[1px] active:scale-95 px-2 truncate shadow-sm touch-manipulation"
                                                title={ep.name}
                                            >
                                                <PlayCircle className="w-[15px] h-[15px] text-gray-400/70 shrink-0" strokeWidth={2.5} />
                                                <span>Tập {displayName}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                Phim đang được cập nhật tập mới.
                            </div>
                        )}
                    </div>
                )}

                {/* TRAILER TAB */}
                {activeTab === "trailer" && (
                    <div className="bg-[#0B0E14] border border-white/[0.04] rounded-2xl p-6">
                        <div className="aspect-video w-full rounded-xl overflow-hidden bg-[#111113] border border-white/[0.04] shadow-2xl">
                            {movie.trailer_url && movie.trailer_url.includes("youtube") ? (
                                <iframe
                                    src={movie.trailer_url.replace("watch?v=", "embed/")}
                                    className="w-full h-full"
                                    allowFullScreen
                                    title="Trailer"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-[#71717A] gap-2">
                                    <Video className="w-12 h-12 opacity-20" />
                                    <p className="text-sm">Trailer đang được cập nhật</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* RELATED TAB */}
                {activeTab === "related" && (
                    <div className="bg-[#0B0E14] border border-white/[0.04] rounded-2xl p-6">
                        {relatedMovies.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 [contain:layout_paint]">
                                {relatedMovies.map((m) => (
                                    <MovieCard key={m._id} movie={m} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400 text-sm">Chưa có phim đề xuất.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

