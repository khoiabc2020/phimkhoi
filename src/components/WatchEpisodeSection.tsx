"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronDown, List, Play, ChevronLeft } from "lucide-react";
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

                {/* Server selector (Pill Design) */}
                <div className="flex flex-col items-center mb-10">
                    <div className="inline-flex items-center p-1 rounded-full bg-[#111113] border border-white/[0.04]">
                        {servers.length > 0 ? (
                            servers.map((s, i) => {
                                const isServerActive = s.server_name === activeServerName;
                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => onServerChange(s.server_name)}
                                        className={cn(
                                            "px-5 py-2 rounded-full text-[13px] font-bold transition-all duration-300",
                                            isServerActive
                                                ? "bg-[#1A1D24] text-[#E4E4E5] shadow-sm border border-white/[0.04]" // Darker active pill
                                                : "bg-transparent text-[#71717A] hover:text-white"
                                        )}
                                    >
                                        {s.server_name}
                                    </button>
                                );
                            })
                        ) : (
                            <button className="px-5 py-2 rounded-full text-[13px] font-bold bg-[#1A1D24] text-[#E4E4E5] shadow-sm border border-white/[0.04]">
                                {serverName}
                            </button>
                        )}
                    </div>
                </div>

                {/* Toggle Collapse */}
                <div className="flex items-center gap-3 mb-6">
                    <span className="text-[13px] text-gray-400 font-medium">Hiện ảnh</span>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={!isCollapsed}
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={cn(
                            "w-10 h-6 rounded-full transition-colors relative border border-white/10",
                            isCollapsed ? "bg-white/10" : "bg-white/30" // Active looks whitish
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

                {/* Subtitle count */}
                <div className="text-[13px] text-[#71717A] mb-4">
                    Danh sách tập ( <span className="text-white font-bold">{episodes.length}</span> / <span className="text-[#F4C84A] font-bold">{episodes.length}</span> )
                </div>

                {/* Episode grid */}
                {!isCollapsed && (
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-3 [contain:layout_paint]">
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
                                        "h-[42px] rounded-xl flex items-center justify-center text-[15px] font-bold transition-all border",
                                        isActive
                                            ? "bg-[#F4C84A] border-[#F4C84A] text-[#111113] shadow-none scale-100"
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
