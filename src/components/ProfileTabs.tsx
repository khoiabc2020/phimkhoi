"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    User, LogOut, History, Heart, Plus, Clock,
    Play, X, Edit2, Loader2, ListVideo
} from "lucide-react";
import { signOut } from "next-auth/react";
import { getImageUrl } from "@/lib/utils";
import FavoriteButton from "./FavoriteButton";
import PlaylistManagerModal from "./PlaylistManagerModal";

interface ProfileTabsProps {
    user: any;
    favorites: any[];
    history: any[];
}

export default function ProfileTabs({ user, favorites, history }: ProfileTabsProps) {
    const [activeTab, setActiveTab] = useState("account");

    // Playlists State
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);

    const fetchPlaylists = async () => {
        setIsLoadingPlaylists(true);
        try {
            const res = await fetch("/api/user/playlists");
            const data = await res.json();
            if (data.success) {
                setPlaylists(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch playlists:", error);
        } finally {
            setIsLoadingPlaylists(false);
        }
    };

    // Load playlists when user accesses the 'lists' tab
    if (activeTab === "lists" && isLoadingPlaylists && playlists.length === 0) {
        fetchPlaylists();
    }

    const handleOpenCreateModal = () => {
        setModalMode("create");
        setSelectedPlaylist(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (playlist: any) => {
        setModalMode("edit");
        setSelectedPlaylist(playlist);
        setIsModalOpen(true);
    };

    const renderContent = () => {
        switch (activeTab) {
            case "favorites":
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                            Phim Yêu Thích
                        </h2>

                        {favorites.length === 0 ? (
                            <div className="text-gray-400 text-center py-20 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                                <Heart className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                                <p>Chưa có phim yêu thích nào.</p>
                                <Link href="/" className="text-[#fbbf24] mt-2 inline-block hover:underline font-medium">Khám phá ngay</Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {favorites.map((movie) => (
                                    <div key={movie._id} className="group relative">
                                        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-white/5 shadow-lg border border-white/10">
                                            <div className="absolute top-2 right-2 z-20">
                                                <FavoriteButton
                                                    movieData={{
                                                        movieId: movie.movieId,
                                                        movieSlug: movie.movieSlug,
                                                        movieName: movie.movieName,
                                                        movieOriginName: movie.movieOriginName,
                                                        moviePoster: movie.moviePoster,
                                                        movieYear: movie.movieYear,
                                                        movieQuality: movie.movieQuality,
                                                        movieCategories: Array.isArray(movie.movieCategories) ? movie.movieCategories : [movie.movieCategories],
                                                    }}
                                                    // initialIsFavorite removed
                                                    size="sm"
                                                />
                                            </div>

                                            <Link href={`/phim/${movie.movieSlug}`}>
                                                <Image
                                                    src={getImageUrl(movie.moviePoster)}
                                                    alt={movie.movieName}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                                <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#fbbf24] text-black mx-auto shadow-lg hover:scale-110 transition-transform">
                                                        <Play className="w-5 h-5 fill-current ml-0.5" />
                                                    </div>
                                                </div>
                                            </Link>

                                            {/* Quality Badges */}
                                            <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                                                <span className="px-1.5 py-0.5 bg-black/60 backdrop-blur-md border border-white/10 rounded text-[9px] font-bold text-[#fbbf24] uppercase shadow-sm">
                                                    {movie.movieQuality || "HD"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-2">
                                            <Link href={`/phim/${movie.movieSlug}`} className="block">
                                                <h3 className="text-white text-sm font-bold line-clamp-1 group-hover:text-[#fbbf24] transition-colors">
                                                    {movie.movieName}
                                                </h3>
                                                <p className="text-white/50 text-xs line-clamp-1 mt-0.5 font-medium">
                                                    {movie.movieOriginName} • {movie.movieYear}
                                                </p>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case "history":
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                            <History className="w-6 h-6 text-[#fbbf24]" />
                            Lịch Sử Xem
                        </h2>

                        {history.length === 0 ? (
                            <div className="text-gray-400 text-center py-20 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                                <p>Chưa có lịch sử xem.</p>
                                <Link href="/" className="text-[#fbbf24] mt-2 inline-block hover:underline font-medium">Xem phim ngay</Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {history.map((item) => (
                                    <Link
                                        key={item._id}
                                        href={`/xem-phim/${item.movieSlug}/${item.episodeSlug}`}
                                        className="group relative block"
                                    >
                                        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-white/5 shadow-lg border border-white/10">
                                            <Image
                                                src={getImageUrl(item.moviePoster)}
                                                alt={item.movieName}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            />

                                            {/* Play Overlay */}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                                                <Play className="w-10 h-10 text-white fill-white drop-shadow-lg" />
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
                                                <div
                                                    className="h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.7)]"
                                                    style={{ width: `${item.progress}%` }}
                                                />
                                            </div>

                                            <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] text-white font-medium border border-white/10">
                                                {item.episodeName}
                                            </div>
                                        </div>

                                        <div className="mt-2">
                                            <h3 className="text-white font-bold line-clamp-1 text-sm group-hover:text-[#fbbf24] transition-colors pl-1">
                                                {item.movieName}
                                            </h3>
                                            <div className="flex items-center justify-between text-xs text-white/50 px-1 mt-0.5">
                                                <span className="truncate max-w-[70%]">{item.movieOriginName}</span>
                                                <span className="font-medium text-white/40">{item.progress}%</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case "lists":
                return (
                    <div>
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <ListVideo className="w-6 h-6 text-[#fbbf24]" />
                                Danh sách của bạn
                            </h2>
                            <button
                                onClick={handleOpenCreateModal}
                                className="flex items-center gap-1.5 px-4 py-2 bg-[#fbbf24] hover:brightness-110 text-black text-sm font-bold rounded-full transition-all shadow-[0_0_15px_rgba(251,191,36,0.3)] active:scale-95"
                            >
                                <Plus className="w-4 h-4" /> Tạo danh sách
                            </button>
                        </div>

                        {/* List Collections */}
                        {isLoadingPlaylists ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 text-[#fbbf24] animate-spin" />
                            </div>
                        ) : playlists.length === 0 ? (
                            <div className="text-gray-400 text-center py-20 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                                <ListVideo className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                                <p className="text-lg font-medium text-white mb-2">Chưa có danh sách nào</p>
                                <p className="text-sm">Hãy tạo danh sách phim của riêng bạn để dễ dàng theo dõi.</p>
                                <button
                                    onClick={handleOpenCreateModal}
                                    className="text-[#fbbf24] mt-4 inline-block hover:underline font-bold"
                                >
                                    + Tạo danh sách đầu tiên
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                                {playlists.map(list => (
                                    <div key={list._id} className="bg-white/5 border border-white/10 hover:border-[#fbbf24]/50 p-5 rounded-xl relative group transition-all h-full flex flex-col">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-500 pointer-events-none"></div>
                                        <div className="relative flex-1 flex flex-col">
                                            <div className="flex items-start justify-between gap-4 mb-4">
                                                <h3 className="text-white font-bold text-lg group-hover:text-[#fbbf24] transition-colors leading-tight line-clamp-2" title={list.name}>
                                                    {list.name}
                                                </h3>
                                                <button
                                                    onClick={() => handleOpenEditModal(list)}
                                                    className="p-1.5 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-md transition-colors shrink-0 z-10 block"
                                                    title="Chỉnh sửa hoặc xoá"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            <div className="mt-auto flex items-center justify-between">
                                                <span className="text-white/60 text-xs flex items-center gap-1.5 font-medium bg-black/30 px-2 py-1 rounded-md">
                                                    <Play className="w-3 h-3 text-[#fbbf24] fill-[#fbbf24]" /> {list.movies?.length || 0} phim
                                                </span>
                                                <span className="text-white/40 text-[10px] uppercase tracking-wider font-bold">
                                                    {new Date(list.updatedAt).toLocaleDateString('vi-VN')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case "account":
            default:
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6">Thông tin tài khoản</h2>
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 max-w-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-32 bg-[#fbbf24] rounded-full blur-[100px] opacity-5 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                            <div className="flex items-start gap-8 relative z-10">
                                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#fbbf24] bg-black shadow-[0_0_20px_rgba(251,191,36,0.2)]">
                                    {user?.image ? (
                                        <Image src={user.image} alt="Avatar" width={96} height={96} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-[#fbbf24] bg-gradient-to-br from-black to-white/5">
                                            {user?.name?.[0]?.toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 space-y-5">
                                    <div>
                                        <label className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-1.5 block">Tên hiển thị</label>
                                        <div className="flex items-center justify-between bg-black/40 p-3 rounded-lg border border-white/5 group hover:border-white/10 transition-colors">
                                            <span className="text-white font-bold">{user?.name}</span>
                                            <Edit2 className="w-4 h-4 text-white/20 group-hover:text-[#fbbf24] cursor-pointer transition-colors" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-1.5 block">Email</label>
                                        <div className="flex items-center justify-between bg-black/40 p-3 rounded-lg border border-white/5">
                                            <span className="text-white/80 font-medium">{user?.email}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-1.5 block">Vai trò</label>
                                        <span className="text-[#fbbf24] font-bold bg-[#fbbf24]/10 border border-[#fbbf24]/20 px-3 py-1 rounded text-xs inline-block shadow-sm">
                                            Thành viên VIP
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-8 min-h-[600px]">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 flex-shrink-0">
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 h-full flex flex-col sticky top-24">
                    <h1 className="text-lg font-black text-white mb-6 px-2 uppercase tracking-tight">Quản lý</h1>

                    <nav className="flex-1 space-y-1">
                        <button
                            onClick={() => setActiveTab("account")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === "account" ? "text-black bg-[#fbbf24] shadow-[0_0_15px_rgba(251,191,36,0.4)]" : "text-white/60 hover:text-white hover:bg-white/10"}`}
                        >
                            <User className="w-4 h-4" /> Tài khoản
                        </button>
                        <button
                            onClick={() => setActiveTab("favorites")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === "favorites" ? "text-black bg-[#fbbf24] shadow-[0_0_15px_rgba(251,191,36,0.4)]" : "text-white/60 hover:text-white hover:bg-white/10"}`}
                        >
                            <Heart className={activeTab === "favorites" ? "fill-current w-4 h-4" : "w-4 h-4"} /> Yêu thích
                        </button>
                        <button
                            onClick={() => setActiveTab("history")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === "history" ? "text-black bg-[#fbbf24] shadow-[0_0_15px_rgba(251,191,36,0.4)]" : "text-white/60 hover:text-white hover:bg-white/10"}`}
                        >
                            <History className="w-4 h-4" /> Lịch sử xem
                        </button>
                        <button
                            onClick={() => setActiveTab("lists")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === "lists" ? "text-black bg-[#fbbf24] shadow-[0_0_15px_rgba(251,191,36,0.4)]" : "text-white/60 hover:text-white hover:bg-white/10"}`}
                        >
                            <Plus className="w-4 h-4" /> Danh sách
                        </button>
                    </nav>

                    {/* Divider */}
                    <div className="h-px bg-white/10 my-6"></div>

                    {/* User Footer */}
                    <div className="flex items-center gap-3 px-2 mb-4">
                        <div className="w-10 h-10 rounded-full bg-black overflow-hidden border border-white/20 shrink-0">
                            {user?.image ? (
                                <Image src={user.image} alt="Avatar" width={40} height={40} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white font-bold bg-white/10">
                                    {user?.name?.[0]?.toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-bold text-sm truncate">{user?.name}</p>
                            <p className="text-white/40 text-[10px] font-medium truncate max-w-[120px] uppercase tracking-wide">Thành viên</p>
                        </div>
                    </div>

                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="w-full flex items-center gap-3 px-4 py-2 text-white/40 hover:text-red-500 transition-colors text-xs font-bold uppercase tracking-wider"
                    >
                        <LogOut className="w-4 h-4" /> Đăng xuất
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 w-full md:min-w-0 animate-in fade-in slide-in-from-right-4 duration-500">
                {renderContent()}
            </div>

            <PlaylistManagerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchPlaylists}
                mode={modalMode}
                playlist={selectedPlaylist}
            />
        </div>
    );
}
