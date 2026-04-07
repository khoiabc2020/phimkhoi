"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    User, LogOut, History, Heart, Plus, Clock,
    Play, X, Edit2, Loader2, ListVideo, Camera, Bookmark, Trophy, Upload,
    ChevronRight, Check, ShieldCheck, Lock, Eye, EyeOff, Video, Bell, Settings
} from "lucide-react";
import { signOut } from "next-auth/react";
import { getImageUrl } from "@/lib/utils";
import FavoriteButton from "./FavoriteButton";
import PlaylistManagerModal from "./PlaylistManagerModal";
import { updateProfile, uploadAvatar, changePassword } from "@/app/actions/user";
import { cn } from "@/lib/utils";

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

function formatMemberSince(dateStr?: string): string {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("vi-VN", { month: "long", year: "numeric" });
}

function formatWatchTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    if (h >= 1) return `${h}g ${Math.floor((seconds % 3600) / 60)}p`;
    return `${Math.floor(seconds / 60)} phút`;
}

export default function ProfileTabs({ user: initialUser, favorites, history }: ProfileTabsProps) {
    const [activeTab, setActiveTab] = useState("account");
    const [user, setUser] = useState(initialUser);

    // Profile Edit
    const [editName, setEditName] = useState(initialUser?.name || "");
    const [editEmail, setEditEmail] = useState(initialUser?.email || "");
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [saveMessage, setSaveMessage] = useState({ type: "", text: "" });

    // Password
    const [passwords, setPasswords] = useState({ old: "", new: "", confirm: "" });
    const [isChangingPass, setIsChangingPass] = useState(false);
    const [passMessage, setPassMessage] = useState({ type: "", text: "" });
    const [showPass, setShowPass] = useState(false);

    // Avatar
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

    // UI Preferences
    const [uiPrefs, setUiPrefs] = useState({
        cinematicGlow: true,
        glassmorphism: true,
        autoTrailer: false,
    });

    useEffect(() => {
        const saved = localStorage.getItem("pk_ui_prefs");
        if (saved) {
            try { setUiPrefs(JSON.parse(saved)); } catch { /* ignore */ }
        }
    }, []);

    const togglePref = (key: keyof typeof uiPrefs) => {
        setUiPrefs(prev => {
            const next = { ...prev, [key]: !prev[key] };
            localStorage.setItem("pk_ui_prefs", JSON.stringify(next));
            return next;
        });
    };

    // Fetch playlists on mount for count
    const fetchPlaylists = useCallback(async () => {
        setIsLoadingPlaylists(true);
        try {
            const res = await fetch("/api/user/playlists");
            const data = await res.json();
            if (data.success) setPlaylists(data.data);
        } catch { /* ignore */ } finally {
            setIsLoadingPlaylists(false);
        }
    }, []);

    useEffect(() => {
        fetchPlaylists();
    }, [fetchPlaylists]);

    // Profile completion
    const profileCompletion = useMemo(() => {
        let score = 40;
        if (user?.name) score += 20;
        if (user?.email) score += 20;
        if (user?.image) score += 20;
        return score;
    }, [user]);

    const handleSaveProfile = async () => {
        setIsSavingProfile(true);
        setSaveMessage({ type: "", text: "" });
        try {
            const res = await updateProfile({ name: editName, email: editEmail });
            if (res.success) {
                setSaveMessage({ type: "success", text: "Đã cập nhật thông tin!" });
                setUser({ ...user, name: editName, email: editEmail });
                setTimeout(() => setSaveMessage({ type: "", text: "" }), 3000);
            } else {
                setSaveMessage({ type: "error", text: res.error || "Thất bại" });
            }
        } catch {
            setSaveMessage({ type: "error", text: "Lỗi kết nối" });
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleChangePass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!passwords.new) return;
        if (passwords.new.length < 6) {
            setPassMessage({ type: "error", text: "Mật khẩu phải có ít nhất 6 ký tự" });
            return;
        }
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
                setTimeout(() => setPassMessage({ type: "", text: "" }), 3000);
            } else {
                setPassMessage({ type: "error", text: res.error || "Thất bại" });
            }
        } catch {
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
                setSaveMessage({ type: "error", text: res.error || "Lỗi upload ảnh" });
            }
        } catch {
            setSaveMessage({ type: "error", text: "Lỗi upload ảnh, vui lòng thử lại" });
        } finally {
            setIsUploading(false);
        }
    };

    const navItems = [
        { id: "account",   label: "Tổng quan",    icon: User },
        { id: "favorites", label: "Yêu thích",     icon: Heart,    count: favorites.length },
        { id: "history",   label: "Lịch sử",       icon: History,  count: history.length },
        { id: "lists",     label: "Bộ sưu tập",   icon: ListVideo, count: playlists.length },
        { id: "settings",  label: "Cài đặt",       icon: Settings },
    ];

    const titleClasses = "text-xl font-bold text-white mb-6";
    const cardClasses = "bg-white/[0.025] border border-white/[0.06] rounded-2xl mb-5";

    // ─── Render helpers ────────────────────────────────────────────────────────

    const renderMovieGrid = (items: any[], type: "history" | "favorites") => {
        if (items.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                        {type === "history"
                            ? <History className="w-7 h-7 text-white/15" />
                            : <Heart className="w-7 h-7 text-white/15" />}
                    </div>
                    <p className="text-white/30 text-sm font-medium">
                        {type === "history" ? "Chưa có lịch sử xem" : "Chưa có phim yêu thích"}
                    </p>
                    <Link href="/" className="px-4 py-2 rounded-full bg-[#8FA7C5]/10 text-[#8FA7C5] text-sm font-medium hover:bg-[#8FA7C5]/20 transition-colors border border-[#8FA7C5]/20">
                        Khám phá phim
                    </Link>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {items.map((movie) => {
                    const slug   = movie.movieSlug   || movie.slug;
                    const name   = movie.movieName   || movie.name;
                    const poster = movie.moviePoster || movie.poster;
                    const year   = movie.movieYear   || movie.year;
                    const epSlug = movie.episodeSlug;
                    const href   = type === "history" && epSlug
                        ? `/xem-phim/${slug}/${epSlug}`
                        : `/phim/${slug}`;

                    return (
                        <div key={movie._id || slug} className="group relative">
                            <Link href={href} className="block">
                                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5 ring-1 ring-white/[0.06] group-hover:ring-[#8FA7C5]/30 transition-all duration-300 shadow-lg">
                                    <Image
                                        src={getImageUrl(poster || "")}
                                        alt={name}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        sizes="(max-width:640px) 110px, (max-width:1024px) 160px, 200px"
                                        quality={65}
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                        <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-lg">
                                            <Play className="w-4 h-4 text-black fill-black ml-0.5" />
                                        </div>
                                    </div>
                                    {/* Progress bar for history */}
                                    {type === "history" && movie.progress && (
                                        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10">
                                            <div className="h-full bg-[#8FA7C5]" style={{ width: `${Math.min(movie.progress, 100)}%` }} />
                                        </div>
                                    )}
                                    {/* Quality badge */}
                                    {movie.quality && (
                                        <div className="absolute top-1.5 left-1.5">
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#8FA7C5] text-[#080b12]">
                                                {movie.quality}
                                            </span>
                                        </div>
                                    )}
                                    {/* Favorite remove button */}
                                    {type === "favorites" && (
                                        <FavoriteButton movieData={movie} size="sm" />
                                    )}
                                </div>
                            </Link>
                            <div className="mt-2 px-0.5">
                                <p className="text-[11px] font-semibold text-white/75 line-clamp-2 leading-snug group-hover:text-white transition-colors">
                                    {name}
                                </p>
                                {year && <p className="text-[10px] text-white/30 mt-0.5">{year}</p>}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderContent = () => {
        switch (activeTab) {

            // ── Yêu thích ───────────────────────────────────────────────────
            case "favorites":
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <h2 className={titleClasses}>Phim yêu thích <span className="text-white/30 font-normal text-base">({favorites.length})</span></h2>
                        {renderMovieGrid(favorites, "favorites")}
                    </div>
                );

            // ── Lịch sử ─────────────────────────────────────────────────────
            case "history":
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <h2 className={titleClasses}>Lịch sử xem <span className="text-white/30 font-normal text-base">({history.length})</span></h2>
                        {renderMovieGrid(history, "history")}
                    </div>
                );

            // ── Bộ sưu tập ──────────────────────────────────────────────────
            case "lists":
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className={titleClasses}>Bộ sưu tập <span className="text-white/30 font-normal text-base">({playlists.length})</span></h2>
                            <button
                                onClick={() => { setModalMode("create"); setSelectedPlaylist(null); setIsModalOpen(true); }}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#8FA7C5]/10 border border-[#8FA7C5]/20 text-[#8FA7C5] text-[12px] font-bold rounded-xl hover:bg-[#8FA7C5]/20 transition-all active:scale-95"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Tạo mới
                            </button>
                        </div>
                        {isLoadingPlaylists ? (
                            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-white/20 animate-spin" /></div>
                        ) : playlists.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-4">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                    <ListVideo className="w-7 h-7 text-white/15" />
                                </div>
                                <p className="text-white/30 text-sm font-medium">Bạn chưa có bộ sưu tập nào</p>
                                <button
                                    onClick={() => { setModalMode("create"); setSelectedPlaylist(null); setIsModalOpen(true); }}
                                    className="px-4 py-2 rounded-full bg-[#8FA7C5]/10 text-[#8FA7C5] text-sm font-medium hover:bg-[#8FA7C5]/20 transition-colors border border-[#8FA7C5]/20"
                                >
                                    Tạo bộ sưu tập đầu tiên
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {playlists.map((playlist) => (
                                    <div key={playlist._id} className="group relative bg-white/[0.025] border border-white/[0.06] rounded-2xl p-5 hover:border-[#8FA7C5]/30 transition-all duration-300 overflow-hidden">
                                        <div className="absolute top-0 right-0 w-28 h-28 bg-[#8FA7C5]/5 blur-3xl rounded-full -mr-14 -mt-14 group-hover:bg-[#8FA7C5]/10 transition-all" />
                                        <h3 className="text-[16px] font-bold text-white mb-1.5 group-hover:text-[#8FA7C5] transition-colors">{playlist.name}</h3>
                                        <p className="text-white/30 text-xs line-clamp-2 min-h-[32px] mb-5">{playlist.description || "Bộ sưu tập phim cá nhân"}</p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
                                                    <Video className="w-3.5 h-3.5 text-white/40" />
                                                </div>
                                                <span className="text-white/60 text-xs font-semibold">{playlist.movies?.length || 0} phim</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => { setModalMode("edit"); setSelectedPlaylist(playlist); setIsModalOpen(true); }}
                                                    className="p-2 text-white/25 hover:text-white/70 transition-colors rounded-lg hover:bg-white/5"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <Link
                                                    href={`/thu-vien/${playlist._id}`}
                                                    className="p-2 text-white/25 hover:text-[#8FA7C5] transition-colors rounded-lg hover:bg-white/5"
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );

            // ── Cài đặt ─────────────────────────────────────────────────────
            case "settings":
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-[720px]">
                        {/* Thông tin cá nhân */}
                        <h2 className={titleClasses}>Thông tin cá nhân</h2>
                        <div className={cn(cardClasses, "p-5 md:p-6")}>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-white/40 text-[11px] font-bold uppercase tracking-wider">Tên hiển thị</label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3 text-sm text-white font-medium focus:border-[#8FA7C5]/50 focus:outline-none transition-all placeholder:text-white/20"
                                        placeholder="Nhập tên của bạn"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-white/40 text-[11px] font-bold uppercase tracking-wider">Địa chỉ Email</label>
                                    <input
                                        type="email"
                                        value={editEmail}
                                        onChange={(e) => setEditEmail(e.target.value)}
                                        className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3 text-sm text-white font-medium focus:border-[#8FA7C5]/50 focus:outline-none transition-all placeholder:text-white/20"
                                        placeholder="Nhập email"
                                    />
                                </div>
                                <div className="flex items-center gap-3 pt-1">
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={isSavingProfile}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black text-xs font-bold rounded-xl hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-40"
                                    >
                                        {isSavingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Lưu thay đổi"}
                                    </button>
                                    {saveMessage.text && (
                                        <span className={`text-[11px] font-bold ${saveMessage.type === "success" ? "text-[#8FA7C5]" : "text-red-400"}`}>
                                            {saveMessage.text}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Đổi mật khẩu */}
                        <h2 className="text-xl font-bold text-white mt-8 mb-5">Bảo mật mật khẩu</h2>
                        <div className={cn(cardClasses, "p-5 md:p-6")}>
                            <form onSubmit={handleChangePass} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-white/40 text-[11px] font-bold uppercase tracking-wider">Mật khẩu hiện tại</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                        <input
                                            type={showPass ? "text" : "password"}
                                            value={passwords.old}
                                            onChange={(e) => setPasswords({ ...passwords, old: e.target.value })}
                                            className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-[#8FA7C5]/50 focus:outline-none transition-all placeholder:text-white/20"
                                            placeholder="Mật khẩu hiện tại"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-white/40 text-[11px] font-bold uppercase tracking-wider">Mật khẩu mới</label>
                                        <div className="relative">
                                            <input
                                                type={showPass ? "text" : "password"}
                                                value={passwords.new}
                                                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                                className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3 text-sm text-white focus:border-[#8FA7C5]/50 focus:outline-none transition-all pr-10 placeholder:text-white/20"
                                                placeholder="Ít nhất 6 ký tự"
                                            />
                                            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors">
                                                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-white/40 text-[11px] font-bold uppercase tracking-wider">Xác nhận mật khẩu</label>
                                        <input
                                            type={showPass ? "text" : "password"}
                                            value={passwords.confirm}
                                            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                            className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3 text-sm text-white focus:border-[#8FA7C5]/50 focus:outline-none transition-all placeholder:text-white/20"
                                            placeholder="Nhập lại mật khẩu mới"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 pt-1">
                                    <button
                                        type="submit"
                                        disabled={isChangingPass}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black text-xs font-bold rounded-xl hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-40"
                                    >
                                        {isChangingPass ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Đặt lại mật khẩu"}
                                    </button>
                                    {passMessage.text && (
                                        <span className={`text-[11px] font-bold ${passMessage.type === "success" ? "text-[#8FA7C5]" : "text-red-400"}`}>
                                            {passMessage.text}
                                        </span>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* Tuỳ chỉnh giao diện */}
                        <h2 className="text-xl font-bold text-white mt-8 mb-5">Tuỳ chỉnh giao diện</h2>
                        <div className={cn(cardClasses, "p-5 md:p-6")}>
                            <div className="divide-y divide-white/[0.05]">
                                {([
                                    { key: "cinematicGlow", label: "Hiệu ứng Cinematic Glow", desc: "Ánh sáng rực rỡ cho poster phim" },
                                    { key: "glassmorphism", label: "Giao diện Glassmorphism", desc: "Hiệu ứng kính mờ cao cấp cho UI" },
                                    { key: "autoTrailer",   label: "Tự động phát Trailer",   desc: "Phát trailer khi di chuột qua phim" },
                                ] as const).map((item) => (
                                    <div key={item.key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                                        <div>
                                            <p className="text-sm font-semibold text-white">{item.label}</p>
                                            <p className="text-[11px] text-white/30 mt-0.5">{item.desc}</p>
                                        </div>
                                        <button
                                            onClick={() => togglePref(item.key)}
                                            className={cn(
                                                "relative w-10 h-[22px] rounded-full transition-all duration-300 flex-shrink-0",
                                                uiPrefs[item.key] ? "bg-[#8FA7C5]/60" : "bg-white/10"
                                            )}
                                        >
                                            <div className={cn(
                                                "absolute top-[3px] w-4 h-4 rounded-full transition-all duration-300",
                                                uiPrefs[item.key] ? "right-[3px] bg-white shadow-[0_0_8px_rgba(143,167,197,0.6)]" : "left-[3px] bg-white/30"
                                            )} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bảo mật */}
                        <h2 className="text-xl font-bold text-white mt-8 mb-5">Tóm tắt bảo mật</h2>
                        <div className={cn(cardClasses, "p-5 md:p-6")}>
                            <div className="space-y-3">
                                {[
                                    { label: "Mật khẩu", value: "Đã thiết lập", ok: true },
                                    { label: "Xác thực 2 lớp", value: "Chưa kích hoạt", ok: false },
                                    { label: "Thiết bị đăng nhập", value: "1 thiết bị", ok: true },
                                ].map((row, i) => (
                                    <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                                        <span className="text-white/40 text-xs font-medium">{row.label}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-white/70 text-[11px] font-semibold">{row.value}</span>
                                            <div className={cn("w-1.5 h-1.5 rounded-full", row.ok ? "bg-[#8FA7C5]" : "bg-orange-400/60")} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Đăng xuất */}
                        <div className="mt-8 pt-6 border-t border-white/[0.05]">
                            <button
                                onClick={() => signOut({ callbackUrl: "/login" })}
                                className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-red-400/80 hover:text-red-400 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 transition-all text-sm font-semibold"
                            >
                                <LogOut className="w-4 h-4" />
                                Đăng xuất khỏi tài khoản
                            </button>
                        </div>
                    </div>
                );

            // ── Tổng quan (account) ─────────────────────────────────────────
            case "account":
            default:
                return (
                    <div className="animate-in fade-in duration-300">
                        {/* Stats */}
                        <h2 className={titleClasses}>Hoạt động của bạn</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                            {[
                                { label: "Đã xem",     value: history.length,    icon: Play,     color: "#8FA7C5" },
                                { label: "Yêu thích",  value: favorites.length,  icon: Heart,    color: "#f87171" },
                                { label: "Sưu tập",    value: playlists.length,  icon: ListVideo, color: "#c084fc" },
                                { label: "Xem sau",    value: "—",               icon: Bookmark, color: "#34d399" },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white/[0.025] border border-white/[0.06] rounded-2xl p-4 relative overflow-hidden group cursor-default">
                                    <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full blur-2xl opacity-15 transition-opacity group-hover:opacity-25" style={{ backgroundColor: stat.color }} />
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/[0.03] border border-white/[0.05]">
                                            <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                                        </div>
                                        <span className="text-[26px] font-bold text-white leading-none">{stat.value}</span>
                                    </div>
                                    <p className="text-white/35 text-[10px] font-bold uppercase tracking-wider">{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Lịch sử gần đây */}
                        {history.length > 0 && (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-white">Xem gần đây</h2>
                                    <button onClick={() => setActiveTab("history")} className="text-[#8FA7C5] text-xs font-semibold hover:underline">
                                        Xem tất cả →
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-3 mb-8">
                                    {history.slice(0, 6).map((movie) => {
                                        const slug   = movie.movieSlug || movie.slug;
                                        const name   = movie.movieName || movie.name;
                                        const poster = movie.moviePoster || movie.poster;
                                        return (
                                            <Link key={movie._id || slug} href={movie.episodeSlug ? `/xem-phim/${slug}/${movie.episodeSlug}` : `/phim/${slug}`} className="group">
                                                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5 ring-1 ring-white/[0.06] group-hover:ring-[#8FA7C5]/30 transition-all">
                                                    <Image src={getImageUrl(poster || "")} alt={name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="110px" quality={60} />
                                                    {movie.progress && (
                                                        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10">
                                                            <div className="h-full bg-[#8FA7C5]" style={{ width: `${Math.min(movie.progress, 100)}%` }} />
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-[10px] font-medium text-white/55 line-clamp-1 mt-1.5 group-hover:text-white transition-colors">{name}</p>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {/* Profile info & Huy chương */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Profile summary */}
                            <div>
                                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-[#8FA7C5]" />
                                    Thông tin tài khoản
                                </h3>
                                <div className={cn(cardClasses, "p-4 mb-0 space-y-3")}>
                                    {[
                                        { label: "Thành viên từ", value: formatMemberSince(user?.createdAt) },
                                        { label: "Email",         value: user?.email || "—" },
                                        { label: "Vai trò",       value: user?.role === "admin" ? "Quản trị viên" : "Thành viên" },
                                    ].map((row, i) => (
                                        <div key={i} className="flex items-center justify-between text-xs">
                                            <span className="text-white/35 font-medium">{row.label}</span>
                                            <span className="text-white/70 font-semibold truncate max-w-[60%] text-right">{row.value}</span>
                                        </div>
                                    ))}
                                    <div className="pt-1">
                                        <div className="flex items-center justify-between text-xs mb-1.5">
                                            <span className="text-white/35 font-medium">Hoàn tất hồ sơ</span>
                                            <span className="text-white/70 font-bold">{profileCompletion}%</span>
                                        </div>
                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#8FA7C5]/60 rounded-full transition-all" style={{ width: `${profileCompletion}%` }} />
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setActiveTab("settings")} className="mt-3 text-[11px] text-[#8FA7C5] font-semibold hover:underline">
                                    Chỉnh sửa hồ sơ →
                                </button>
                            </div>

                            {/* Huy chương */}
                            <div>
                                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-yellow-400/60" />
                                    Huy chương & Danh hiệu
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-white/50">
                                        🎬 Mọt phim Tập sự
                                    </div>
                                    {history.length >= 10 && (
                                        <div className="px-3 py-1.5 rounded-lg bg-[#8FA7C5]/10 border border-[#8FA7C5]/20 text-[10px] font-bold text-[#8FA7C5]">
                                            🏆 Phim Cuồng
                                        </div>
                                    )}
                                    {favorites.length >= 5 && (
                                        <div className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-400">
                                            ❤️ Người yêu phim
                                        </div>
                                    )}
                                    <div className="px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.05] text-[10px] font-bold text-white/20 opacity-40">
                                        👑 Phê Phim Vương
                                    </div>
                                </div>
                                <p className="text-[10px] text-white/20 mt-3">Xem thêm phim để mở khoá huy chương mới</p>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-0 md:gap-12 min-h-screen">

            {/* ── Sidebar ───────────────────────────────────────────── */}
            <div className="w-full md:w-[240px] flex-shrink-0">
                <div className="md:sticky md:top-24">

                    {/* Avatar + Name */}
                    <div className="flex md:flex-col items-center md:items-start gap-4 md:gap-0 px-1 pb-5 md:pb-0 mb-2 md:mb-0">
                        <div className="relative group flex-shrink-0 mb-0 md:mb-6">
                            <div className="relative w-16 h-16 md:w-24 md:h-24 rounded-full overflow-hidden border border-white/10 bg-[#0a0a0c]">
                                {user?.image ? (
                                    <Image src={user.image} alt="" fill className="object-cover" unoptimized={user.image.startsWith("http")} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xl md:text-2xl font-bold bg-[#00695C] text-white">
                                        {(user?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) || "KH").toUpperCase()}
                                    </div>
                                )}
                                <button
                                    onClick={() => setIsAvatarModalOpen(true)}
                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200"
                                >
                                    <Camera className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 md:mb-8 min-w-0">
                            <h1 className="text-base md:text-lg font-bold text-white truncate">{user?.name}</h1>
                            <p className="text-[11px] text-white/30 truncate">{user?.email}</p>
                        </div>
                    </div>

                    {/* Nav */}
                    <nav className="flex md:flex-col gap-0.5 overflow-x-auto no-scrollbar md:overflow-visible pb-3 md:pb-0">
                        {navItems.map((item) => {
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={cn(
                                        "flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap shrink-0",
                                        isActive
                                            ? "text-[#8FA7C5] bg-[#8FA7C5]/8"
                                            : "text-white/35 hover:text-white/70 hover:bg-white/5"
                                    )}
                                >
                                    <item.icon className="w-4 h-4 shrink-0" />
                                    <span className="hidden md:inline">{item.label}</span>
                                    <span className="inline md:hidden text-xs">{item.label}</span>
                                    {item.count != null && item.count > 0 && (
                                        <span className={cn(
                                            "ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md hidden md:inline",
                                            isActive ? "bg-[#8FA7C5]/15 text-[#8FA7C5]" : "bg-white/5 text-white/30"
                                        )}>
                                            {item.count}
                                        </span>
                                    )}
                                    {isActive && <div className="ml-auto w-1 h-1 rounded-full bg-[#8FA7C5] hidden md:block flex-shrink-0" />}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Logout — desktop only */}
                    <div className="hidden md:block mt-6 pt-6 border-t border-white/[0.05]">
                        <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 text-white/25 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all text-sm font-medium w-full group"
                        >
                            <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            Đăng xuất
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Main Content ──────────────────────────────────────── */}
            <div className="flex-1 min-w-0 pt-2 pb-8">
                {renderContent()}
            </div>

            {/* ── Avatar Modal ──────────────────────────────────────── */}
            {isAvatarModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-[#0d1119] border border-white/[0.08] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg overflow-hidden flex flex-col max-h-[90vh] shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-300">
                        <div className="flex items-center justify-between px-6 pt-6 pb-4">
                            <h2 className="text-lg font-bold text-white">Đổi ảnh đại diện</h2>
                            <button onClick={() => setIsAvatarModalOpen(false)} className="text-white/30 hover:text-white transition-all p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex gap-6 px-6 border-b border-white/[0.06]">
                            {(["preset", "upload"] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setAvatarTab(tab)}
                                    className={cn(
                                        "pb-3 text-[12px] font-bold transition-all border-b-2",
                                        avatarTab === tab ? "text-[#8FA7C5] border-[#8FA7C5]" : "text-white/30 border-transparent hover:text-white/50"
                                    )}
                                >
                                    {tab === "preset" ? "Ảnh mặc định" : "Tải lên"}
                                </button>
                            ))}
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            {avatarTab === "preset" ? (
                                <div className="grid grid-cols-4 gap-3">
                                    {PRESET_AVATARS.map((url, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleAvatarSelect(url)}
                                            className={cn(
                                                "relative aspect-square rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 active:scale-95",
                                                user?.image === url ? "border-[#8FA7C5]" : "border-white/[0.06] hover:border-white/20"
                                            )}
                                        >
                                            <Image src={url} alt="" fill className="object-cover" unoptimized />
                                            {user?.image === url && (
                                                <div className="absolute inset-0 bg-[#8FA7C5]/20 flex items-center justify-center">
                                                    <div className="bg-white rounded-full p-1">
                                                        <Check className="w-3 h-3 text-[#8FA7C5]" />
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-white/[0.07] rounded-2xl">
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                                    <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                        {isUploading ? <Loader2 className="w-6 h-6 text-[#8FA7C5] animate-spin" /> : <Upload className="w-6 h-6 text-white/25" />}
                                    </div>
                                    <h4 className="text-sm font-bold text-white mb-1">{isUploading ? "Đang xử lý..." : "Tải ảnh từ thiết bị"}</h4>
                                    <p className="text-white/25 text-xs mb-5 text-center">JPG, PNG, WEBP — tối đa 5MB</p>
                                    {!isUploading && (
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-6 py-2.5 bg-white text-black text-xs font-bold rounded-xl hover:bg-gray-100 transition-all active:scale-95"
                                        >
                                            Chọn tệp
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
