"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    User, LogOut, History, Heart, Plus, Clock,
    Play, X, Edit2, Loader2, ListVideo, Camera, Bookmark, Mail, Trophy, Upload, ChevronRight, Check, ShieldCheck, Lock, Eye, EyeOff, Settings, Video
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { getImageUrl } from "@/lib/utils";
import FavoriteButton from "./FavoriteButton";
import PlaylistManagerModal from "./PlaylistManagerModal";
import { updateProfile, uploadAvatar, changePassword } from "@/app/actions/user";

interface ProfileTabsProps {
    user: any;
    favorites: any[];
    history: any[];
    historyTotal?: number;
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
    "https://api.dicebear.com/7.x/notionists/svg?seed=Max&backgroundColor=b6e3f4"
];

export default function ProfileTabs({ user: initialUser, favorites, history, historyTotal }: ProfileTabsProps) {
    const { update: updateSession } = useSession();
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
    const [showPass, setShowPass] = useState(false);

    // Avatar error fallback
    const [avatarError, setAvatarError] = useState(false);

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

    const handleSaveProfile = async () => {
        setIsSavingProfile(true);
        setSaveMessage({ type: "", text: "" });
        try {
            const res = await updateProfile({ name: editName, email: editEmail });
            if (res.success) {
                setSaveMessage({ type: "success", text: "Đã cập nhật thông tin!" });
                setUser({ ...user, name: editName, email: editEmail });
                await updateSession({ name: editName });
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
        if (!passwords.new) return;
        if (passwords.new !== passwords.confirm) {
            setPassMessage({ type: "error", text: "Mật khẩu xác nhận không khớp" });
            return;
        }
        setIsChangingPass(true);
        setPassMessage({ type: "", text: "" });
        try {
            const res = await changePassword({ oldPassword: passwords.old, newPassword: passwords.new });
            if (res.success) {
                setPassMessage({ type: "success", text: "Đã thiết lập mật khẩu mới!" });
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
            setAvatarError(false);
            setIsAvatarModalOpen(false);
            // Refresh NextAuth session so header avatar updates immediately
            await updateSession({ image: url });
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
                setSaveMessage({ type: "error", text: res.error || "Lỗi upload ảnh" });
            }
        } catch {
            setSaveMessage({ type: "error", text: "Lỗi upload ảnh, vui lòng thử lại" });
        } finally {
            setIsUploading(false);
        }
    };

    const renderContent = () => {
        const titleClasses = "text-xl font-bold text-white mb-6";
        const sectionClasses = "bg-[#0a0a0c] border border-white/[0.04] p-6 md:p-8 rounded-2xl mb-6 shadow-sm";

        switch (activeTab) {
            case "favorites":
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <h2 className={titleClasses}>Phim Yêu Thích</h2>
                        {favorites.length === 0 ? (
                            <div className="text-gray-600 text-center py-20 bg-[#0a0a0c] rounded-2xl border border-white/[0.04]">
                                <Heart className="w-10 h-10 mx-auto mb-4 opacity-10" />
                                <p className="text-sm font-medium">Danh sách yêu thích đang trống.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {favorites.map((movie) => (
                                    <div key={movie._id} className="group transition-all">
                                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#0a0a0c] border border-white/[0.05]">
                                            <FavoriteButton movieData={movie} size="sm" />
                                            <Link href={`/phim/${movie.movieSlug}`}>
                                                <Image src={getImageUrl(movie.moviePoster)} alt={movie.movieName} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                            </Link>
                                        </div>
                                        <div className="mt-2.5">
                                            <h3 className="text-white text-xs font-bold truncate group-hover:text-purple-400 transition-colors">{movie.movieName}</h3>
                                            <p className="text-gray-600 text-[10px] font-bold mt-0.5">{movie.movieYear}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            
            case "lists":
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className={titleClasses}>Bộ sưu tập</h2>
                            <button 
                                onClick={() => { setModalMode("create"); setSelectedPlaylist(null); setIsModalOpen(true); }}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white text-[12px] font-bold rounded-lg hover:bg-white/10 transition-all active:scale-95"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Tạo bộ sưu tập
                            </button>
                        </div>
                        {playlists.length === 0 ? (
                            <div className="text-gray-600 text-center py-20 bg-[#0a0a0c] rounded-2xl border border-white/[0.04]">
                                <ListVideo className="w-10 h-10 mx-auto mb-4 opacity-10" />
                                <p className="text-sm font-medium">Bạn chưa có bộ sưu tập nào.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {playlists.map((playlist) => (
                                    <div key={playlist._id} className="group relative bg-[#0a0a0c] border border-white/[0.04] rounded-2xl p-5 hover:border-[#8FA7C5]/30 transition-all duration-300 overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#8FA7C5]/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-[#8FA7C5]/10 transition-all" />
                                        
                                        <h3 className="text-[17px] font-bold text-white mb-2 group-hover:text-[#8FA7C5] transition-colors">{playlist.name}</h3>
                                        <p className="text-gray-600 text-xs line-clamp-2 min-h-[32px] mb-6">{playlist.description || "Danh sách phim yêu thích cá nhân."}</p>
                                        
                                        <div className="flex items-center justify-between mt-auto">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                                    <Video className="w-4 h-4 text-white/40" />
                                                </div>
                                                <span className="text-white text-xs font-bold">{playlist.movies?.length || 0} phim</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => { setModalMode("edit"); setSelectedPlaylist(playlist); setIsModalOpen(true); }}
                                                    className="p-2 text-gray-600 hover:text-white transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <Link 
                                                    href={`/thu-vien/${playlist._id}`}
                                                    className="p-2 text-gray-600 hover:text-[#8FA7C5] transition-colors translate-x-1"
                                                >
                                                    <ChevronRight className="w-5 h-5" />
                                                </Link>
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
                    <div className="animate-in fade-in duration-300 max-w-[900px]">
                        <h2 className={titleClasses}>Trực quan hoạt động</h2>

                        {/* ELITE Dashboard Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
                            {[
                                { label: "Phim đã xem", value: historyTotal ?? history.length, icon: Play, color: "#8FA7C5" },
                                { label: "Yêu thích", value: favorites.length, icon: Heart, color: "#ef4444" },
                                { label: "Bộ sưu tập", value: playlists.length, icon: ListVideo, color: "#a855f7" }
                            ].map((stat, i) => (
                                <div key={i} className="bg-[#0a0a0c] border border-white/[0.05] rounded-[20px] p-6 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-20 h-20 opacity-10 blur-2xl rounded-full" style={{ backgroundColor: stat.color }} />
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.02] border border-white/[0.05]">
                                            <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                                        </div>
                                        <span className="text-[28px] font-bold text-white">{stat.value}</span>
                                    </div>
                                    <p className="text-gray-600 text-[11px] font-bold uppercase">{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        <h2 className={titleClasses}>Thông tin cá nhân</h2>
                        
                        {/* Static Info Section */}
                        <div className={sectionClasses}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="space-y-1.5">
                                        <label className="text-gray-600 text-[11px] font-bold uppercase ml-0.5">Tên hiển thị</label>
                                        <input 
                                            type="text" 
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white font-medium focus:border-[#8FA7C5]/40 focus:outline-none transition-all placeholder:text-gray-700"
                                            placeholder="Nhập tên của bạn"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-gray-600 text-[11px] font-bold uppercase ml-0.5">Địa chỉ Email</label>
                                        <input 
                                            type="email" 
                                            value={editEmail}
                                            onChange={(e) => setEditEmail(e.target.value)}
                                            className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white font-medium focus:border-[#8FA7C5]/40 focus:outline-none transition-all placeholder:text-gray-700"
                                            placeholder="Nhập email"
                                        />
                                    </div>
                                    <button 
                                        onClick={handleSaveProfile}
                                        disabled={isSavingProfile}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black text-xs font-bold rounded-lg hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-30"
                                    >
                                        {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lưu thay đổi"}
                                    </button>
                                    {saveMessage.text && (
                                        <span className={`ml-3 text-[10px] font-bold uppercase tracking-widest ${saveMessage.type === 'success' ? 'text-[#8FA7C5]' : 'text-red-500'}`}>
                                            {saveMessage.text}
                                        </span>
                                    )}
                                </div>
                                <div className="hidden md:flex flex-col justify-center border-l border-white/[0.04] pl-8">
                                    <p className="text-gray-600 text-xs font-medium mb-1">Thành viên từ</p>
                                    <p className="text-white font-bold text-sm uppercase">Tháng 3, 2026</p>
                                    <div className="h-px bg-white/[0.04] my-4 w-1/2"></div>
                                    <p className="text-gray-600 text-xs font-medium mb-1">Mức độ hoàn tất hồ sơ</p>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-white opacity-40" style={{ width: '85%' }}></div>
                                        </div>
                                        <span className="text-white text-xs font-bold">85%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Password Section */}
                        <h2 className="text-xl font-bold text-white mt-12 mb-6">Cài đặt mật khẩu</h2>
                        <div className={sectionClasses}>
                            <form onSubmit={handleChangePass} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-gray-600 text-[11px] font-bold uppercase tracking-wider ml-0.5">Mật khẩu mới</label>
                                        <div className="relative">
                                            <input 
                                                type={showPass ? "text" : "password"} 
                                                value={passwords.new}
                                                onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                                                className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500/40 focus:outline-none transition-all pr-10"
                                                placeholder="Ít nhất 6 ký tự"
                                            />
                                            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors">
                                                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-gray-600 text-[11px] font-bold uppercase tracking-wider ml-0.5">Nhập lại mật khẩu mới</label>
                                        <input 
                                            type={showPass ? "text" : "password"} 
                                            value={passwords.confirm}
                                            onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                                            className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500/40 focus:outline-none transition-all"
                                            placeholder="Xác nhận lại"
                                        />
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <button 
                                        type="submit"
                                        disabled={isChangingPass}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black text-xs font-bold rounded-lg hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-30"
                                    >
                                        {isChangingPass ? <Loader2 className="w-4 h-4 animate-spin" /> : "Đặt lại mật khẩu"}
                                    </button>
                                    {passMessage.text && (
                                        <span className={`ml-3 text-[10px] font-bold uppercase tracking-widest ${passMessage.type === 'success' ? 'text-[#8FA7C5]' : 'text-red-500'}`}>
                                            {passMessage.text}
                                        </span>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* UI Customization Section */}
                        <h2 className="text-xl font-bold text-white mt-12 mb-6">Tùy chỉnh giao diện</h2>
                        <div className={sectionClasses}>
                            <div className="space-y-6">
                                {[
                                    { label: "Hiệu ứng Cinematic Glow", description: "Bật hiệu ứng ánh sáng rực rỡ cho Poster phim.", checked: true },
                                    { label: "Giao diện Glassmorphism", description: "Sử dụng hiệu ứng kính mờ cao cấp cho UI.", checked: true },
                                    { label: "Tự động phát Trailer", description: "Tự động phát trailer khi di chuột qua phim.", checked: false }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between group cursor-pointer">
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-white group-hover:text-[#8FA7C5] transition-colors">{item.label}</p>
                                            <p className="text-[11px] font-medium text-gray-700">{item.description}</p>
                                        </div>
                                        <div className={`w-10 h-5 rounded-full relative transition-all ${item.checked ? 'bg-[#8FA7C5]/40' : 'bg-white/10'}`}>
                                            <div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${item.checked ? 'right-1 bg-white shadow-[0_0_8px_white]' : 'left-1 bg-gray-700'}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Security Summary Section */}
                        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-[#8FA7C5]" />
                                    Tóm tắt bảo mật
                                </h3>
                                <div className="space-y-3">
                                    {[
                                        { label: "Mật khẩu", value: "Đã thiết lập", status: "active" },
                                        { label: "Xác thực 2 lớp", value: "Chưa kích hoạt", status: "inactive" },
                                        { label: "Thiết bị đã đăng nhập", value: "1 thiết bị", status: "active" }
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                            <span className="text-gray-500 text-xs font-medium">{item.label}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-white text-[11px] font-bold">{item.value}</span>
                                                <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'active' ? 'bg-[#8FA7C5]' : 'bg-orange-500/50'}`} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-yellow-500/70" />
                                    Huy chương & Danh hiệu
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-gray-400">Mọt phim Tập sự</div>
                                    <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-gray-400 opacity-30">Phê Phim Vương</div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-0 md:gap-12 min-h-screen">
            {/* Sidebar Implementation (Image 2 style) */}
            <div className="w-full md:w-[260px] flex-shrink-0">
                <div className="bg-[#0a0a0c] md:bg-transparent border-b md:border-b-0 border-white/[0.04] p-8 md:p-0 md:sticky md:top-24">
                    {/* User Profile Header in Sidebar */}
                    <div className="mb-10 text-center md:text-left">
                        <div className="relative inline-block group mb-4">
                            <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border border-white/5 p-1 bg-[#0a0a0c]">
                                <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl">
                                    {user?.image && !avatarError ? (
                                        <Image
                                            src={user.image}
                                            alt=""
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 96px, 112px"
                                            quality={85}
                                            onError={() => setAvatarError(true)}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-3xl font-bold bg-[#00695C] text-white shadow-inner">
                                            {user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || "KH"}
                                        </div>
                                    )}
                                    <button 
                                        onClick={() => setIsAvatarModalOpen(true)}
                                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 backdrop-blur-[2px]"
                                    >
                                        <Camera className="w-6 h-6 text-white" />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <h1 className="text-lg font-bold text-white truncate max-w-full">{user?.name}</h1>
                        <p className="text-xs text-gray-600 mt-1 truncate opacity-70">{user?.email}</p>
                    </div>

                    <div className="h-px bg-white/[0.06] mb-8 hidden md:block w-12"></div>

                    <nav className="flex md:flex-col gap-1 md:gap-1.5 overflow-x-auto no-scrollbar md:overflow-visible pb-4 md:pb-0">
                        {[
                            { id: "account", label: "Tài khoản", icon: User },
                            { id: "favorites", label: "Yêu thích", icon: Heart },
                            { id: "history", label: "Lịch sử", icon: History },
                            { id: "lists", label: "Bộ sưu tập", icon: ListVideo },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === item.id ? "text-[#8FA7C5] bg-[#8FA7C5]/5" : "text-gray-500 hover:text-white hover:bg-white/5"}`}
                            >
                                <item.icon className="w-4 h-4 shrink-0" />
                                <span>{item.label}</span>
                                {activeTab === item.id && <div className="ml-auto w-1 h-1 rounded-full bg-[#8FA7C5] hidden md:block"></div>}
                            </button>
                        ))}
                    </nav>

                    <div className="h-px bg-white/[0.06] my-8 hidden md:block w-12"></div>

                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:text-red-500 transition-all text-sm font-bold group"
                    >
                        <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        <span>Đăng xuất</span>
                    </button>
                </div>
            </div>

            {/* Main Surface */}
            <div className="flex-1 p-8 md:p-0 md:pt-4">
                {renderContent()}
            </div>

            {/* Avatar Modal */}
            {isAvatarModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-[#0a0a0c] border border-white/[0.08] rounded-24px w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] shadow-2xl">
                        <div className="flex items-center justify-between p-8 pb-4">
                            <h2 className="text-xl font-bold text-white">Cá nhân hóa</h2>
                            <button onClick={() => setIsAvatarModalOpen(false)} className="text-gray-600 hover:text-white transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="flex gap-8 px-8 border-b border-white/[0.04]">
                            <button onClick={() => setAvatarTab("preset")} className={`pb-4 text-[12px] font-bold transition-all ${avatarTab === 'preset' ? 'text-purple-500 border-b-2 border-purple-500' : 'text-gray-600 hover:text-gray-400'}`}>Mặc định</button>
                            <button onClick={() => setAvatarTab("upload")} className={`pb-4 text-[12px] font-bold transition-all ${avatarTab === 'upload' ? 'text-purple-500 border-b-2 border-purple-500' : 'text-gray-600 hover:text-gray-400'}`}>Tải lên</button>
                        </div>

                        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                            {avatarTab === "preset" ? (
                                <div className="grid grid-cols-4 gap-4">
                                    {PRESET_AVATARS.map((url, idx) => (
                                        <button 
                                            key={idx}
                                            onClick={() => handleAvatarSelect(url)}
                                            className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 ${user?.image === url ? 'border-purple-500' : 'border-white/[0.05] hover:border-white/10'}`}
                                        >
                                            <Image src={url} alt="" fill className="object-cover" sizes="100px" quality={82} />
                                            {user?.image === url && (
                                                <div className="absolute inset-0 bg-[#8FA7C5]/10 flex items-center justify-center">
                                                    <div className="bg-white rounded-full p-1 shadow-xl">
                                                        <Check className="w-3 h-3 text-[#8FA7C5]" />
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-white/[0.05] rounded-3xl bg-white/[0.01]">
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                        {isUploading ? <Loader2 className="w-6 h-6 text-purple-500 animate-spin" /> : <Upload className="w-6 h-6 text-gray-500" />}
                                    </div>
                                    <h4 className="text-base font-bold text-white mb-1">{isUploading ? "Đang xử lý..." : "Tải ảnh từ thiết bị"}</h4>
                                    <p className="text-gray-700 text-xs mb-6 px-10 text-center">Chúng tôi hỗ trợ ảnh định dạng JPG/PNG/WEBP.</p>
                                    {!isUploading && (
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-8 py-3 bg-white text-black text-xs font-bold rounded-lg hover:bg-gray-100 transition-all active:scale-95"
                                        >
                                            Chọn tệp tin
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
