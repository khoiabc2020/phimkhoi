"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    User, LogOut, History, Heart, Plus, Clock,
    Play, X, Edit2, Loader2, ListVideo, Camera, Bookmark, Mail, Trophy, Upload, ChevronRight, Check, ShieldCheck, Lock, Eye, EyeOff, Settings
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
    const [showPass, setShowPass] = useState(false);

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
        const titleClasses = "text-xl font-bold text-white mb-6 tracking-tight";
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
                                            <h3 className="text-white text-xs font-semibold truncate group-hover:text-purple-400 transition-colors uppercase tracking-wide">{movie.movieName}</h3>
                                            <p className="text-gray-600 text-[10px] font-bold mt-0.5">{movie.movieYear}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case "history":
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <h2 className={titleClasses}>Lịch Sử Xem</h2>
                        {history.length === 0 ? (
                            <div className="text-gray-600 text-center py-20 bg-[#0a0a0c] rounded-2xl border border-white/[0.04]">
                                <History className="w-10 h-10 mx-auto mb-4 opacity-10" />
                                <p className="text-sm font-medium">Bạn chưa xem phim nào.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {history.map((item) => (
                                    <Link key={item._id} href={`/xem-phim/${item.movieSlug}/${item.episodeSlug}`} className="group">
                                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#0a0a0c] border border-white/[0.05]">
                                            <Image src={getImageUrl(item.moviePoster)} alt={item.movieName} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                            <div className="absolute inset-x-0 bottom-0 h-1 bg-white/5">
                                                <div className="h-full bg-purple-500" style={{ width: `${item.progress}%` }} />
                                            </div>
                                        </div>
                                        <div className="mt-2.5">
                                            <h3 className="text-white text-xs font-semibold truncate group-hover:text-purple-400 transition-colors uppercase tracking-wide">{item.movieName}</h3>
                                            <p className="text-gray-600 text-[10px] font-bold mt-0.5">{item.episodeName} • {item.progress}%</p>
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
                    <div className="animate-in fade-in duration-300 max-w-[800px]">
                        <h2 className={titleClasses}>Thông tin tài khoản</h2>
                        
                        {/* Static Info Section */}
                        <div className={sectionClasses}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="space-y-1.5">
                                        <label className="text-gray-600 text-[11px] font-bold uppercase tracking-wider ml-0.5">Tên hiển thị</label>
                                        <input 
                                            type="text" 
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white font-medium focus:border-[#8FA7C5]/40 focus:outline-none transition-all placeholder:text-gray-700"
                                            placeholder="Nhập tên của bạn"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-gray-600 text-[11px] font-bold uppercase tracking-wider ml-0.5">Địa chỉ Email</label>
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
                        <h2 className="text-xl font-bold text-white mt-12 mb-6 tracking-tight">Cài đặt mật khẩu</h2>
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
                            <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border border-white/10 p-1 bg-black">
                                <div className="relative w-full h-full rounded-full overflow-hidden">
                                    {user?.image ? (
                                        <Image src={user.image} alt="" fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl font-bold bg-[#1a1a1f] text-gray-700">
                                            {user?.name?.[0]?.toUpperCase()}
                                        </div>
                                    )}
                                    <button 
                                        onClick={() => setIsAvatarModalOpen(true)}
                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                    >
                                        <Camera className="w-6 h-6 text-white" />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <h1 className="text-lg font-bold text-white truncate max-w-full">{user?.name}</h1>
                        <p className="text-xs font-medium text-gray-600 mt-1 truncate">{user?.email}</p>
                    </div>

                    <div className="h-px bg-white/[0.06] mb-8 hidden md:block w-12"></div>

                    <nav className="flex md:flex-col gap-1 md:gap-1.5 overflow-x-auto no-scrollbar md:overflow-visible pb-4 md:pb-0">
                        {[
                            { id: "account", label: "Tài khoản", icon: User },
                            { id: "favorites", label: "Yêu thích", icon: Heart },
                            { id: "history", label: "Lịch sử", icon: History },
                            { id: "lists", label: "Thư viện", icon: ListVideo },
                            { id: "settings", label: "Cài đặt", icon: Settings },
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
                        className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:text-red-500 transition-all text-sm font-bold uppercase tracking-widest group"
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
                            <h2 className="text-xl font-bold text-white tracking-tight">Cá nhân hóa</h2>
                            <button onClick={() => setIsAvatarModalOpen(false)} className="text-gray-600 hover:text-white transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="flex gap-8 px-8 border-b border-white/[0.04]">
                            <button onClick={() => setAvatarTab("preset")} className={`pb-4 text-[11px] font-bold uppercase tracking-widest transition-all ${avatarTab === 'preset' ? 'text-purple-500 border-b-2 border-purple-500' : 'text-gray-600 hover:text-gray-400'}`}>Mặc định</button>
                            <button onClick={() => setAvatarTab("upload")} className={`pb-4 text-[11px] font-bold uppercase tracking-widest transition-all ${avatarTab === 'upload' ? 'text-purple-500 border-b-2 border-purple-500' : 'text-gray-600 hover:text-gray-400'}`}>Tải lên</button>
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
                                            <Image src={url} alt="" fill className="object-cover" unoptimized={url.startsWith('http')} />
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
