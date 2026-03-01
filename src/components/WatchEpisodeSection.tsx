"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronDown, List, Play, ChevronLeft, Database } from "lucide-react";
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
    const [showServerDropdown, setShowServerDropdown] = useState(false);
    const [currentChunk, setCurrentChunk] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowServerDropdown(false);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const serverName = activeServerName || servers[0]?.server_name || "VIP";

    return (
        <div className="bg-[#0B0E14] rounded-2xl border border-white/5 overflow-hidden mb-8 mt-4 mx-4 md:mx-0">
            {/* Header: DANH SÁCH TẬP */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
                <List className="w-[18px] h-[18px] text-[#F4C84A]" />
                <h3 className="text-[14px] font-bold text-white uppercase tracking-wider text-shadow-sm">
                    Danh Sách Tập
                </h3>
            </div>

            <div className="px-6 pt-6 pb-8">
                {/* Back Link */}
                <div className="mb-8">
                    <Link
                        href={`/phim/${movieSlug}`}
                        className="inline-flex items-center gap-3 group"
                    >
                        <span className="w-8 h-8 rounded-full bg-[#1A1D24] border border-white/5 group-hover:bg-[#28282B] flex items-center justify-center text-white transition-colors">
                            <ChevronLeft className="w-4 h-4 ml-[-2px]" />
                        </span>
                        <span className="text-[15px] font-bold text-white group-hover:text-[#F4C84A] transition-colors">
                            Xem phim {movieName}
                        </span>
                    </Link>
                </div>

                {/* Server selector Left-Aligned with Database Icon */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8">
                    <div className="flex items-center gap-2 text-gray-400 text-[13px] font-bold uppercase tracking-wider min-w-[100px] shrink-0">
                        <Database className="w-5 h-5 text-gray-500" />
                        Máy Chủ :
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {servers.length > 0 ? (
                            servers.map((s, i) => {
                                const isServerActive = s.server_name === activeServerName;
                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => {
                                            onServerChange(s.server_name);
                                            setCurrentChunk(0);
                                        }}
                                        className={cn(
                                            "h-[38px] px-4 rounded-lg text-[13px] font-bold transition-all duration-300 border flex items-center justify-center gap-2",
                                            isServerActive
                                                ? "bg-[#F4C84A] border-[#F4C84A] text-black shadow-sm" // Matching user's exact preference!
                                                : "bg-[#111113] border-[#111113] text-[#71717A] hover:text-[#E4E4E5] hover:bg-[#1A1D24]"
                                        )}
                                    >
                                        {s.server_name}
                                        {isServerActive && (
                                            <>
                                                <span className="w-[1px] h-3 bg-white/30"></span>
                                                <span>{episodes.length}</span>
                                            </>
                                        )}
                                    </button>
                                );
                            })
                        ) : (
                            <button className="h-[38px] px-4 rounded-lg text-[13px] font-bold bg-[#F4C84A] border-[#F4C84A] text-black shadow-sm flex items-center justify-center gap-2">
                                {serverName}
                                <span className="w-[1px] h-3 bg-white/30"></span>
                                <span>{episodes.length}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Subtitle count & Pagination Controls Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4 flex-wrap">
                        {/* Subtitle count */}
                        <div className="text-[14px] text-gray-400">
                            Danh sách tập ( <span className="text-[#E4E4E5] font-bold">{episodes.length}</span> / <span className="text-[#F4C84A] font-bold">{episodes.length}</span> )
                        </div>

                        {/* Pagination Dropdown */}
                        {episodes.length > EPISODES_PER_CHUNK && (
                            <div className="relative">
                                <select
                                    className="appearance-none bg-[#1A1D24] border border-white/5 text-[#E4E4E5] font-semibold text-[13px] rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:border-[#F4C84A]/50 transition-colors cursor-pointer"
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
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        )}
                    </div>

                    {/* Toggle Collapse */}
                    <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[13px] text-gray-400 font-medium">Hiện ảnh</span>
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
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-3 [contain:layout_paint]">
                        {episodes.slice(currentChunk * EPISODES_PER_CHUNK, (currentChunk + 1) * EPISODES_PER_CHUNK).map((ep) => {
                            const isActive = ep.slug === currentEpisodeSlug;

                            // Extract just the number if it's "Tập X" for a cleaner look
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
                                    href={`/xem-phim/${movieSlug}/${ep.slug}?server=${safeIndex}`}
                                    className={cn(
                                        "h-[42px] rounded-xl flex items-center justify-center text-[15px] font-bold transition-all border",
                                        isActive
                                            ? "bg-[#F4C84A] border-[#F4C84A] text-black shadow-none scale-100" // System yellow
                                            : "bg-[#15151A] border-transparent text-[#E4E4E5] hover:bg-[#1A1D24] hover:border-white/5"
                                    )}
                                >
                                    {displayName}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
