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

            {/* Server selector (Pill Design) */}
            <div className="px-4 py-6 space-y-6">
                <div className="flex flex-col items-center">
                    {/* Servers List - Sleek Pill Container */}
                    <div className="inline-flex items-center gap-1 p-1 rounded-full bg-[#18181A] border border-white/[0.04]">
                        {servers.length > 0 ? (
                            servers.map((s, i) => {
                                const isServerActive = s.server_name === activeServerName;
                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => onServerChange(s.server_name)}
                                        className={cn(
                                            "px-6 py-2.5 rounded-full text-[15px] font-semibold transition-all duration-300",
                                            isServerActive
                                                ? "bg-[#28282B] text-white shadow-sm"
                                                : "bg-transparent text-[#71717A] hover:text-white"
                                        )}
                                    >
                                        {s.server_name}
                                    </button>
                                );
                            })
                        ) : (
                            <button className="px-6 py-2.5 rounded-full text-[15px] font-semibold bg-[#28282B] text-white shadow-sm">
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
            {/* Episode grid */}
            {!isCollapsed && (
                <div className="p-4 pt-0">
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2 [contain:layout_paint]">
                        {episodes.map((ep) => {
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
                                        "h-12 rounded-2xl flex items-center justify-center text-[15px] font-bold transition-all border",
                                        isActive
                                            ? "bg-[#F4C84A] border-[#F4C84A] text-black shadow-none scale-105"
                                            : "bg-[#111113] border-white/[0.05] text-white hover:bg-[#1C1C1E] hover:border-white/10"
                                    )}
                                >
                                    {displayName}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
