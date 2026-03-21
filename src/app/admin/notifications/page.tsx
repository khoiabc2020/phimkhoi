"use client";

import { useState, useEffect } from "react";
import { Bell, Plus, Trash2, Loader2, Info, AlertTriangle, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

type Notification = {
    _id: string;
    title: string;
    message: string;
    link?: string;
    type: "info" | "success" | "warning" | "error";
    isGlobal: boolean;
    createdAt: string;
};

export default function AdminNotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        message: "",
        link: "",
        type: "info",
    });

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/admin/notifications");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setNotifications(data);
        } catch (error) {
            toast.error("Lỗi khi tải danh sách thông báo");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/admin/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, isGlobal: true }),
            });

            if (!res.ok) throw new Error("Thêm thất bại");
            
            toast.success("Đã gửi thông báo thành công!");
            setFormData({ title: "", message: "", link: "", type: "info" });
            setShowForm(false);
            fetchNotifications();
        } catch (error) {
            toast.error("Lỗi khi thêm thông báo");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn có chắc muốn xóa thông báo này?")) return;
        
        try {
            const res = await fetch(`/api/admin/notifications/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Xóa thất bại");
            
            toast.success("Đã xóa thông báo");
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (error) {
            toast.error("Lỗi khi xóa thông báo");
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Quản lý Thông báo</h1>
                    <p className="text-gray-400">Gửi và quản lý thông báo hệ thống cho tất cả người dùng</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                >
                    {showForm ? <Bell className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    {showForm ? "Đóng form" : "Tạo thông báo"}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="bg-[#111] border border-white/10 rounded-xl p-6 mb-8 shadow-xl">
                    <h2 className="text-xl font-semibold mb-6">Tạo thông báo mới (Toàn Hệ Thống)</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Tiêu đề *</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                                placeholder="VD: Bảo trì hệ thống..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Nội dung *</label>
                            <textarea
                                required
                                rows={3}
                                value={formData.message}
                                onChange={e => setFormData({ ...formData, message: e.target.value })}
                                className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary resize-none"
                                placeholder="Nội dung chi tiết..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Đường dẫn liên kết (Link - Không bắt buộc)</label>
                                <input
                                    type="text"
                                    value={formData.link}
                                    onChange={e => setFormData({ ...formData, link: e.target.value })}
                                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                                    placeholder="https://..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Loại thông báo</label>
                                <select
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                                >
                                    <option value="info">Thông tin (Xanh lam)</option>
                                    <option value="success">Thành công (Xanh lá)</option>
                                    <option value="warning">Cảnh báo (Vàng)</option>
                                    <option value="error">Quan trọng (Đỏ)</option>
                                </select>
                            </div>
                        </div>
                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-6 py-2 bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Phát sóng công khai"}
                            </button>
                        </div>
                    </div>
                </form>
            )}

            <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
                {isLoading ? (
                    <div className="p-8 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        Chưa có thông báo nào.
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {notifications.map((notif) => (
                            <div key={notif._id} className="p-4 hover:bg-white/5 transition-colors flex items-start gap-4 group">
                                <div className={`p-2 rounded-lg shrink-0 ${
                                    notif.type === 'error' ? 'bg-red-500/10 text-red-500' :
                                    notif.type === 'warning' ? 'bg-yellow-500/10 text-yellow-500' :
                                    notif.type === 'success' ? 'bg-green-500/10 text-green-500' :
                                    'bg-blue-500/10 text-blue-500'
                                }`}>
                                    {notif.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : 
                                     notif.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : 
                                     notif.type === 'success' ? <CheckCircle className="w-5 h-5" /> : 
                                     <Info className="w-5 h-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-4 mb-1">
                                        <h3 className="font-semibold text-white truncate">{notif.title}</h3>
                                        <span className="text-xs text-gray-500 shrink-0">
                                            {new Date(notif.createdAt).toLocaleDateString("vi-VN", { hour: '2-digit', minute:'2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-400 mb-2">{notif.message}</p>
                                    {notif.link && (
                                        <a href={notif.link} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                                            {notif.link}
                                        </a>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDelete(notif._id)}
                                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    title="Xóa thông báo"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
