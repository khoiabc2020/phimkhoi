"use client";

import { useState, useEffect } from "react";
import { Search, Filter, MoreVertical, Eye, Trash2, Shield, User as UserIcon, Calendar, Mail } from "lucide-react";
import Link from "next/link";
import { getImageUrl } from "@/lib/utils";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/admin/users");
            const data = await res.json();
            if (data.users) setUsers(data.users);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Quản Lý Thành Viên</h1>
                    <p className="text-gray-400">Xem và quản lý tất cả tài khoản người dùng</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-colors flex items-center gap-2">
                        <Filter className="w-4 h-4" /> Bộ lọc
                    </button>
                    <button className="px-4 py-2 bg-primary text-black font-bold rounded-xl hover:bg-yellow-400 transition-colors shadow-lg shadow-primary/20">
                        + Thêm mới
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Tìm kiếm theo tên hoặc email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-primary transition-all shadow-xl"
                />
            </div>

            {/* Users Table */}
            <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                {loading ? (
                    <div className="p-20 text-center text-gray-500">Đang tải dữ liệu...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 border-b border-white/10 text-gray-400 uppercase text-xs font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-5">Thành viên</th>
                                    <th className="px-6 py-5">Vai trò</th>
                                    <th className="px-6 py-5">Ngày tham gia</th>
                                    <th className="px-6 py-5 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredUsers.map((user) => (
                                    <tr key={user._id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-800 border-2 border-white/10 group-hover:border-primary transition-colors">
                                                    <img
                                                        src={user.image ? getImageUrl(user.image) : `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                                                        alt={user.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold text-base group-hover:text-primary transition-colors">{user.name}</p>
                                                    <div className="flex items-center gap-1 text-gray-500 text-sm">
                                                        <Mail className="w-3 h-3" /> {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${user.role === 'admin'
                                                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                                : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                }`}>
                                                {user.role === 'admin' ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                                                {user.role.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-600" />
                                                {new Date(user.createdAt).toLocaleDateString('vi-VN')}
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
                                                <button className="p-2 rounded-lg bg-white/5 hover:bg-red-500 hover:text-white text-red-500 transition-all" title="Xóa">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 rounded-lg bg-white/5 hover:bg-white/20 text-gray-400 hover:text-white transition-all">
                                                    <MoreVertical className="w-4 h-4" />
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

            {/* Pagination (Mock UI) */}
            <div className="flex items-center justify-between text-sm text-gray-500">
                <p>Hiển thị {filteredUsers.length} kết quả</p>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-[#1a1a1a] rounded-lg hover:bg-white/10 disabled:opacity-50">Trước</button>
                    <button className="px-4 py-2 bg-primary text-black font-bold rounded-lg">1</button>
                    <button className="px-4 py-2 bg-[#1a1a1a] rounded-lg hover:bg-white/10">2</button>
                    <button className="px-4 py-2 bg-[#1a1a1a] rounded-lg hover:bg-white/10">3</button>
                    <button className="px-4 py-2 bg-[#1a1a1a] rounded-lg hover:bg-white/10">Sau</button>
                </div>
            </div>
        </div>
    );
}
