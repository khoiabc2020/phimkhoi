"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Video, LayoutGrid, ChevronDown, Database, Subtitles, Mic, Volume2, Play } from "lucide-react";
import { Movie } from "@/services/api";
import MovieCard from "./MovieCard";
import { cn, getImageUrl } from "@/lib/utils";

interface Server {
    server_name: string;
    server_data: Record<string, unknown>[];
}

interface MovieTabsProps {
    movie: any;
    relatedMovies: any[];
    episodes: { server_name: string; server_data: any[] }[];
    slug: string;
    tmdbDetails?: any;
    episodeThumbnails?: Record<string, string>;
    episodeMetadata?: Record<string, { title?: string; overview?: string; airDate?: string; runtime?: number; voteAverage?: number }>;
}

const EPISODES_PER_CHUNK = 50;

export default function MovieTabs({
    movie,
    relatedMovies,
    episodes,
    slug,
    tmdbDetails,
    episodeThumbnails = {},
    episodeMetadata = {},
}: MovieTabsProps) {
    const defaultTab = (episodes && episodes.length > 0) ? "episodes" : "related";
    const [activeTab, setActiveTab] = useState<"episodes" | "trailer" | "related">(defaultTab);
    const [activeServer, setActiveServer] = useState(0);
    const [currentChunk, setCurrentChunk] = useState(0);
    const [activeLangTab, setActiveLangTab] = useState<string>("");
    const [showEpisodeImages, setShowEpisodeImages] = useState(false);
    const [activeTrailerIdx, setActiveTrailerIdx] = useState(0);

    // Get YouTube trailers from TMDB videos
    const tmdbVideos = useMemo(() => {
        const videos: any[] = tmdbDetails?.videos?.results || [];
        // Prefer trailers, then teasers, then anything
        const trailers = videos.filter((v: any) => v.site === "YouTube" && v.type === "Trailer");
        const teasers = videos.filter((v: any) => v.site === "YouTube" && v.type === "Teaser");
        const others = videos.filter((v: any) => v.site === "YouTube" && v.type !== "Trailer" && v.type !== "Teaser");
        return [...trailers, ...teasers, ...others].slice(0, 6);
    }, [tmdbDetails]);

    const activeVideo = tmdbVideos[activeTrailerIdx] || null;
    const backdropFallbacks = useMemo(() => {
        const paths = new Set<string>();

        const directBackdrop = tmdbDetails?.backdrop_path;
        if (directBackdrop) {
            paths.add(`https://image.tmdb.org/t/p/w1280${directBackdrop}`);
        }

        const tmdbBackdrops = tmdbDetails?.images?.backdrops || [];
        tmdbBackdrops.forEach((item: any) => {
            if (item?.file_path) {
                paths.add(`https://image.tmdb.org/t/p/w1280${item.file_path}`);
            }
        });

        return Array.from(paths);
    }, [tmdbDetails]);

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
        { id: "episodes", label: "DANH SÁCH TẬP" },
        { id: "related", label: "ĐỀ XUẤT" },
        { id: "trailer", label: "TRAILER" },
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
            {/* Tab Navigation */}
            <div className="flex items-center gap-5 sm:gap-8 border-b border-white/[0.04] mb-4 sm:mb-6 overflow-x-auto no-scrollbar pb-1">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 pb-3 text-[12px] sm:text-sm font-bold transition-all relative whitespace-nowrap ${isActive ? "text-[#F4C84A]" : "text-gray-400 hover:text-white"
                                }`}
                        >
                            {tab.label}
                            {isActive && (
                                <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#F4C84A]" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content - Dark Pill UI */}
            <div className="animate-in fade-in duration-300">
                {/* EPISODES TAB */}
                {activeTab === "episodes" && (
                    <div className="bg-[#09090c]/55 border border-white/[0.05] rounded-[10px] p-3 sm:p-5">
                        {episodes && episodes.length > 0 ? (
                            <div className="space-y-6">
                                {/* Language Tabs Row */}
                                {activeLanguageGroups.length > 0 && (
                                    <div className="flex items-center gap-3 sm:gap-6 border-b border-white/[0.06] mb-3 sm:mb-5 overflow-x-auto no-scrollbar pb-1">
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
                                                        isActive ? "text-[#F4C84A]" : "text-gray-400 hover:text-gray-200"
                                                    )}
                                                >
                                                    <Icon className={cn("w-[14px] h-[14px] sm:w-[16px] sm:h-[16px]", isActive ? "text-[#F4C84A]" : "text-gray-500")} />
                                                    {lang}
                                                    {isActive && (
                                                        <span className="absolute bottom-[-1px] left-0 right-0 h-[3px] rounded-t-full bg-[#F4C84A]" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Servers Row - compact inline */}
                                    <div className="flex flex-row items-center gap-2 sm:gap-3 border-b border-white/[0.05] pb-3 sm:pb-4 flex-wrap">
                                    <div className="flex items-center gap-1.5 text-gray-400 text-[11px] sm:text-[12px] font-bold uppercase tracking-widest shrink-0">
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
                                                            ? "bg-[#F4C84A] border-[#F4C84A] text-[#08090C] scale-105 transform"
                                                            : "bg-white/[0.04] border-white/[0.10] text-gray-300 hover:text-white hover:border-white/[0.2] hover:bg-white/[0.08] active:scale-95"
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
                                                            <span className="font-semibold text-gray-400">#{indexInTab + 1}</span>
                                                        </>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Header + toggle */}
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                                        <div className="text-sm font-bold text-gray-200">
                                            Danh sách tập <span className="text-[#F4C84A]">({currentServerData.length})</span>
                                        </div>
                                        {totalChunks > 1 && (
                                            <div className="relative">
                                                <select
                                                    value={currentChunk}
                                                    onChange={(e) => setCurrentChunk(Number(e.target.value))}
                                                    className="appearance-none bg-[#171B24] border border-white/[0.10] text-white text-sm font-medium py-2 px-4 pr-10 rounded-lg outline-none focus:border-[#F4C84A]/50 transition-colors cursor-pointer"
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
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2.5 shrink-0">
                                        <span className="text-[12px] sm:text-[13px] text-gray-300 font-medium">Hiện ảnh</span>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={showEpisodeImages}
                                            onClick={() => setShowEpisodeImages(!showEpisodeImages)}
                                            className={cn(
                                                "w-10 h-6 rounded-full transition-colors relative border border-white/10",
                                                showEpisodeImages ? "bg-white/30" : "bg-white/15"
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow transition-all",
                                                    showEpisodeImages ? "left-[19px]" : "left-[3px]"
                                                )}
                                            />
                                        </button>
                                    </div>
                                </div>

                                {/* Episode Grid */}
                                {showEpisodeImages ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 max-h-[520px] overflow-y-auto custom-scrollbar pr-1 sm:pr-2 pb-1 [contain:layout_paint]">
                                        {paginatedEpisodes.map((ep: { slug?: string; name?: string }, index: number) => {
                                            if (!ep?.slug) return null;
                                            const rawName = String(ep?.name || "");
                                            let displayName = rawName || "1";
                                            const match = rawName.match(/(\d+)/);
                                            if (match) {
                                                displayName = String(Number(match[1]));
                                            }

                                            const meta = episodeMetadata?.[ep.slug];
                                            const fallbackBackdrop = backdropFallbacks.length > 0
                                                ? backdropFallbacks[(currentChunk * EPISODES_PER_CHUNK + index) % backdropFallbacks.length]
                                                : getImageUrl(movie?.thumb_url || movie?.poster_url || "");
                                            const thumb = episodeThumbnails?.[ep.slug] || fallbackBackdrop;
                                            const episodeOverview = meta?.overview?.trim() || "Nội dung tập đang được cập nhật.";
                                            const dateText = meta?.airDate ? new Date(meta.airDate).toLocaleDateString("vi-VN") : "";
                                            const runtimeText = meta?.runtime ? `${meta.runtime}m` : "";

                                            return (
                                                <Link
                                                    key={ep.slug}
                                                    href={`/xem-phim/${slug}/${ep.slug}?server=${activeServer}`}
                                                    className="group rounded-[12px] overflow-hidden border transition-all duration-200 touch-manipulation bg-[#151924] border-white/[0.08] hover:border-white/[0.22] hover:-translate-y-[1px]"
                                                    title={rawName}
                                                >
                                                    <div className="relative aspect-video overflow-hidden">
                                                        {thumb ? (
                                                            <div
                                                                className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.03]"
                                                                style={{ backgroundImage: `url(${getImageUrl(thumb)})` }}
                                                            />
                                                        ) : (
                                                            <div className="absolute inset-0 bg-gradient-to-br from-[#2A2F3D] to-[#181B24]" />
                                                        )}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                                        <div className="absolute left-2.5 bottom-2 text-white font-bold text-[16px] drop-shadow-md">
                                                            Tập {displayName}
                                                        </div>
                                                    </div>

                                                    <div className="px-3 py-2.5">
                                                        <p className="text-[12px] text-gray-200 line-clamp-2 leading-relaxed min-h-[34px]">
                                                            {episodeOverview}
                                                        </p>
                                                        {(dateText || runtimeText) && (
                                                            <p className="text-[11px] text-gray-400 mt-1">
                                                                {dateText}{dateText && runtimeText ? " · " : ""}{runtimeText}
                                                            </p>
                                                        )}
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3 max-h-[360px] sm:max-h-[440px] overflow-y-auto custom-scrollbar pr-1 sm:pr-2 pb-1 [contain:layout_paint]">
                                        {paginatedEpisodes.map((ep: { slug?: string; name?: string }) => {
                                            if (!ep?.slug) return null;
                                            const rawName = String(ep?.name || "");
                                            let displayName = rawName || "1";
                                            const match = rawName.match(/(\d+)/);
                                            if (match) {
                                                displayName = match[1].padStart(2, "0");
                                            }

                                            return (
                                                <Link
                                                    key={ep.slug}
                                                    href={`/xem-phim/${slug}/${ep.slug}?server=${activeServer}`}
                                                    className="h-[40px] sm:h-[44px] rounded-[12px] text-[13px] sm:text-[14px] font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 border bg-white/[0.04] border-white/[0.08] text-gray-300 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.16] hover:-translate-y-[1px] active:scale-95 truncate shadow-sm touch-manipulation px-2"
                                                    title={rawName}
                                                >
                                                    <span>Tập {displayName}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
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
                    <div className="bg-[#09090c]/55 border border-white/[0.05] rounded-[10px] p-4 sm:p-5 space-y-4">
                        {/* Main player */}
                        <div className="aspect-video w-full rounded-lg overflow-hidden bg-[#0A101A] border border-white/[0.10] shadow-2xl">
                            {activeVideo ? (
                                <iframe
                                    key={activeVideo.key}
                                    src={`https://www.youtube.com/embed/${activeVideo.key}?autoplay=0&rel=0&modestbranding=1`}
                                    className="w-full h-full"
                                    allowFullScreen
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    title={activeVideo.name}
                                />
                            ) : movie.trailer_url && movie.trailer_url.includes("youtube") ? (
                                <iframe
                                    src={movie.trailer_url.replace("watch?v=", "embed/")}
                                    className="w-full h-full"
                                    allowFullScreen
                                    title="Trailer"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-[#71717A] gap-3">
                                    <Video className="w-14 h-14 opacity-15" />
                                    <p className="text-sm font-medium">Trailer đang được cập nhật</p>
                                    <p className="text-xs text-gray-600">Quay lại sau khi có thêm thông tin từ nhà phát hành</p>
                                </div>
                            )}
                        </div>

                        {/* Video selector — only show when multiple videos */}
                        {tmdbVideos.length > 1 && (
                            <div className="space-y-2">
                                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Video khác ({tmdbVideos.length})</p>
                                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                    {tmdbVideos.map((v: any, i: number) => (
                                        <button
                                            key={v.key}
                                            onClick={() => setActiveTrailerIdx(i)}
                                            className={cn(
                                                "flex-shrink-0 relative w-32 sm:w-40 rounded-lg overflow-hidden border transition-all",
                                                activeTrailerIdx === i
                                                    ? "border-[#F4C84A] ring-1 ring-[#F4C84A]/40"
                                                    : "border-white/10 hover:border-white/25"
                                            )}
                                        >
                                            <img
                                                src={`https://img.youtube.com/vi/${v.key}/mqdefault.jpg`}
                                                alt={v.name}
                                                className="w-full aspect-video object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                {activeTrailerIdx === i ? (
                                                    <div className="w-6 h-6 rounded-full bg-[#F4C84A] flex items-center justify-center">
                                                        <Play className="w-3 h-3 fill-black text-black" />
                                                    </div>
                                                ) : (
                                                    <div className="w-6 h-6 rounded-full bg-black/60 border border-white/20 flex items-center justify-center">
                                                        <Play className="w-3 h-3 fill-white text-white ml-0.5" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-1.5">
                                                <p className="text-[10px] text-gray-400 truncate text-left">{v.name}</p>
                                                <p className={cn(
                                                    "text-[10px] font-bold mt-0.5",
                                                    v.type === "Trailer" ? "text-[#F4C84A]" : "text-gray-500"
                                                )}>{v.type}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Active video info */}
                        {activeVideo && (
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-bold text-white">{activeVideo.name}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{activeVideo.type} · {activeVideo.published_at ? new Date(activeVideo.published_at).getFullYear() : ""}</p>
                                </div>
                                <a
                                    href={`https://www.youtube.com/watch?v=${activeVideo.key}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-shrink-0 text-xs text-[#F4C84A] hover:text-white border border-[#F4C84A]/30 hover:border-white/20 px-3 py-1.5 rounded-full transition-colors"
                                >
                                    YouTube ↗
                                </a>
                            </div>
                        )}
                    </div>
                )}

                {/* RELATED TAB */}
                {activeTab === "related" && (
                    <div className="bg-[#09090c]/55 border border-white/[0.05] rounded-[10px] p-5">
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

