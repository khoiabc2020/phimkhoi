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

            {/* Server selector + Rút gọn */}
            <div className="flex items-center justify-between px-4 py-3 gap-3">
                {servers.length > 1 ? (
                    <div className="relative" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => setShowServerDropdown(!showServerDropdown)}
                            className="flex items-center gap-1.5 text-white text-sm font-medium py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            Server {safeIndex + 1}
                            <ChevronDown className={cn("w-4 h-4 transition-transform", showServerDropdown && "rotate-180")} />
                        </button>
                        {showServerDropdown && (
                            <div className="absolute top-full left-0 mt-1 py-1 bg-[#1a1a1a] rounded-lg border border-white/10 shadow-xl z-20 min-w-[120px]">
                                {servers.map((s, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => {
                                            onServerChange(s.server_name);
                                            setShowServerDropdown(false);
                                        }}
                                        className={cn(
                                            "w-full text-left px-4 py-2 text-sm transition-colors",
                                            s.server_name === activeServerName ? "bg-[#fbbf24]/20 text-[#fbbf24]" : "text-gray-300 hover:bg-white/5"
                                        )}
                                    >
                                        {s.server_name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <List className="w-4 h-4 text-[#fbbf24]" />
                        <span>#{serverName}</span>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Rút gọn</span>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={!isCollapsed}
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={cn(
                            "w-11 h-6 rounded-full transition-colors relative",
                            isCollapsed ? "bg-white/10" : "bg-[#fbbf24]"
                        )}
                    >
                        <span
                            className={cn(
                                "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all",
                                isCollapsed ? "left-1" : "left-6"
                            )}
                        />
                    </button>
                </div>
            </div>

            {/* Episode grid */}
            {!isCollapsed && (
                <div className="p-4 pt-0">
                    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                        {episodes.map((ep) => {
                            const isActive = ep.slug === currentEpisodeSlug;
                            return (
                                <Link
                                    key={ep.slug}
                                    href={`/xem-phim/${movieSlug}/${ep.slug}`}
                                    className={cn(
                                        "h-10 rounded-lg flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold transition-all border",
                                        isActive
                                            ? "bg-[#fbbf24] border-[#fbbf24] text-black shadow-[0_0_15px_rgba(251,191,36,0.3)] scale-105"
                                            : "bg-[#1f2937]/50 border-white/5 text-gray-400 hover:bg-[#1f2937] hover:text-white hover:border-white/10"
                                    )}
                                >
                                    {isActive ? <Play className="w-3 h-3 fill-black" /> : null}
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
