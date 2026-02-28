"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PlayCircle, Film, Users, Video, LayoutGrid, ChevronDown } from "lucide-react";
import { Movie } from "@/services/api";
import MovieCard from "./MovieCard";
import { getImageUrl } from "@/lib/utils";

interface MovieTabsProps {
    movie: any;
    relatedMovies: any[];
    episodes: { server_name: string; server_data: any[] }[];
    slug: string;
}

export default function MovieTabs({ movie, relatedMovies, episodes, slug }: MovieTabsProps) {
    const [activeTab, setActiveTab] = useState<"overview" | "episodes" | "trailer" | "related">("overview");
    const [activeServer, setActiveServer] = useState(0);

    const tabs = [
        { id: "overview", label: "Tổng Quan", icon: Film },
        { id: "episodes", label: "Tập Phim", icon: PlayCircle },
        { id: "trailer", label: "Trailer", icon: Video },
        { id: "related", label: "Đề Xuất", icon: LayoutGrid },
    ];

    const currentServerData = episodes?.[activeServer]?.server_data || [];

    return (
        <div className="mt-8">
            {/* Tab Navigation - Minimalist (Reference Image Style) */}
            <div className="flex items-center gap-8 border-b border-white/[0.04] mb-6 overflow-x-auto no-scrollbar px-2">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 pb-4 text-[15px] font-bold transition-all relative whitespace-nowrap ${isActive ? "text-[#F4C84A]" : "text-gray-400 hover:text-white"
                                }`}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? "stroke-[#F4C84A]" : "hidden"}`} />
                            {tab.label}
                            {isActive && (
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F4C84A] rounded-t-full" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content - Dark Pill UI */}
            <div className="animate-in fade-in slide-in-from-bottom-5 duration-300">
                {/* OVERVIEW TAB */}
                {activeTab === "overview" && (
                    <div className="space-y-6">
                        <div className="bg-[#18181A] border border-white/[0.04] rounded-3xl p-6 md:p-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6 border-b border-white/[0.04] pb-6">
                                <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-3">
                                    <Film className="w-5 h-5 text-[#F4C84A]" />
                                    Nội dung phim
                                </h3>

                                {/* Director - Integrated */}
                                <div className="flex items-center gap-3 bg-black/20 px-5 py-2.5 rounded-full border border-white/5 backdrop-blur-sm">
                                    <span className="text-gray-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                        <Users className="w-4 h-4" /> Đạo diễn:
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {movie.director && movie.director.length > 0 ? (
                                            movie.director.map((d: any, idx: number) => (
                                                <span key={idx} className="text-sm text-gray-200 font-bold hover:text-yellow-500 cursor-pointer transition-colors">
                                                    {d}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-gray-500 italic text-sm">Đang cập nhật</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div
                                className="text-gray-300 leading-relaxed font-light text-base md:text-lg text-justify tracking-wide"
                                dangerouslySetInnerHTML={{ __html: movie.content }}
                            />
                        </div>
                    </div>
                )}

                {/* EPISODES TAB */}
                {activeTab === "episodes" && (
                    <div className="bg-[#18181A] border border-white/[0.04] rounded-3xl p-6">
                        {episodes && episodes.length > 0 ? (
                            <>
                                <div className="flex flex-col items-center mb-6">
                                    <div className="inline-flex items-center gap-1 p-1 rounded-full bg-[#111113] border border-white/[0.04]">
                                        {episodes.map((server, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setActiveServer(index)}
                                                className={`px-6 py-2.5 rounded-full text-[15px] font-semibold transition-all duration-300 ${activeServer === index
                                                    ? "bg-[#28282B] text-white shadow-sm"
                                                    : "bg-transparent text-[#71717A] hover:text-white"
                                                    }`}
                                            >
                                                {server.server_name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar [contain:layout_paint]">
                                    {currentServerData.map((ep: any) => {
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
                                                className="h-12 rounded-2xl flex items-center justify-center text-[15px] font-bold transition-all border bg-[#111113] border-white/[0.05] text-white hover:bg-[#1C1C1E] hover:border-white/10"
                                            >
                                                {displayName}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8 text-gray-400 text-[15px]">
                                Phim đang được cập nhật tập mới.
                            </div>
                        )}
                    </div>
                )}

                {/* TRAILER TAB */}
                {activeTab === "trailer" && (
                    <div className="bg-[#18181A] border border-white/[0.04] rounded-3xl p-6">
                        <div className="aspect-video w-full rounded-2xl overflow-hidden bg-[#111113] border border-white/[0.04] shadow-2xl">
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
                                    <p className="text-[15px]">Trailer đang được cập nhật</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* RELATED TAB */}
                {activeTab === "related" && (
                    <div className="bg-[#18181A] border border-white/[0.04] rounded-3xl p-6">
                        {relatedMovies.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 [contain:layout_paint]">
                                {relatedMovies.map((m) => (
                                    <MovieCard key={m._id} movie={m} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400 text-[15px]">Chưa có phim đề xuất.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

