"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    User, LogOut, History, Heart, Plus, Clock,
    Play, X, Edit2, Loader2, ListVideo, Camera, Bookmark, Mail, Trophy, Upload, ChevronRight, Check, ShieldCheck, Lock
} from "lucide-react";
import { signOut } from "next-auth/react";
import { getImageUrl } from "@/lib/utils";
import FavoriteButton from "./FavoriteButton";
import PlaylistManagerModal from "./PlaylistManagerModal";
import { updateProfile, uploadAvatar, changePassword } from "@/app/actions/user";

interface ProfileTabsProps {
    user: any;
    favorites: any[];
    history: any[];
}

const PRESET_AVATARS = [
    "https://i.pravatar.cc/300?img=1",
    "https://i.pravatar.cc/300?img=12",
    "https://i.pravatar.cc/300?img=31",
    "https://i.pravatar.cc/300?img=42",
    "https://i.pravatar.cc/300?img=47",
    "https://i.pravatar.cc/300?img=60",
    "https://i.pravatar.cc/300?img=5",
    "https://api.dicebear.com/7.x/micah/svg?seed=Felix&backgroundColor=b6e3f4",
    "https://api.dicebear.com/7.x/micah/svg?seed=Aneka&backgroundColor=c0aede",
    "https://api.dicebear.com/7.x/lorelei/svg?seed=Jack&backgroundColor=ffdfbf",
    "https://api.dicebear.com/7.x/lorelei/svg?seed=Aiden&backgroundColor=b6e3f4",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Max&backgroundColor=b6e3f4"
];

export default function ProfileTabs({ user: initialUser, favorites, history }: ProfileTabsProps) {
    const [activeTab, setActiveTab] = useState("account");
    const [user, setUser] = useState(initialUser);
    
    // Profile Edit State
    const [editName, setEditName] = useState(initialUser?.name || "");
    const [editEmail, setEditEmail] = useState(initialUser?.email || "");
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [saveMessage, setSaveMessage] = useState({ type: "", text: "" });

    // Password State
    const [passwords, setPasswords] = useState({ old: "", new: "", confirm: "" });
    const [isChangingPass, setIsChangingPass] = useState(false);
    const [passMessage, setPassMessage] = useState({ type: "", text: "" });

    // Modals & Uploads
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [avatarTab, setAvatarTab] = useState<"preset" | "upload">("preset");
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Playlists
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);

    const fetchPlaylists = async () => {
        setIsLoadingPlaylists(true);
        try {
            const res = await fetch("/api/user/playlists");
            const data = await res.json();
            if (data.success) setPlaylists(data.data);
        } catch (error) {
            console.error("Failed to fetch playlists:", error);
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
        return {
            watched,
            favoritesCount: favorites.length,
            playlistsCount: playlists.length,
            avgProgress: watched > 0 ? Math.round(history.reduce((sum, item) => sum + Number(item?.progress || 0), 0) / watched) : 0,
            recentWatch: history[0]?.movieName || "Chưa có dữ liệu",
        };
    }, [favorites.length, history, playlists.length]);

    // Actions
    const handleSaveProfile = async () => {
        setIsSavingProfile(true);
        setSaveMessage({ type: "", text: "" });
        try {
            const res = await updateProfile({ name: editName, email: editEmail });
            if (res.success) {
                setSaveMessage({ type: "success", text: "Đã cập nhật thông tin!" });
                setUser({ ...user, name: editName, email: editEmail });
            } else {
                setSaveMessage({ type: "error", text: res.error || "Thất bại" });
            }
        } catch (err) {
            setSaveMessage({ type: "error", text: "Lỗi kết nối" });
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleChangePass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            setPassMessage({ type: "error", text: "Mật khẩu xác nhận không khớp" });
            return;
        }
        setIsChangingPass(true);
        setPassMessage({ type: "", text: "" });
        try {
            const res = await changePassword({ oldPassword: passwords.old, newPassword: passwords.new });
            if (res.success) {
                setPassMessage({ type: "success", text: "Đã đổi mật khẩu!" });
                setPasswords({ old: "", new: "", confirm: "" });
            } else {
                setPassMessage({ type: "error", text: res.error || "Thất bại" });
            }
        } catch (err) {
            setPassMessage({ type: "error", text: "Lỗi hệ thống" });
        } finally {
            setIsChangingPass(false);
        }
    };

    const handleAvatarSelect = async (url: string) => {
        const res = await updateProfile({ image: url });
        if (res.success) {
            setUser({ ...user, image: url });
            setIsAvatarModalOpen(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await uploadAvatar(formData);
            if (res.success && res.url) {
                await handleAvatarSelect(res.url);
            } else {
                alert(res.error || "Lỗi upload");
            }
        } catch (err) {
            alert("Lỗi upload");
        } finally {
            setIsUploading(false);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case "favorites":
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                            <Heart className="w-6 h-6 text-red-500 fill-red-500/20" /> Phim Yêu Thích
                        </h2>
                        {favorites.length === 0 ? (
                            <div className="text-gray-500 text-center py-24 bg-[#111117] rounded-3xl border border-white/5">
                                <Heart className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>Danh sách yêu thích đang trống.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                                {favorites.map((movie) => (
                                    <div key={movie._id} className="group relative">
                                        <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#111117] border border-white/5">
                                            <FavoriteButton movieData={movie} size="sm" />
                                            <Link href={`/phim/${movie.movieSlug}`}>
                                                <Image src={getImageUrl(movie.moviePoster)} alt={movie.movieName} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Play className="w-10 h-10 text-white fill-white" />
                                                </div>
                                            </Link>
                                        </div>
                                        <div className="mt-3">
                                            <h3 className="text-white text-sm font-bold truncate group-hover:text-purple-400 transition-colors">{movie.movieName}</h3>
                                            <p className="text-gray-500 text-[11px] font-medium mt-1">{movie.movieYear}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case "history":
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                            <History className="w-6 h-6 text-blue-500" /> Lịch Sử Xem
                        </h2>
                        {history.length === 0 ? (
                            <div className="text-gray-500 text-center py-24 bg-[#111117] rounded-3xl border border-white/5">
                                <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>Bạn chưa xem phim nào.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                                {history.map((item) => (
                                    <Link key={item._id} href={`/xem-phim/${item.movieSlug}/${item.episodeSlug}`} className="group block">
                                        <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#111117] border border-white/5">
                                            <Image src={getImageUrl(item.moviePoster)} alt={item.movieName} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                            <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
                                                <div className="h-full bg-red-600" style={{ width: `${item.progress}%` }} />
                                            </div>
                                            <div className="absolute top-3 right-3 px-2 py-1 bg-black/80 backdrop-blur-md rounded text-[10px] text-white font-bold border border-white/10">{item.episodeName}</div>
                                        </div>
                                        <div className="mt-3">
                                            <h3 className="text-white text-sm font-bold truncate group-hover:text-blue-400 transition-colors">{item.movieName}</h3>
                                            <div className="flex justify-between mt-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                                <span>{item.movieYear}</span>
                                                <span className="text-gray-400">{item.progress}%</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case "account":
            default:
                return (
                    <div className="space-y-8 animate-in fade-in duration-700 max-w-[1000px]">
                        {/* Header Section - Clean & Dark */}
                        <div className="relative bg-[#0d0d12] border border-white/[0.04] rounded-[32px] p-8 md:p-12 overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-600/[0.03] blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                            
                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
                                {/* Avatar with Professional Border */}
                                <div className="relative group cursor-pointer" onClick={() => setIsAvatarModalOpen(true)}>
                                    <div className="absolute -inset-1 bg-gradient-to-br from-white/10 to-transparent rounded-full opacity-50 group-hover:opacity-100 transition duration-500"></div>
                                    <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden border-4 border-[#0d0d12] bg-[#16161e] shadow-inner">
                                        {user?.image ? (
                                            <Image src={user.image} alt="Avatar" fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-6xl font-black bg-gradient-to-br from-[#1a1a24] to-[#0d0d12] text-white/20">
                                                {user?.name?.[0]?.toUpperCase()}
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity flex-col gap-2 backdrop-blur-[2px]">
                                            <Camera className="w-7 h-7 text-white" />
                                            <span className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Thay ảnh</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center md:text-left flex-1">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.04] border border-white/[0.08] rounded-full text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-4">
                                        <Trophy className="w-3 h-3" /> Thành viên hạng bạc
                                    </div>
                                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">{user?.name}</h1>
                                    <p className="text-gray-500 font-medium text-lg">ID: {user?.id?.slice(-8) || "Unknown"}</p>
                                    
                                    <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-8">
                                        <div className="flex flex-col items-center md:items-start">
                                            <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">Mức độ hoàn thành</span>
                                            <div className="flex items-center gap-3">
                                                <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]" style={{ width: `${profileStats.avgProgress}%` }} />
                                                </div>
                                                <span className="text-white font-bold text-sm">{profileStats.avgProgress}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Row - Minimalist */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: "Yêu thích", val: profileStats.favoritesCount, icon: Heart, color: "text-red-500" },
                                { label: "Đã xem", val: profileStats.watched, icon: History, color: "text-blue-500" },
                                { label: "Danh sách", val: profileStats.playlistsCount, icon: ListVideo, color: "text-teal-500" },
                                { label: "Cấp độ", val: "Level 12", icon: Trophy, color: "text-yellow-500" }
                            ].map((stat, i) => (
                                <div key={i} className="bg-[#0d0d12] border border-white/[0.04] p-6 rounded-[24px] hover:border-white/[0.08] transition-colors group">
                                    <stat.icon className={`w-5 h-5 ${stat.color} mb-3 opacity-60 group-hover:opacity-100 transition-opacity`} />
                                    <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">{stat.label}</p>
                                    <p className="text-2xl font-black text-white">{stat.val}</p>
                                </div>
                            ))}
                        </div>

                        {/* Main Settings Forms */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Proifle Information */}
                            <div className="bg-[#0d0d12] border border-white/[0.04] p-8 md:p-10 rounded-[32px] shadow-sm">
                                <h3 className="text-white font-bold text-lg mb-8 flex items-center gap-3">
                                    <User className="w-5 h-5 text-gray-500" /> Thông tin cá nhân
                                </h3>
                                
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest ml-1">Tên hiển thị</label>
                                        <input 
                                            type="text" 
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-full bg-[#16161e] border border-white/[0.05] rounded-2xl px-5 py-4 text-white font-medium focus:border-purple-500/50 focus:outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest ml-1">Địa chỉ Email</label>
                                        <input 
                                            type="email" 
                                            value={editEmail}
                                            onChange={(e) => setEditEmail(e.target.value)}
                                            className="w-full bg-[#16161e] border border-white/[0.05] rounded-2xl px-5 py-4 text-white font-medium focus:border-purple-500/50 focus:outline-none transition-colors"
                                        />
                                    </div>
                                    
                                    <div className="pt-4">
                                        <button 
                                            onClick={handleSaveProfile}
                                            disabled={isSavingProfile}
                                            className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-white/90 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                        >
                                            {isSavingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : "Cập nhật tài khoản"}
                                        </button>
                                        {saveMessage.text && (
                                            <p className={`mt-4 text-center text-xs font-bold uppercase tracking-wider ${saveMessage.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                                                {saveMessage.text}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Security Section (Password Change) */}
                            <div className="bg-[#0d0d12] border border-white/[0.04] p-8 md:p-10 rounded-[32px] shadow-sm">
                                <h3 className="text-white font-bold text-lg mb-8 flex items-center gap-3">
                                    <Lock className="w-5 h-5 text-gray-500" /> Đổi mật khẩu
                                </h3>
                                
                                <form onSubmit={handleChangePass} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest ml-1">Mật khẩu cũ</label>
                                        <input 
                                            type="password" 
                                            placeholder="••••••••"
                                            value={passwords.old}
                                            onChange={(e) => setPasswords({...passwords, old: e.target.value})}
                                            className="w-full bg-[#16161e] border border-white/[0.05] rounded-2xl px-5 py-4 text-white focus:border-red-500/30 focus:outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest ml-1">Mật khẩu mới</label>
                                        <input 
                                            type="password" 
                                            placeholder="••••••••"
                                            value={passwords.new}
                                            onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                                            className="w-full bg-[#16161e] border border-white/[0.05] rounded-2xl px-5 py-4 text-white focus:border-purple-500/50 focus:outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest ml-1">Xác nhận mật khẩu mới</label>
                                        <input 
                                            type="password" 
                                            placeholder="••••••••"
                                            value={passwords.confirm}
                                            onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                                            className="w-full bg-[#16161e] border border-white/[0.05] rounded-2xl px-5 py-4 text-white focus:border-purple-500/50 focus:outline-none transition-colors"
                                        />
                                    </div>
                                    
                                    <div className="pt-4">
                                        <button 
                                            type="submit"
                                            disabled={isChangingPass}
                                            className="w-full border border-white/10 bg-white/5 text-white font-black py-4 rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                        >
                                            {isChangingPass ? <Loader2 className="w-5 h-5 animate-spin" /> : "Đặt lại mật khẩu"}
                                        </button>
                                        {passMessage.text && (
                                            <p className={`mt-4 text-center text-xs font-bold uppercase tracking-wider ${passMessage.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                                                {passMessage.text}
                                            </p>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Recent Activity Mini-List */}
                        <div className="bg-[#0d0d12] border border-white/[0.04] p-8 md:p-10 rounded-[32px]">
                            <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-3">
                                <History className="w-5 h-5 text-gray-500" /> Hoạt động gần đây
                            </h3>
                            <div className="space-y-4">
                                {history.slice(0, 3).map((h, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-[#16161e] rounded-[20px] border border-white/[0.02] hover:border-white/[0.08] transition-colors cursor-pointer group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-16 relative rounded-lg overflow-hidden shrink-0">
                                                <Image src={getImageUrl(h.moviePoster)} alt="" fill className="object-cover" />
                                            </div>
                                            <div>
                                                <p className="text-white font-bold group-hover:text-purple-400 transition-colors">{h.movieName}</p>
                                                <p className="text-gray-500 text-xs mt-1">Đã xem {h.episodeName} • {h.progress}% hoàn thành</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-white transition-colors" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-12 min-h-[700px]">
            {/* Professional Sidebar */}
            <div className="w-full lg:w-[300px] flex-shrink-0">
                <div className="bg-[#0d0d12] rounded-[32px] p-8 border border-white/[0.04] h-fit sticky top-28">
                    <h1 className="text-2xl font-black text-white mb-10 tracking-tight flex items-center gap-3">
                        <ShieldCheck className="w-7 h-7 text-purple-500" /> Hệ thống
                    </h1>

                    <nav className="space-y-2">
                        {[
                            { id: "account", label: "Cài đặt tài khoản", icon: User },
                            { id: "favorites", label: "Phim yêu thích", icon: Heart },
                            { id: "history", label: "Lịch sử xem", icon: History },
                            { id: "lists", label: "Danh sách phát", icon: ListVideo }
                        ].map((btn) => (
                            <button
                                key={btn.id}
                                onClick={() => setActiveTab(btn.id)}
                                className={`w-full flex items-center justify-between group px-6 py-4 rounded-2xl transition-all font-bold text-[15px] ${activeTab === btn.id ? "text-white bg-purple-600 shadow-[0_0_20px_rgba(147,51,234,0.3)]" : "text-gray-500 hover:text-white hover:bg-white/[0.04]"}`}
                            >
                                <div className="flex items-center gap-4">
                                    <btn.icon className={`w-5 h-5 ${activeTab === btn.id ? "text-white" : "group-hover:text-white"}`} />
                                    {btn.label}
                                </div>
                                <div className={`w-1.5 h-1.5 rounded-full bg-white transition-opacity ${activeTab === btn.id ? "opacity-100" : "opacity-0"}`} />
                            </button>
                        ))}
                    </nav>

                    <div className="h-px bg-white/[0.04] my-10"></div>

                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="w-full flex items-center gap-4 px-6 py-4 text-red-500/70 hover:text-red-500 hover:bg-red-500/[0.04] rounded-2xl transition-all text-[15px] font-black uppercase tracking-widest"
                    >
                        <LogOut className="w-5 h-5" /> Đăng xuất
                    </button>
                    
                    {/* Legal Links */}
                    <div className="mt-12 px-6 flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-bold text-gray-700 uppercase tracking-widest">
                        <Link href="/" className="hover:text-gray-500">Trang chủ</Link>
                        <Link href="/" className="hover:text-gray-500">Điều khoản</Link>
                        <span>© 2026 KHOIPHIM</span>
                    </div>
                </div>
            </div>

            {/* Main Surface */}
            <div className="flex-1 w-full lg:min-w-0">
                {renderContent()}
            </div>

            {/* Avatar Selection Modal - Professional Look */}
            {isAvatarModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[#0d0d12] border border-white/10 rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
                        <div className="flex items-center justify-between p-10 pb-6">
                            <h2 className="text-3xl font-black text-white tracking-tight">Cá nhân hóa</h2>
                            <button onClick={() => setIsAvatarModalOpen(false)} className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all transform active:scale-95">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="flex gap-10 px-10 border-b border-white/[0.04]">
                            <button onClick={() => setAvatarTab("preset")} className={`pb-5 font-black text-[13px] uppercase tracking-widest transition-all ${avatarTab === 'preset' ? 'text-purple-500 border-b-2 border-purple-500' : 'text-gray-600 hover:text-gray-400'}`}>Bộ sưu tập</button>
                            <button onClick={() => setAvatarTab("upload")} className={`pb-5 font-black text-[13px] uppercase tracking-widest transition-all ${avatarTab === 'upload' ? 'text-purple-500 border-b-2 border-purple-500' : 'text-gray-600 hover:text-gray-400'}`}>Tải ảnh lên</button>
                        </div>

                        <div className="p-10 overflow-y-auto flex-1 custom-scrollbar">
                            {avatarTab === "preset" ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-6">
                                    {PRESET_AVATARS.map((url, idx) => (
                                        <button 
                                            key={idx}
                                            onClick={() => handleAvatarSelect(url)}
                                            className={`relative aspect-square rounded-3xl overflow-hidden border-4 transition-all duration-300 hover:scale-[1.05] active:scale-95 shadow-lg ${user?.image === url ? 'border-purple-600 shadow-[0_0_20px_rgba(168,85,247,0.3)]' : 'border-[#16161e] hover:border-white/10'}`}
                                        >
                                            <Image src={url} alt="" fill className="object-cover bg-black" unoptimized={url.startsWith('http')} />
                                            {user?.image === url && (
                                                <div className="absolute inset-0 bg-purple-600/20 flex items-center justify-center">
                                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-2xl">
                                                        <Check className="w-5 h-5 text-purple-600" />
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-white/[0.05] rounded-[32px] bg-white/[0.01]">
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                        {isUploading ? <Loader2 className="w-10 h-10 text-purple-500 animate-spin" /> : <Upload className="w-10 h-10 text-gray-500" />}
                                    </div>
                                    <h4 className="text-xl font-bold text-white mb-2">{isUploading ? "Đang xử lý thư viện..." : "Chọn ảnh từ thiết bị"}</h4>
                                    <p className="text-gray-500 text-sm mb-8 text-center max-w-[280px]">Dung lượng tối đa 5MB. Định dạng hỗ trợ: JPG, PNG, WEBP.</p>
                                    {!isUploading && (
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-10 py-4 bg-white text-black font-black rounded-2xl hover:bg-gray-100 transition-all transform active:scale-95"
                                        >
                                            Tìm trong máy
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <PlaylistManagerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchPlaylists} mode={modalMode} playlist={selectedPlaylist} />
        </div>
    );
}
