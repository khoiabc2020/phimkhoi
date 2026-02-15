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
            {/* Tab Navigation - Minimalist */}
            <div className="flex items-center gap-6 border-b border-white/10 mb-6 overflow-x-auto no-scrollbar">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 pb-3 text-sm md:text-base font-bold transition-all relative whitespace-nowrap ${isActive ? "text-yellow-500" : "text-gray-400 hover:text-white"
                                }`}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? "stroke-yellow-500" : ""}`} />
                            {tab.label}
                            {isActive && (
                                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-yellow-500 rounded-t-full" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content - Compact */}
            <div className="animate-in fade-in slide-in-from-bottom-5 duration-300">
                {/* OVERVIEW TAB */}
                {activeTab === "overview" && (
                    <div className="space-y-6">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6 border-b border-white/5 pb-6">
                                <h3 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
                                    <Film className="w-6 h-6 text-yellow-500" />
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
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                        {episodes && episodes.length > 0 ? (
                            <>
                                <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-white font-bold text-base">Server:</span>
                                        <div className="flex items-center gap-2">
                                            {episodes.map((server, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setActiveServer(index)}
                                                    className={`px-3 py-1.5 rounded-lg font-bold text-xs shadow-md transition-all ${activeServer === index
                                                        ? "bg-yellow-500 text-black scale-105"
                                                        : "bg-white/10 text-gray-300 hover:bg-white/20"
                                                        }`}
                                                >
                                                    #{server.server_name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <span className="text-gray-400 text-xs font-medium bg-black/20 px-2 py-1 rounded">
                                        {currentServerData.length} tập
                                    </span>
                                </div>
                                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {currentServerData.map((ep: any) => (
                                        <Link
                                            key={ep.slug}
                                            href={`/xem-phim/${slug}/${ep.slug}`}
                                            className="group relative flex items-center justify-center h-10 bg-black/40 hover:bg-yellow-500 rounded-lg border border-white/10 hover:border-yellow-500 transition-all shadow-sm hover:shadow-yellow-500/20"
                                        >
                                            <span className="text-gray-300 group-hover:text-black font-semibold text-xs transition-colors truncate px-1">
                                                {ep.name}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                Phim đang được cập nhật tập mới.
                            </div>
                        )}
                    </div>
                )}

                {/* TRAILER TAB */}
                {activeTab === "trailer" && (
                    <div className="aspect-video w-full rounded-xl overflow-hidden border border-white/10 bg-black shadow-2xl">
                        {movie.trailer_url && movie.trailer_url.includes("youtube") ? (
                            <iframe
                                src={movie.trailer_url.replace("watch?v=", "embed/")}
                                className="w-full h-full"
                                allowFullScreen
                                title="Trailer"
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-2">
                                <Video className="w-12 h-12 opacity-20" />
                                <p className="text-sm">Trailer đang được cập nhật</p>
                            </div>
                        )}
                    </div>
                )}

                {/* RELATED TAB */}
                {activeTab === "related" && (
                    <div>
                        {relatedMovies.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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

