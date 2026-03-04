"use client";

import { useState } from "react";
import { X, Loader2, Edit2, Trash2, Check } from "lucide-react";

interface PlaylistManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    mode: "create" | "edit";
    playlist?: any;
}

export default function PlaylistManagerModal({ isOpen, onClose, onSuccess, mode, playlist }: PlaylistManagerModalProps) {
    const [name, setName] = useState(playlist?.name || "");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    // Reset state before showing
    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!name.trim()) {
            setError("Vui lòng nhập tên danh sách");
            return;
        }

        setIsLoading(true);
        try {
            if (mode === "create") {
                const res = await fetch("/api/user/playlists", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: name.trim() }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Có lỗi xảy ra");
            } else if (mode === "edit" && playlist) {
                const res = await fetch(`/api/user/playlists/${playlist._id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "rename", newName: name.trim() }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Có lỗi xảy ra");
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!playlist) return;
        if (!confirm(`Bạn có chắc muốn xoá danh sách "${playlist.name}" không? Các phim trong danh sách sẽ không bị ảnh hưởng.`)) return;

        setIsDeleting(true);
        setError("");
        try {
            const res = await fetch(`/api/user/playlists/${playlist._id}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Có lỗi xảy ra");
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/5">
                    <h3 className="text-xl font-bold text-white">
                        {mode === "create" ? "Tạo danh sách mới" : "Chỉnh sửa danh sách"}
                    </h3>
                    <button onClick={onClose} className="p-2 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-white/70 text-sm font-medium mb-2">Tên danh sách</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="VD: Phim Cày Đêm, Hành Động Hay..."
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#fbbf24] focus:ring-1 focus:ring-[#fbbf24] transition-all"
                                autoFocus
                            />
                            {error && <p className="text-red-500 text-xs mt-2 font-medium">{error}</p>}
                        </div>

                        <div className="flex items-center gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading || isDeleting}
                                className="flex-1 py-3 px-4 rounded-xl font-bold text-black bg-[#fbbf24] hover:brightness-110 transition-colors flex items-center justify-center disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (mode === "create" ? "Tạo mới" : "Lưu thay đổi")}
                            </button>
                        </div>
                    </form>

                    {mode === "edit" && (
                        <div className="mt-6 pt-6 border-t border-white/10">
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting || isLoading}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                                Xoá danh sách này
                            </button>
                            <p className="text-white/40 text-[11px] text-center mt-3">Hành động này không thể hoàn tác.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
