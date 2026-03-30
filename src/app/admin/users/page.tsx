"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Filter, Eye, Trash2, Shield, User as UserIcon, Calendar, Mail, ChevronLeft, ChevronRight, X, RefreshCw } from "lucide-react";
import Link from "next/link";
import { getImageUrl } from "@/lib/utils";
import { useSession } from "next-auth/react";

type User = {
    _id: string;
    name: string;
    email: string;
    image?: string;
    role: "admin" | "user";
    createdAt: string;
    provider?: string;
};

export default function AdminUsersPage() {
    const { data: session } = useSession();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Modal states
    const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
    const [confirmRole, setConfirmRole] = useState<{ user: User; newRole: "admin" | "user" } | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    const showToast = (type: "success" | "error", msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: "20" });
            if (searchTerm) params.set("search", searchTerm);
            if (roleFilter) params.set("role", roleFilter);
            const res = await fetch(`/api/admin/users?${params}`);
            const data = await res.json();
            if (data.users) {
                setUsers(data.users);
                setTotalPages(data.totalPages || 1);
                setTotal(data.total || 0);
            }
        } catch {
            showToast("error", "Không thể tải danh sách thành viên");
        } finally {
            setLoading(false);
        }
    }, [page, searchTerm, roleFilter]);

    useEffect(() => {
        const t = setTimeout(() => fetchUsers(), searchTerm ? 400 : 0);
        return () => clearTimeout(t);
    }, [fetchUsers, searchTerm]);

    const handleDelete = async () => {
        if (!confirmDelete) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/users/${confirmDelete._id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setConfirmDelete(null);
            showToast("success", `Đã xóa tài khoản ${confirmDelete.name}`);
            fetchUsers();
        } catch (err: any) {
            showToast("error", err.message || "Xóa thất bại");
        } finally {
            setActionLoading(false);
        }
    };

    const handleRoleChange = async () => {
        if (!confirmRole) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/users/${confirmRole.user._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: confirmRole.newRole }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setConfirmRole(null);
            showToast("success", `Đã đổi vai trò thành ${confirmRole.newRole.toUpperCase()}`);
            fetchUsers();
        } catch (err: any) {
            showToast("error", err.message || "Cập nhật thất bại");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-lg font-bold shadow-xl transition-all ${toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Quản Lý Thành Viên</h1>
                    <p className="text-gray-400">Tổng cộng <span className="text-primary font-bold">{total}</span> tài khoản</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => fetchUsers()} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 transition-colors flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" /> Làm mới
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm theo tên hoặc email..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white focus:outline-none focus:border-primary transition-all"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                    className="bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                >
                    <option value="">Tất cả vai trò</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-[#1a1a1a] rounded-lg border border-white/10 overflow-hidden shadow-2xl">
                {loading ? (
                    <div className="p-20 text-center text-gray-500">Đang tải dữ liệu...</div>
                ) : users.length === 0 ? (
                    <div className="p-20 text-center text-gray-500">Không tìm thấy thành viên nào</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 border-b border-white/10 text-gray-400 uppercase text-xs font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-5">Thành viên</th>
                                    <th className="px-6 py-5">Vai trò</th>
                                    <th className="px-6 py-5">Đăng nhập qua</th>
                                    <th className="px-6 py-5">Ngày tham gia</th>
                                    <th className="px-6 py-5 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {users.map((user) => (
                                    <tr key={user._id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-800 border-2 border-white/10 group-hover:border-primary transition-colors shrink-0">
                                                    <img
                                                        src={user.image ? getImageUrl(user.image) : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                                                        alt={user.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold group-hover:text-primary transition-colors">{user.name}</p>
                                                    <div className="flex items-center gap-1 text-gray-500 text-sm">
                                                        <Mail className="w-3 h-3" /> {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => setConfirmRole({ user, newRole: user.role === "admin" ? "user" : "admin" })}
                                                disabled={user._id === session?.user?.id}
                                                title={user._id === session?.user?.id ? "Không thể đổi vai trò của chính bạn" : "Click để đổi vai trò"}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${user.role === "admin"
                                                    ? "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
                                                    : "bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20"
                                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                {user.role === "admin" ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                                                {user.role.toUpperCase()}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 text-sm capitalize">
                                            {user.provider || "email"}
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-600" />
                                                {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link
                                                    href={`/admin/users/${user._id}`}
                                                    className="p-2 rounded-lg bg-white/5 hover:bg-blue-500 hover:text-white text-blue-500 transition-all"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => setConfirmDelete(user)}
                                                    disabled={user._id === session?.user?.id}
                                                    className="p-2 rounded-lg bg-white/5 hover:bg-red-500 hover:text-white text-red-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                    title="Xóa tài khoản"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-gray-500">
                    <p>Trang {page} / {totalPages} — {total} thành viên</p>
                    <div className="flex gap-2 items-center">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 bg-[#1a1a1a] rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                            return (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${p === page ? "bg-primary text-black" : "bg-[#1a1a1a] hover:bg-white/10 text-white"}`}
                                >
                                    {p}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-2 bg-[#1a1a1a] rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white">Xác nhận xóa</h3>
                            <button onClick={() => setConfirmDelete(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <p className="text-gray-300 mb-2">
                            Bạn có chắc muốn xóa tài khoản <span className="text-white font-bold">{confirmDelete.name}</span>?
                        </p>
                        <p className="text-gray-500 text-sm mb-6">Hành động này không thể hoàn tác. Toàn bộ lịch sử xem sẽ bị xóa.</p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setConfirmDelete(null)} className="px-5 py-2.5 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors">Huỷ</button>
                            <button onClick={handleDelete} disabled={actionLoading} className="px-5 py-2.5 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50">
                                {actionLoading ? "Đang xóa..." : "Xóa tài khoản"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Role Change Confirm Modal */}
            {confirmRole && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white">Đổi vai trò</h3>
                            <button onClick={() => setConfirmRole(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <p className="text-gray-300 mb-6">
                            Đổi vai trò của <span className="text-white font-bold">{confirmRole.user.name}</span> sang{" "}
                            <span className={`font-bold ${confirmRole.newRole === "admin" ? "text-red-400" : "text-blue-400"}`}>
                                {confirmRole.newRole.toUpperCase()}
                            </span>?
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setConfirmRole(null)} className="px-5 py-2.5 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors">Huỷ</button>
                            <button onClick={handleRoleChange} disabled={actionLoading} className="px-5 py-2.5 bg-primary text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50">
                                {actionLoading ? "Đang xử lý..." : "Xác nhận"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
