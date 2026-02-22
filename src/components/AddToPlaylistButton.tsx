"use client";

import { useState, useEffect } from "react";
import { Plus, X, Check, Loader2, ListVideo } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddToPlaylistButtonProps {
    movieData: {
        movieId: string;
        movieSlug: string;
        movieName: string;
        movieOriginName?: string;
        moviePoster?: string;
        movieYear?: number;
        movieQuality?: string;
        movieCategories?: string[]; // Optional, will not save to playlist schema to keep it lightweight
    };
    className?: string;
    variant?: "icon" | "text";
}

export default function AddToPlaylistButton({ movieData, className, variant = "icon" }: AddToPlaylistButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    // Xử lý đóng mở Modal và fetch Data
    const handleOpen = () => {
        setIsOpen(true);
        fetchPlaylists();
    };

    const handleClose = () => {
        setIsOpen(false);
        setNewPlaylistName("");
    };

    const fetchPlaylists = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/user/playlists");
            const data = await res.json();
            if (data.success) {
                setPlaylists(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch playlists", error);
        } finally {
            setIsLoading(false);
        }
    };

    const togglePlaylist = async (playlist: any) => {
        const isExist = playlist.movies.some((m: any) => m.movieSlug === movieData.movieSlug);
        const action = isExist ? "remove_movie" : "add_movie";

        // Optimistic UI updates
        setPlaylists(prev => prev.map(p => {
            if (p._id === playlist._id) {
                if (isExist) {
                    return { ...p, movies: p.movies.filter((m: any) => m.movieSlug !== movieData.movieSlug) };
                } else {
                    return { ...p, movies: [...p.movies, movieData] };
                }
            }
            return p;
        }));

        try {
            await fetch(`/api/user/playlists/${playlist._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, movieData }),
            });
        } catch (error) {
            console.error("Failed to toggle playlist", error);
            // Revert on fail (simplified: just refetch)
            fetchPlaylists();
        }
    };

    const handleCreatePlaylist = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPlaylistName.trim()) return;

        setIsCreating(true);
        try {
            const res = await fetch("/api/user/playlists", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newPlaylistName.trim() }),
            });
            const data = await res.json();
            if (data.success) {
                setNewPlaylistName("");
                await fetchPlaylists(); // Refresh list to show new playlist
            }
        } catch (error) {
            console.error("Failed to create playlist", error);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <>
            {/* The Trigger Button */}
            {variant === "icon" ? (
                <button
                    onClick={handleOpen}
                    title="Lưu vào danh sách"
                    className={cn(
                        "flex items-center justify-center transition-all group",
                        className
                    )}
                >
                    <ListVideo className="w-5 h-5 group-hover:text-yellow-400 transition-colors" />
                </button>
            ) : (
                <button
                    onClick={handleOpen}
                    className={cn(
                        "flex items-center gap-2 transition-all group",
                        className
                    )}
                >
                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
                    <span className="hidden sm:inline">Thêm vào</span>
                </button>
            )}

            {/* The Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                            <h3 className="font-bold text-white flex items-center gap-2 text-base">
                                Lưu vào danh sách
                            </h3>
                            <button onClick={handleClose} className="p-1.5 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {isLoading ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="w-6 h-6 text-[#fbbf24] animate-spin" />
                                </div>
                            ) : playlists.length === 0 ? (
                                <div className="text-center py-8 px-4 text-white/50 text-sm">
                                    Bạn chưa có danh sách nào. Hãy tạo mới bên dưới.
                                </div>
                            ) : (
                                <div className="space-y-1 p-2">
                                    {playlists.map(playlist => {
                                        const isChecked = playlist.movies.some((m: any) => m.movieSlug === movieData.movieSlug);
                                        return (
                                            <label
                                                key={playlist._id}
                                                className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-colors"
                                            >
                                                <div className={cn(
                                                    "w-5 h-5 rounded border flex items-center justify-center transition-colors shadow-sm",
                                                    isChecked
                                                        ? "bg-[#fbbf24] border-[#fbbf24] text-black"
                                                        : "border-white/20 bg-black/50"
                                                )}>
                                                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                                </div>
                                                <span className="text-white text-sm font-medium select-none truncate">
                                                    {playlist.name}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer (Create New Playlist input) */}
                        <div className="p-4 border-t border-white/10 bg-black/20">
                            <form onSubmit={handleCreatePlaylist} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={newPlaylistName}
                                    onChange={(e) => setNewPlaylistName(e.target.value)}
                                    placeholder="Tạo danh sách mới..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#fbbf24] focus:ring-1 focus:ring-[#fbbf24] transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!newPlaylistName.trim() || isCreating}
                                    className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white disabled:opacity-50 transition-colors"
                                    title="Tạo"
                                >
                                    {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
