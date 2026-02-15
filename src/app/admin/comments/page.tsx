"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Trash2, MessageSquare, ExternalLink, User } from "lucide-react";
import Link from "next/link";
import { getImageUrl } from "@/lib/utils";

export default function AdminCommentsPage() {
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedComments, setSelectedComments] = useState<string[]>([]);

    useEffect(() => {
        fetchComments();
    }, []);

    const fetchComments = async () => {
        try {
            const res = await fetch("/api/admin/comments");
            const data = await res.json();
            if (data.comments) setComments(data.comments);
        } catch (error) {
            console.error("Failed to fetch comments", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (selectedComments.length === 0) return;
        if (!confirm(`Bạn có chắc muốn xóa ${selectedComments.length} bình luận?`)) return;

        try {
            const res = await fetch("/api/admin/comments/delete", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: selectedComments }),
            });

            if (res.ok) {
                setComments(comments.filter(c => !selectedComments.includes(c._id)));
                setSelectedComments([]);
                alert("Đã xóa bình luận thành công!");
            }
        } catch (error) {
            alert("Xóa thất bại");
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedComments.includes(id)) {
            setSelectedComments(selectedComments.filter(c => c !== id));
        } else {
            setSelectedComments([...selectedComments, id]);
        }
    };

    const toggleSelectAll = () => {
        if (selectedComments.length === comments.length) {
            setSelectedComments([]);
        } else {
            setSelectedComments(comments.map(c => c._id));
        }
    };

    const filteredComments = comments.filter(c =>
        c.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.movieSlug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Quản Lý Bình Luận</h1>
                    <p className="text-gray-400">Kiểm duyệt và quản lý bình luận từ người dùng</p>
                </div>
                <div className="flex gap-2">
                    {selectedComments.length > 0 && (
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors flex items-center gap-2 shadow-lg shadow-red-500/20"
                        >
                            <Trash2 className="w-4 h-4" /> Xóa ({selectedComments.length})
                        </button>
                    )}
                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-colors flex items-center gap-2">
                        <Filter className="w-4 h-4" /> Bộ lọc
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Tìm kiếm nội dung, người dùng, tên phim..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-primary transition-all shadow-xl"
                />
            </div>

            {/* Comments Table */}
            <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                {loading ? (
                    <div className="p-20 text-center text-gray-500">Đang tải bình luận...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 border-b border-white/10 text-gray-400 uppercase text-xs font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-5 w-10">
                                        <input
                                            type="checkbox"
                                            checked={selectedComments.length === comments.length && comments.length > 0}
                                            onChange={toggleSelectAll}
                                            className="rounded border-gray-600 bg-gray-700 text-primary focus:ring-primary"
                                        />
                                    </th>
                                    <th className="px-6 py-5">Người dùng</th>
                                    <th className="px-6 py-5">Nội dung</th>
                                    <th className="px-6 py-5">Phim</th>
                                    <th className="px-6 py-5 text-right">Ngày đăng</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredComments.map((comment) => (
                                    <tr key={comment._id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedComments.includes(comment._id)}
                                                onChange={() => toggleSelect(comment._id)}
                                                className="rounded border-gray-600 bg-gray-700 text-primary focus:ring-primary"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 border border-white/10">
                                                    <img
                                                        src={comment.userId?.image ? getImageUrl(comment.userId.image) : `https://ui-avatars.com/api/?name=${comment.userId?.name || 'User'}&background=random`}
                                                        alt={comment.userId?.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold text-sm">{comment.userId?.name || "Người dùng ẩn"}</p>
                                                    <p className="text-gray-500 text-xs">{comment.userId?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-md">
                                            <p className="text-gray-300 text-sm line-clamp-2">{comment.content}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link href={`/phim/${comment.movieSlug}`} target="_blank" className="flex items-center gap-1 text-primary hover:underline text-sm font-medium">
                                                {comment.movieSlug} <ExternalLink className="w-3 h-3" />
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-500 text-xs">
                                            {new Date(comment.createdAt).toLocaleString('vi-VN')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {!loading && filteredComments.length === 0 && (
                    <div className="p-20 text-center text-gray-500">
                        <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-700" />
                        <p>Chưa có bình luận nào.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
