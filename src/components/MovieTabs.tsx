"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PlayCircle, Film, Users, Video, LayoutGrid, ChevronDown, Database } from "lucide-react";
import { Movie } from "@/services/api";
import MovieCard from "./MovieCard";

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
                            className={`flex items-center gap-2 pb-3 text-sm font-bold transition-all relative whitespace-nowrap ${isActive ? "text-[#00B14F]" : "text-gray-400 hover:text-white"
                                }`}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? "text-[#00B14F]" : "hidden"}`} />
                            {tab.label}
                            {isActive && (
                                <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#00B14F] shadow-[0_0_10px_#00B14F]" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content - Dark Pill UI */}
            <div className="animate-in fade-in duration-300">
                {/* EPISODES TAB */}
                {activeTab === "episodes" && (
                    <div className="bg-[#0B0E14] border border-white/[0.04] rounded-2xl p-6">
                        {episodes && episodes.length > 0 ? (
                            <div className="space-y-6">
                                {/* Servers Row */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-white/[0.04] pb-6">
                                    <div className="flex items-center gap-2 text-gray-400 text-sm font-bold shrink-0">
                                        <Database className="w-4 h-4" />
                                        MÁY CHỦ :
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {episodes.map((server, index) => {
                                            const isActive = activeServer === index;
                                            return (
                                                <button
                                                    key={index}
                                                    onClick={() => setActiveServer(index)}
                                                    className={`px-4 py-2 rounded text-sm font-bold transition-all flex items-center gap-2 ${isActive
                                                        ? "bg-[#00B14F] text-white shadow-lg"
                                                        : "bg-[#111113] border border-white/5 text-gray-400 hover:text-white hover:border-white/20"
                                                        }`}
                                                >
                                                    {server.server_name}
                                                    {isActive && (
                                                        <>
                                                            <span className="w-[1px] h-3 bg-white/30" />
                                                            <span>{currentServerData.length}</span>
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
                                            Danh sách tập <span className="text-[#00B14F]">({currentServerData.length})</span>
                                        </div>
                                        <div className="relative">
                                            <select
                                                value={currentChunk}
                                                onChange={(e) => setCurrentChunk(Number(e.target.value))}
                                                className="appearance-none bg-[#111113] border border-white/[0.05] text-white text-sm font-medium py-2 px-4 pr-10 rounded-lg outline-none focus:border-[#00B14F]/50 transition-colors cursor-pointer"
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
                                                className="h-10 rounded text-sm font-bold flex items-center justify-center transition-all border bg-[#111113] border-white/5 text-gray-300 hover:text-white hover:border-[#00B14F] hover:bg-[#00B14F]/10 px-2 truncate"
                                                title={ep.name}
                                            >
                                                <PlayCircle className="w-3 h-3 mr-1 opacity-50 shrink-0" />
                                                Tập {displayName}
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

