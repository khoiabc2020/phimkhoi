"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    User, LogOut, History, Heart, Plus, Clock,
    Play, X, Edit2, Loader2, ListVideo, Camera, Bookmark, Mail, Trophy, Upload, ChevronRight
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

// Danh sách các Avatar online làm preset đẹp mắt (Real + Illustrated + 3D)
const PRESET_AVATARS = [
    // Pravatar cho người thật
    "https://i.pravatar.cc/300?img=1",
    "https://i.pravatar.cc/300?img=12",
    "https://i.pravatar.cc/300?img=31",
    "https://i.pravatar.cc/300?img=42",
    "https://i.pravatar.cc/300?img=47",
    "https://i.pravatar.cc/300?img=60",
    "https://i.pravatar.cc/300?img=5",
    "https://i.pravatar.cc/300?img=44",
    // Dicebear cho nhân vật hoạt hình / 3D premium
    "https://api.dicebear.com/7.x/micah/svg?seed=Felix&backgroundColor=b6e3f4",
    "https://api.dicebear.com/7.x/micah/svg?seed=Aneka&backgroundColor=c0aede",
    "https://api.dicebear.com/7.x/lorelei/svg?seed=Jack&backgroundColor=ffdfbf",
    "https://api.dicebear.com/7.x/lorelei/svg?seed=Aiden&backgroundColor=b6e3f4",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Sasha&backgroundColor=ffd5dc",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Jasmine&backgroundColor=c0aede",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Max&backgroundColor=b6e3f4",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Robot&backgroundColor=ffdfbf"
];

export default function ProfileTabs({ user: initialUser, favorites, history }: ProfileTabsProps) {
    const [activeTab, setActiveTab] = useState("account");

    // Playlists State
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(true);
    const [playlistsError, setPlaylistsError] = useState("");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);

    // Avatar State
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [user, setUser] = useState(initialUser);

    const fetchPlaylists = async () => {
        setIsLoadingPlaylists(true);
        setPlaylistsError("");
        try {
            const res = await fetch("/api/user/playlists");
            const data = await res.json();
            if (data.success) {
                setPlaylists(data.data);
            } else {
                setPlaylistsError("Không thể tải danh sách, vui lòng thử lại.");
            }
        } catch (error) {
            console.error("Failed to fetch playlists:", error);
            setPlaylistsError("Không thể tải danh sách, vui lòng thử lại.");
        } finally {
            setIsLoadingPlaylists(false);
        }
    };

    useEffect(() => {
        if (activeTab === "lists" && playlists.length === 0 && isLoadingPlaylists) {
            fetchPlaylists();
        }
    }, [activeTab, playlists.length, isLoadingPlaylists]);

    const profileStats = useMemo(() => {
        const watched = history.length;
        const favoritesCount = favorites.length;
        const playlistsCount = playlists.length;
        const avgProgress = watched > 0
            ? Math.round(history.reduce((sum, item) => sum + Number(item?.progress || 0), 0) / watched)
            : 0;

        return {
            watched,
            favoritesCount,
            playlistsCount,
            avgProgress,
            recentWatch: history[0]?.movieName || "Chưa có dữ liệu",
        };
    }, [favorites.length, history, playlists.length]);

    const handleOpenCreateModal = () => {
        setModalMode("create");
        setSelectedPlaylist(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (playlist: { _id?: string; name?: string; isPublic?: boolean }) => {
        setModalMode("edit");
        setSelectedPlaylist(playlist);
        setIsModalOpen(true);
    };

    const handleAvatarSelect = async (url: string) => {
        setUser({ ...user, image: url });
        setIsAvatarModalOpen(false);
        // Trong thực tế sẽ gọi API /api/user/profile để lưu url vào DB
        // Hiện tại chỉ cập nhật UI preview
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
                            <div className="text-gray-400 text-center py-20 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                                <Heart className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                                <p>Chưa có phim yêu thích nào.</p>
                                <Link href="/" className="text-[#c7d7ea] mt-2 inline-block hover:underline font-medium">Khám phá ngay</Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 [contain:layout_paint]">
                                {favorites.map((movie) => (
                                    <div key={movie._id} className="group relative">
                                        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-white/5 shadow-lg border border-white/10">
                                            <div className="absolute top-2 right-2 z-20">
                                                <FavoriteButton
                                                    movieData={{
                                                        movieId: movie.movieId || "",
                                                        movieSlug: movie.movieSlug,
                                                        movieName: movie.movieName,
                                                        movieOriginName: movie.movieOriginName,
                                                        moviePoster: movie.moviePoster,
                                                        movieYear: movie.movieYear,
                                                        movieQuality: movie.movieQuality,
                                                        movieCategories: Array.isArray(movie.movieCategories) ? movie.movieCategories : [movie.movieCategories],
                                                    }}
                                                    size="sm"
                                                />
                                            </div>

                                            <Link href={`/phim/${movie.movieSlug}`}>
                                                <Image
                                                    src={getImageUrl(movie.moviePoster)}
                                                    alt={movie.movieName}
                                                    fill
                                                    loading="lazy"
                                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                                <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#263243] text-[#d8e3f2] mx-auto hover:scale-110 transition-transform">
                                                        <Play className="w-5 h-5 fill-current ml-0.5" />
                                                    </div>
                                                </div>
                                            </Link>

                                            <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                                                <span className="px-1.5 py-0.5 bg-black/60 backdrop-blur-md border border-white/10 rounded text-[9px] font-bold text-[#c7d7ea] uppercase shadow-sm">
                                                    {movie.movieQuality || "HD"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-2">
                                            <Link href={`/phim/${movie.movieSlug}`} className="block">
                                                <h3 className="text-white text-sm font-bold line-clamp-1 group-hover:text-[#c7d7ea] transition-colors">
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
                            <History className="w-6 h-6 text-[#8FA7C5]" />
                            Lịch Sử Xem
                        </h2>

                        {history.length === 0 ? (
                            <div className="text-gray-400 text-center py-20 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                                <p>Chưa có lịch sử xem.</p>
                                <Link href="/" className="text-[#c7d7ea] mt-2 inline-block hover:underline font-medium">Xem phim ngay</Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 [contain:layout_paint]">
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
                                                loading="lazy"
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            />

                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                                                <Play className="w-10 h-10 text-white fill-white drop-shadow-lg" />
                                            </div>

                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
                                                <div
                                                    className="h-full bg-red-600"
                                                    style={{ width: `${item.progress}%` }}
                                                />
                                            </div>

                                            <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] text-white font-medium border border-white/10">
                                                {item.episodeName}
                                            </div>
                                        </div>

                                        <div className="mt-2">
                                            <h3 className="text-white font-bold line-clamp-1 text-sm group-hover:text-[#c7d7ea] transition-colors pl-1">
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
                                <ListVideo className="w-6 h-6 text-[#8FA7C5]" />
                                Danh sách của bạn
                            </h2>
                            <button
                                onClick={handleOpenCreateModal}
                                className="flex items-center gap-1.5 px-4 py-2 bg-[#263243] hover:bg-[#2f3f54] text-[#d8e3f2] text-sm font-bold rounded-full transition-all active:scale-95"
                            >
                                <Plus className="w-4 h-4" /> Tạo danh sách
                            </button>
                        </div>

                        {isLoadingPlaylists ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 text-[#8FA7C5] animate-spin" />
                            </div>
                        ) : playlistsError ? (
                            <div className="text-center py-20 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                                <p className="text-[#c7d7ea] font-semibold">{playlistsError}</p>
                                <button
                                    onClick={fetchPlaylists}
                                    className="mt-3 inline-flex items-center px-4 py-2 rounded-full bg-[#263243] border border-[#33455f] text-[#d8e3f2] text-sm font-semibold"
                                >
                                    Thử lại
                                </button>
                            </div>
                        ) : playlists.length === 0 ? (
                            <div className="text-gray-400 text-center py-20 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                                <ListVideo className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                                <p className="text-lg font-medium text-white mb-2">Chưa có danh sách nào</p>
                                <p className="text-sm">Hãy tạo danh sách phim của riêng bạn để dễ dàng theo dõi.</p>
                                <button
                                    onClick={handleOpenCreateModal}
                                    className="text-[#c7d7ea] mt-4 inline-block hover:underline font-bold"
                                >
                                    + Tạo danh sách đầu tiên
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10 [contain:layout_paint]">
                                {playlists.map(list => (
                                    <div key={list._id} className="bg-white/5 border border-white/10 hover:border-[#33455f] p-5 rounded-lg relative group transition-all h-full flex flex-col">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#263243] to-[#3b4f68] rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-500 pointer-events-none"></div>
                                        <div className="relative flex-1 flex flex-col">
                                            <div className="flex items-start justify-between gap-4 mb-4">
                                                <h3 className="text-white font-bold text-lg group-hover:text-[#c7d7ea] transition-colors leading-tight line-clamp-2" title={list.name}>
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
                                                    <Play className="w-3 h-3 text-[#c7d7ea] fill-[#c7d7ea]" /> {list.movies?.length || 0} phim
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
                    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1200px]">
                        {/* Hero / Avatar Section */}
                        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 bg-[#0a0f1a] border border-white/5 rounded-[24px] p-6 md:p-10 relative overflow-hidden backdrop-blur-md">
                            {/* Decorative background glow */}
                            <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
                            
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10 w-full">
                                {/* Glowing Avatar */}
                                <div className="relative group cursor-pointer shrink-0" onClick={() => setIsAvatarModalOpen(true)}>
                                    <div className="absolute -inset-1.5 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
                                    <div className="relative w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden border-[4px] border-[#0a0f1a] bg-[#111117] shadow-xl">
                                        {user?.image ? (
                                            <Image src={user.image} alt="Avatar" fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-5xl font-bold bg-gradient-to-br from-purple-900 to-[#111117] text-white">
                                                {user?.name?.[0]?.toUpperCase()}
                                            </div>
                                        )}
                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity flex-col gap-1.5 duration-300">
                                            <Camera className="w-6 h-6 text-white" />
                                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Đổi Ảnh</span>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-2 right-2 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center border-[3px] border-[#0a0f1a] shadow-lg md:hidden group-hover:scale-110 transition-transform">
                                        <Camera className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                                
                                {/* User Info */}
                                <div className="text-center md:text-left flex-1 mt-2 md:mt-4">
                                    <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">{user?.name}</h1>
                                    <p className="text-[#8FA7C5] mt-1 font-medium text-sm md:text-base">@{user?.email?.split('@')[0] || "user"}</p>
                                    <div className="flex items-center justify-center md:justify-start gap-2 mt-3">
                                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 text-[10px] font-bold uppercase tracking-wider">Thành viên từ 1/3/2026</span>
                                    </div>
                                </div>

                                {/* Chỉnh sửa Button */}
                                <div className="mt-4 md:mt-4 flex shrink-0">
                                    <button className="flex items-center gap-2 px-6 py-2.5 bg-[#263243] hover:bg-[#2f3f54] text-white text-sm rounded-full font-bold transition-all border border-white/5 shadow-md active:scale-95 group">
                                        <User className="w-4 h-4 text-purple-400 group-hover:text-pink-400 transition-colors" /> Chỉnh sửa
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Stat Pills */}
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4">
                            <div className="px-6 py-3 bg-[#111117] border border-white/5 shadow-sm rounded-2xl flex items-center gap-4 min-w-[140px] grow md:grow-0">
                                <Heart className="w-6 h-6 text-red-500/80 fill-red-500/20" />
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Yêu thích</span>
                                    <span className="text-white font-black text-xl leading-none">{profileStats.favoritesCount}</span>
                                </div>
                            </div>
                            <div className="px-6 py-3 bg-[#111117] border border-white/5 shadow-sm rounded-2xl flex items-center gap-4 min-w-[140px] grow md:grow-0">
                                <Bookmark className="w-6 h-6 text-green-500/80 fill-green-500/20" />
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Xem sau</span>
                                    <span className="text-white font-black text-xl leading-none">{profileStats.playlistsCount}</span>
                                </div>
                            </div>
                            <div className="px-6 py-3 bg-[#111117] border border-white/5 shadow-sm rounded-2xl flex items-center gap-4 min-w-[140px] grow md:grow-0">
                                <History className="w-6 h-6 text-purple-500/80 fill-purple-500/20" />
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Đã xem</span>
                                    <span className="text-white font-black text-xl leading-none">{profileStats.watched}</span>
                                </div>
                            </div>
                        </div>

                        {/* Custom Grid Dashboard */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            {/* Thông tin cá nhân */}
                            <div className="bg-[#111117] border border-white/5 p-6 md:p-8 rounded-[24px] relative overflow-hidden group">
                                <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <User className="w-4 h-4 text-white/30" /> THÔNG TIN CÁ NHÂN
                                </h3>
                                <div className="space-y-4 relative z-10">
                                    <div>
                                        <p className="text-[#8FA7C5] text-xs font-medium mb-1.5 ml-1">Họ và tên</p>
                                        <p className="text-white font-bold bg-[#0a0f1a] px-4 py-2.5 rounded-[12px] border border-white/5">{user?.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-[#8FA7C5] text-xs font-medium mb-1.5 ml-1">Email</p>
                                        <p className="text-white/80 font-medium bg-[#0a0f1a] px-4 py-2.5 rounded-[12px] border border-white/5 truncate">{user?.email}</p>
                                    </div>
                                    <div className="pt-2">
                                        <span className="px-3 py-1 rounded-lg bg-[#263243]/50 text-[#c7d7ea] text-[11px] font-bold uppercase tracking-wider border border-[#33455f]">
                                            Phân quyền: {(user as any)?.role === "admin" ? "Quản trị viên" : "Thành viên"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Thư viện của bạn */}
                            <div 
                                onClick={() => setActiveTab("favorites")}
                                className="bg-[#111117] border border-[#2d1b4e] p-6 md:p-8 rounded-[24px] relative overflow-hidden group cursor-pointer hover:border-purple-500/50 transition-colors flex flex-col justify-center"
                            >
                                <div className="absolute top-0 right-0 w-56 h-56 bg-purple-600/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-purple-600/20 transition-colors"></div>
                                <div className="absolute bottom-6 right-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                                    <ListVideo className="w-32 h-32" />
                                </div>
                                <div className="relative z-10">
                                    <div className="w-12 h-12 rounded-[14px] bg-purple-500/10 flex items-center justify-center mb-5 border border-purple-500/20">
                                        <ListVideo className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <p className="text-purple-400 text-[10px] font-bold uppercase tracking-widest mb-1.5">THƯ VIỆN</p>
                                    <h3 className="text-[22px] font-bold text-white mb-3 group-hover:text-purple-300 transition-colors">Thư viện của bạn</h3>
                                    <div className="flex items-center gap-3 text-xs font-medium">
                                        <span className="text-pink-400/90 flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {profileStats.favoritesCount} yêu thích</span>
                                        <span className="text-purple-300/80 flex items-center gap-1"><Bookmark className="w-3.5 h-3.5" /> {profileStats.playlistsCount} xem sau</span>
                                    </div>
                                </div>
                                <ChevronRight className="absolute top-8 right-8 w-5 h-5 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </div>

                            {/* Lịch sử xem */}
                            <div 
                                onClick={() => setActiveTab("history")}
                                className="bg-[#111117] border border-[#1e3a8a]/50 p-6 md:p-8 rounded-[24px] relative overflow-hidden group cursor-pointer hover:border-blue-500/50 transition-colors flex flex-col justify-center"
                            >
                                <div className="absolute top-0 right-0 w-56 h-56 bg-blue-600/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-blue-600/20 transition-colors"></div>
                                <div className="absolute bottom-6 right-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                                    <History className="w-32 h-32" />
                                </div>
                                <div className="relative z-10">
                                    <div className="w-12 h-12 rounded-[14px] bg-blue-500/10 flex items-center justify-center mb-5 border border-blue-500/20">
                                        <History className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-1.5">HOẠT ĐỘNG</p>
                                    <h3 className="text-[22px] font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">Lịch sử xem</h3>
                                    <p className="text-blue-200/60 text-[15px] font-medium mt-2">
                                        <span className="text-blue-400 text-2xl font-black mr-1">{profileStats.watched}</span> phim
                                    </p>
                                </div>
                                <ChevronRight className="absolute top-8 right-8 w-5 h-5 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </div>

                            {/* Thống kê / Xếp hạng combo */}
                            <div className="grid grid-cols-2 gap-4 md:gap-6">
                                {/* Tổng thời gian xem */}
                                <div className="bg-[#0b1711] border border-[#064e3b] p-5 md:p-6 rounded-[24px] relative overflow-hidden group hover:border-green-500/50 transition-colors cursor-default flex flex-col justify-center">
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-green-600/10 blur-[40px] rounded-full pointer-events-none"></div>
                                    <div className="relative z-10">
                                        <div className="w-10 h-10 rounded-[12px] bg-green-500/10 flex items-center justify-center mb-4 border border-green-500/20">
                                            <Clock className="w-5 h-5 text-green-400" />
                                        </div>
                                        <p className="text-green-500/80 text-[10px] font-bold uppercase tracking-widest mb-2">THỐNG KÊ</p>
                                        <h3 className="text-[16px] md:text-[18px] font-bold text-white mb-2 leading-tight group-hover:text-green-200 transition-colors">Tổng thời gian</h3>
                                        <p className="text-green-400 text-2xl font-black mt-2">10 phút</p>
                                    </div>
                                    <Clock className="absolute bottom-4 right-4 w-12 h-12 text-green-500/10" />
                                </div>

                                {/* Xếp hạng */}
                                <div className="bg-gradient-to-br from-[#1c1404] to-[#111117] border border-[#78350f] p-5 md:p-6 rounded-[24px] relative overflow-hidden group hover:border-yellow-500/50 transition-colors cursor-default flex flex-col justify-center">
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-600/10 blur-[40px] rounded-full pointer-events-none"></div>
                                    <div className="relative z-10">
                                        <div className="w-10 h-10 rounded-[12px] bg-yellow-500/10 flex items-center justify-center mb-4 border border-yellow-500/20">
                                            <Trophy className="w-5 h-5 text-yellow-400" />
                                        </div>
                                        <p className="text-yellow-600/80 text-[10px] font-bold uppercase tracking-widest mb-2">BẢNG XẾP HẠNG</p>
                                        <h3 className="text-[16px] md:text-[18px] font-bold text-white mb-2 leading-tight group-hover:text-yellow-200 transition-colors">Xếp hạng của bạn</h3>
                                        <p className="text-yellow-500 text-2xl font-black mt-2">Top 6562</p>
                                    </div>
                                    <Trophy className="absolute bottom-4 right-4 w-12 h-12 text-yellow-500/10 group-hover:scale-110 transition-transform duration-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">
            {/* Sidebar Navigation */}
            <div className="w-full lg:w-[280px] flex-shrink-0">
                <div className="bg-[#0a0a0a] rounded-2xl p-6 border border-white/5 h-full flex flex-col sticky top-24">
                    <h1 className="text-xl font-black text-white mb-8 px-2 uppercase tracking-tight">Cài đặt</h1>

                    <nav className="flex-1 space-y-1.5">
                        <button
                            onClick={() => setActiveTab("account")}
                            className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-[12px] transition-all font-bold text-[15px] ${activeTab === "account" ? "text-white bg-[#263243] border border-[#33455f] shadow-md" : "text-white/50 hover:text-white hover:bg-white/5"}`}
                        >
                            <User className="w-5 h-5" />
                            Thông tin tài khoản
                        </button>

                        <button
                            onClick={() => setActiveTab("favorites")}
                            className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-[12px] transition-all font-bold text-[15px] ${activeTab === "favorites" ? "text-white bg-[#263243] border border-[#33455f] shadow-md" : "text-white/50 hover:text-white hover:bg-white/5"}`}
                        >
                            <Heart className="w-5 h-5" />
                            Phim yêu thích
                        </button>

                        <button
                            onClick={() => setActiveTab("history")}
                            className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-[12px] transition-all font-bold text-[15px] ${activeTab === "history" ? "text-white bg-[#263243] border border-[#33455f] shadow-md" : "text-white/50 hover:text-white hover:bg-white/5"}`}
                        >
                            <History className="w-5 h-5" />
                            Lịch sử xem
                        </button>

                        <button
                            onClick={() => setActiveTab("lists")}
                            className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-[12px] transition-all font-bold text-[15px] ${activeTab === "lists" ? "text-white bg-[#263243] border border-[#33455f] shadow-md" : "text-white/50 hover:text-white hover:bg-white/5"}`}
                        >
                            <ListVideo className="w-5 h-5" /> Danh sách cá nhân
                        </button>
                    </nav>

                    {/* Divider */}
                    <div className="h-px bg-white/5 my-8"></div>

                    {/* User Mini Footer */}
                    <div className="flex items-center gap-3 px-2 mb-6">
                        <div className="w-12 h-12 rounded-full bg-black overflow-hidden border-2 border-white/10 shrink-0 relative">
                            {user?.image ? (
                                <Image src={user.image} alt="Avatar" fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white font-bold bg-gradient-to-br from-purple-800 to-black">
                                    {user?.name?.[0]?.toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-bold text-sm truncate">{user?.name}</p>
                            <p className="text-purple-400 text-[10px] font-bold truncate max-w-[120px] uppercase tracking-wide">Thành viên</p>
                        </div>
                    </div>

                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-400/80 hover:text-red-400 hover:bg-red-500/10 rounded-[12px] transition-all text-sm font-bold uppercase tracking-wider"
                    >
                        <LogOut className="w-4 h-4" /> Đăng xuất
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 w-full lg:min-w-0">
                {renderContent()}
            </div>

            {/* Manage Playlist Modal */}
            <PlaylistManagerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchPlaylists}
                mode={modalMode}
                playlist={selectedPlaylist}
            />

            {/* Avatar Selection Modal */}
            {isAvatarModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#111117] border border-white/10 rounded-[24px] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#0a0f1a]">
                            <h2 className="text-xl font-bold text-white tracking-tight">Thay đổi Avatar</h2>
                            <button onClick={() => setIsAvatarModalOpen(false)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="flex gap-6 px-6 pt-5 pb-0 border-b border-white/5 bg-[#0a0f1a]">
                            <button className="pb-3 border-b-2 border-purple-500 text-purple-400 font-bold text-sm">Avatar có sẵn</button>
                            <button className="pb-3 border-b-2 border-transparent text-gray-500 font-bold text-sm hover:text-white transition-colors flex items-center gap-1.5">
                                <Upload className="w-4 h-4" /> Tải ảnh lên
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 bg-[#111117]">
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                {PRESET_AVATARS.map((url, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => handleAvatarSelect(url)}
                                        className={`relative aspect-square rounded-[18px] overflow-hidden border-2 transition-all duration-300 hover:scale-[1.03] active:scale-95 group shadow-lg ${user?.image === url ? 'border-purple-500 shadow-[0_0_20px_#a855f7_inset]' : 'border-white/5 hover:border-purple-500/50'}`}
                                    >
                                        <Image src={url} alt={`Avatar option ${idx}`} fill className="object-cover bg-black" unoptimized={url.startsWith('http')} />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <span className="text-[10px] font-bold text-white uppercase bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-md">Chọn</span>
                                        </div>
                                        {user?.image === url && (
                                            <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center border-2 border-black shadow-md">
                                                <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="p-5 border-t border-white/5 flex justify-end gap-3 bg-[#0a0f1a]">
                            <button onClick={() => setIsAvatarModalOpen(false)} className="px-6 py-2.5 rounded-full text-white/50 font-bold text-sm hover:text-white hover:bg-white/5 transition-colors">
                                Hủy
                            </button>
                            <button onClick={() => setIsAvatarModalOpen(false)} className="px-8 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold text-sm hover:opacity-90 transition-opacity shadow-[0_0_15px_#a855f780] active:scale-95">
                                Lưu thay đổi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
