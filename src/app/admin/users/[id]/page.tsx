"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Mail, Shield, User as UserIcon, Clock, Film, Trash2, X } from "lucide-react";
import { getImageUrl } from "@/lib/utils";
import Link from "next/link";

export default function AdminUserDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const [user, setUser] = useState<any>(null);
    const [watchHistory, setWatchHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    const showToast = (type: "success" | "error", msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        if (id) fetchUserDetail();
    }, [id]);

    const fetchUserDetail = async () => {
        try {
            const res = await fetch(`/api/admin/users/${id}`);
            const data = await res.json();
            if (data.user) {
                setUser(data.user);
                setWatchHistory(data.watchHistory || []);
            } else {
                router.push("/admin/users");
            }
        } catch {
            router.push("/admin/users");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleRole = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const newRole = user.role === "admin" ? "user" : "admin";
            const res = await fetch(`/api/admin/users/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: newRole }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setUser((u: any) => ({ ...u, role: newRole }));
            showToast("success", `Đã đổi sang vai trò ${newRole.toUpperCase()}`);
        } catch (err: any) {
            showToast("error", err.message || "Cập nhật thất bại");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            router.push("/admin/users");
        } catch (err: any) {
            showToast("error", err.message || "Xóa thất bại");
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    if (loading) return <div className="p-20 text-center text-gray-500">Đang tải thông tin...</div>;
    if (!user) return null;

    const isSelf = session?.user?.id === user._id?.toString();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-lg font-bold shadow-xl ${toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                    {toast.msg}
                </div>
            )}

            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
                <ArrowLeft className="w-5 h-5" /> Quay lại danh sách
            </button>

            {/* Profile Header */}
            <div className="bg-[#1a1a1a] rounded-lg border border-white/10 p-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/10 shadow-lg shrink-0">
                    <img
                        src={user.image ? getImageUrl(user.image) : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&size=128`}
                        alt={user.name}
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className="flex-1 text-center md:text-left space-y-3">
                    <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-400 text-sm">
                        <span className="flex items-center gap-2"><Mail className="w-4 h-4" /> {user.email}</span>
                        <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Tham gia {new Date(user.createdAt).toLocaleDateString("vi-VN")}</span>
                        <span className="flex items-center gap-2 capitalize text-gray-500">
                            Đăng nhập qua: {user.provider || "email"}
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-1">
                        <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold border ${user.role === "admin"
                            ? "bg-red-500/10 text-red-500 border-red-500/20"
                            : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                            }`}>
                            {user.role === "admin" ? <Shield className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                            {user.role.toUpperCase()}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold border bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                            <Film className="w-4 h-4" /> {watchHistory.length} phim đã xem
                        </span>
                    </div>
                </div>

                <div className="flex flex-col gap-3 shrink-0">
                    <button
                        onClick={handleToggleRole}
                        disabled={saving || isSelf}
                        title={isSelf ? "Không thể đổi vai trò của chính bạn" : ""}
                        className="px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Shield className="w-5 h-5" />
                        {saving ? "Đang xử lý..." : user.role === "admin" ? "Hạ xuống User" : "Thăng lên Admin"}
                    </button>
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        disabled={isSelf}
                        title={isSelf ? "Không thể xóa tài khoản của chính bạn" : ""}
                        className="px-6 py-3 bg-red-500/10 text-red-500 font-bold rounded-lg hover:bg-red-500 hover:text-white transition-colors border border-red-500/20 flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <Trash2 className="w-5 h-5" /> Xóa tài khoản
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-white/10 text-center">
                    <p className="text-2xl font-bold text-white">{watchHistory.length}</p>
                    <p className="text-gray-400 text-sm">Lịch sử xem</p>
                </div>
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-white/10 text-center">
                    <p className="text-2xl font-bold text-white">{user.favorites?.length || 0}</p>
                    <p className="text-gray-400 text-sm">Phim yêu thích</p>
                </div>
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-white/10 text-center">
                    <p className="text-2xl font-bold text-white">{user.watchlist?.length || 0}</p>
                    <p className="text-gray-400 text-sm">Xem sau</p>
                </div>
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-white/10 text-center">
                    <p className="text-2xl font-bold text-white">{user.favoriteActors?.length || 0}</p>
                    <p className="text-gray-400 text-sm">Diễn viên yêu thích</p>
                </div>
            </div>

            {/* Watch History */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Clock className="w-6 h-6 text-primary" /> Lịch sử xem phim ({watchHistory.length})
                </h2>

                {watchHistory.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {watchHistory.map((item: any) => (
                            <Link
                                href={`/phim/${item.movieSlug}`}
                                key={item._id}
                                className="bg-[#1a1a1a] p-4 rounded-lg border border-white/10 hover:border-primary/50 transition-all group flex gap-4"
                            >
                                <div className="w-16 h-24 bg-gray-800 rounded-lg overflow-hidden shrink-0">
                                    {item.movieThumb || item.moviePoster ? (
                                        <img
                                            src={getImageUrl(item.movieThumb || item.moviePoster)}
                                            alt={item.movieName}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                                            <Film className="w-6 h-6" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 py-1">
                                    <h3 className="font-bold text-white truncate group-hover:text-primary transition-colors text-sm">{item.movieName}</h3>
                                    <p className="text-gray-500 text-xs mt-1">Tập: <span className="text-white">{item.episodeName}</span></p>
                                    <div className="mt-2 bg-white/10 rounded-full h-1.5 overflow-hidden">
                                        <div className="bg-primary h-full rounded-full" style={{ width: `${item.progress || 0}%` }} />
                                    </div>
                                    <p className="text-gray-600 text-xs mt-1">{item.progress || 0}% đã xem</p>
                                    <p className="text-gray-500 text-xs mt-1">
                                        {new Date(item.lastWatched).toLocaleString("vi-VN")}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="p-10 bg-[#1a1a1a] rounded-lg border border-white/10 text-center text-gray-500">
                        Người dùng này chưa xem phim nào.
                    </div>
                )}
            </div>

            {/* Delete Confirm Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white">Xóa tài khoản</h3>
                            <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <p className="text-gray-300 mb-2">
                            Xóa tài khoản <span className="text-white font-bold">{user.name}</span>?
                        </p>
                        <p className="text-gray-500 text-sm mb-6">Toàn bộ lịch sử xem, danh sách yêu thích và dữ liệu liên quan sẽ bị xóa vĩnh viễn.</p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setShowDeleteModal(false)} className="px-5 py-2.5 bg-white/5 text-white rounded-lg hover:bg-white/10">Huỷ</button>
                            <button onClick={handleDelete} disabled={deleting} className="px-5 py-2.5 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 disabled:opacity-50">
                                {deleting ? "Đang xóa..." : "Xóa vĩnh viễn"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
