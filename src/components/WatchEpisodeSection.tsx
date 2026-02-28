"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronDown, List, Play } from "lucide-react";
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
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Find active server index based on name
    const activeServerIndex = servers.findIndex(s => s.server_name === activeServerName);
    const safeIndex = activeServerIndex !== -1 ? activeServerIndex : 0;
    const episodes = servers[safeIndex]?.server_data || [];

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
        <div className="bg-[#0d0d0d] border-b border-white/5">
            {/* Header: Xem phim [title] with back */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                <Link
                    href={`/phim/${movieSlug}`}
                    className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors -ml-1"
                    aria-label="Quay lại"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <span className="text-sm font-medium text-white truncate flex-1">Xem phim {movieName}</span>
            </div>

            {/* Server selector (Horizontal Buttons) & Subtitle */}
            <div className="px-4 py-4 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Servers List */}
                    <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                            </svg>
                            MÁY CHỦ:
                        </span>

                        <div className="flex items-center gap-2">
                            {servers.length > 0 ? (
                                servers.map((s, i) => {
                                    const isServerActive = s.server_name === activeServerName;
                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => onServerChange(s.server_name)}
                                            className={cn(
                                                "px-3 py-1.5 rounded text-xs whitespace-nowrap transition-all border",
                                                isServerActive
                                                    ? "bg-[#F4C84A] text-black border-[#F4C84A] shadow-[0_0_12px_rgba(244,200,74,0.4)] font-extrabold"
                                                    : "bg-[#1a1a1a] text-gray-400 border-white/10 hover:bg-[#2a2a2a] hover:text-white font-medium"
                                            )}
                                        >
                                            {s.server_name}
                                        </button>
                                    );
                                })
                            ) : (
                                <button className="px-3 py-1.5 rounded text-xs font-extrabold bg-[#F4C84A] text-black border border-[#F4C84A] shadow-[0_0_12px_rgba(244,200,74,0.4)]">
                                    {serverName}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Toggle Collapse */}
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-gray-400">Hiện ảnh</span>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={!isCollapsed}
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className={cn(
                                "w-9 h-5 rounded-full transition-colors relative",
                                isCollapsed ? "bg-white/10" : "bg-gray-400"
                            )}
                        >
                            <span
                                className={cn(
                                    "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all",
                                    isCollapsed ? "left-0.5" : "left-4.5 translate-x-1"
                                )}
                            />
                        </button>
                    </div>
                </div>

                {/* Subtitle count */}
                <div className="text-sm text-gray-400">
                    Danh sách tập ( <span className="text-white font-medium">{episodes.length}</span> / <span className="text-[#F4C84A] font-bold">{episodes.length}</span> )
                </div>
            </div>

            {/* Episode grid */}
            {!isCollapsed && (
                <div className="p-4 pt-0">
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2 [contain:layout_paint]">
                        {episodes.map((ep) => {
                            const isActive = ep.slug === currentEpisodeSlug;
                            return (
                                <Link
                                    key={ep.slug}
                                    href={`/xem-phim/${movieSlug}/${ep.slug}?server=${safeIndex}`}
                                    className={cn(
                                        "h-11 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all border",
                                        isActive
                                            ? "bg-[#1a1a1a] border-[#F4C84A] text-[#F4C84A] shadow-[0_0_10px_rgba(244,200,74,0.1)]"
                                            : "bg-[#1a1a1a] border-transparent text-gray-300 hover:bg-[#2a2a2a] hover:text-white"
                                    )}
                                >
                                    <Play className={cn("w-3.5 h-3.5", isActive ? "fill-current text-[#F4C84A]" : "text-gray-500")} />
                                    {ep.name.replace("Tập ", "")}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
