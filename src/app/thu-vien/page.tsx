"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
    Clock, Bookmark, Heart, Play, X, Loader2, ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { removeFromWatchlist } from "@/app/actions/watchlist";
import { removeFavorite } from "@/app/actions/favorites";

type Tab = "lich-su" | "xem-sau" | "yeu-thich";

function getImageUrl(url: string) {
    if (!url) return "/placeholder.jpg";
    if (url.startsWith("http")) return url;
    return `https://phimimg.com/${url}`;
}

interface MovieCard {
    slug: string;
    name: string;
    poster?: string;
    year?: number;
    quality?: string;
    episodeSlug?: string;
    watchedAt?: string;
    progress?: number;
}

export default function ThuvienPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>("xem-sau");
    const [watchlist, setWatchlist] = useState<MovieCard[]>([]);
    const [favorites, setFavorites] = useState<MovieCard[]>([]);
    const [history, setHistory] = useState<MovieCard[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        if (!session?.user) return;
        setLoading(true);

        Promise.allSettled([
            fetch("/api/user/watchlist").then((r) => r.json()),
            fetch("/api/user/history").then((r) => r.json()),
            fetch("/api/user/favorites").then((r) => r.json()),
        ]).then(([wl, hist, fav]) => {
            if (wl.status === "fulfilled") setWatchlist(wl.value.movies || []);
            if (hist.status === "fulfilled") setHistory(hist.value.history || []);
            if (fav.status === "fulfilled") setFavorites(fav.value.movies || []);
            setLoading(false);
        });
    }, [session]);

    const tabs = [
        { id: "lich-su" as Tab, label: "Lịch sử", icon: Clock, count: history.length },
        { id: "xem-sau" as Tab, label: "Xem sau", icon: Bookmark, count: watchlist.length },
        { id: "yeu-thich" as Tab, label: "Yêu thích", icon: Heart, count: favorites.length },
    ];

    const handleRemoveWatchlist = async (slug: string) => {
        setWatchlist((prev) => prev.filter((m) => m.slug !== slug));
        await removeFromWatchlist(slug);
    };

    const handleRemoveFavorite = async (slug: string) => {
        setFavorites((prev) => prev.filter((m) => m.slug !== slug));
        await removeFavorite(slug);
    };

    const currentItems =
        activeTab === "lich-su" ? history :
            activeTab === "xem-sau" ? watchlist :
                favorites;

    if (status === "loading") return null;

    return (
        <div
            className="min-h-screen bg-[#080b12] text-white pt-[52px]"
            style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        >
            {/* Hero gradient */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-[#1a1f35]/30 via-transparent to-transparent" />
            </div>

            <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12 py-10">

                {/* Header row */}
                <div className="mb-8">
                    <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors mb-5 font-semibold">
                        <ChevronLeft className="w-4 h-4" /> Quay lại
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                            Thư viện của bạn
                        </h1>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 mb-8 border-b border-white/[0.08]">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all relative",
                                    isActive
                                        ? "text-white border-white"
                                        : "text-white/40 border-transparent hover:text-white/70 hover:border-white/20"
                                )}
                            >
                                <Icon className={cn("w-4 h-4", isActive && tab.id === "yeu-thich" ? "text-white" : "")} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
                    </div>
                ) : currentItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                            {activeTab === "lich-su" ? <Clock className="w-7 h-7 text-white/20" />
                                : activeTab === "xem-sau" ? <Bookmark className="w-7 h-7 text-white/20" />
                                    : <Heart className="w-7 h-7 text-white/20" />}
                        </div>
                        <p className="text-white/30 text-sm">
                            {activeTab === "lich-su" ? "Chưa có lịch sử xem"
                                : activeTab === "xem-sau" ? "Danh sách xem sau trống"
                                    : "Chưa có phim yêu thích"}
                        </p>
                        <Link
                            href="/"
                            className="px-4 py-2 rounded-full bg-yellow-400/10 text-yellow-400 text-sm font-medium hover:bg-yellow-400/20 transition-colors border border-yellow-400/20"
                        >
                            Khám phá phim
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {currentItems.map((movie) => (
                            <div key={movie.slug} className="group relative">
                                {/* Poster */}
                                <Link
                                    href={
                                        activeTab === "lich-su" && movie.episodeSlug
                                            ? `/xem-phim/${movie.slug}/${movie.episodeSlug}`
                                            : `/phim/${movie.slug}`
                                    }
                                    className="block"
                                >
                                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5 shadow-lg ring-1 ring-white/[0.06] group-hover:ring-yellow-400/30 transition-all duration-300">
                                        <Image
                                            src={getImageUrl(movie.poster || "")}
                                            alt={movie.name}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            unoptimized
                                        />
                                        {/* Overlay */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                                            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 shadow-lg">
                                                <Play className="w-4 h-4 text-black fill-black ml-0.5" />
                                            </div>
                                        </div>
                                        {/* Progress bar for history */}
                                        {activeTab === "lich-su" && movie.progress && (
                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                                                <div
                                                    className="h-full bg-yellow-400 transition-all"
                                                    style={{ width: `${Math.min(movie.progress, 100)}%` }}
                                                />
                                            </div>
                                        )}
                                        {/* Quality badge */}
                                        {movie.quality && (
                                            <div className="absolute top-1.5 left-1.5">
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-yellow-400 text-black">
                                                    {movie.quality}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </Link>

                                {/* Remove button */}
                                {(activeTab === "xem-sau" || activeTab === "yeu-thich") && (
                                    <button
                                        onClick={() =>
                                            activeTab === "xem-sau"
                                                ? handleRemoveWatchlist(movie.slug)
                                                : handleRemoveFavorite(movie.slug)
                                        }
                                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 text-white/70 hover:text-white hover:bg-black/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}

                                {/* Title */}
                                <div className="mt-2 px-0.5">
                                    <p className="text-[12px] font-medium text-white/80 line-clamp-2 leading-snug group-hover:text-white transition-colors">
                                        {movie.name}
                                    </p>
                                    {movie.year && (
                                        <p className="text-[10px] text-white/40 mt-0.5">{movie.year}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
