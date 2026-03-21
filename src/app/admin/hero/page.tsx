"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Loader2, Save, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";

interface CustomHero {
    _id: string;
    movieId: string;
    slug: string;
    name: string;
    layer_bg: string;
    layer_character: string;
    layer_logo: string;
    order: number;
    isActive: boolean;
}

export default function AdminHeroPage() {
    const { data: session } = useSession();
    const [heroes, setHeroes] = useState<CustomHero[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Form state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        movieId: "",
        slug: "",
        name: "",
        layer_bg: "",
        layer_character: "",
        layer_logo: "",
        order: 0,
        isActive: true,
    });

    useEffect(() => {
        fetchHeroes();
    }, []);

    const fetchHeroes = async () => {
        try {
            const res = await fetch("/api/admin/hero");
            const data = await res.json();
            if (data.success) {
                setHeroes(data.items);
            }
        } catch (error) {
            console.error("Failed to fetch heroes:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (hero?: CustomHero) => {
        if (hero) {
            setEditingId(hero._id);
            setFormData({
                movieId: hero.movieId,
                slug: hero.slug,
                name: hero.name,
                layer_bg: hero.layer_bg,
                layer_character: hero.layer_character,
                layer_logo: hero.layer_logo,
                order: hero.order,
                isActive: hero.isActive,
            });
        } else {
            setEditingId(null);
            setFormData({
                movieId: "",
                slug: "",
                name: "",
                layer_bg: "",
                layer_character: "",
                layer_logo: "",
                order: heroes.length,
                isActive: true,
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const url = editingId ? `/api/admin/hero/${editingId}` : "/api/admin/hero";
            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            
            if (data.success) {
                setIsModalOpen(false);
                fetchHeroes();
            } else {
                alert(data.error || "Failed to save");
            }
        } catch (error) {
            console.error("Error saving hero:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa "${name}" khỏi Hero?`)) return;
        
        try {
            const res = await fetch(`/api/admin/hero/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                fetchHeroes();
            }
        } catch (error) {
            console.error("Error deleting hero:", error);
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Quản lý Custom Hero</h1>
                    <p className="text-gray-400 text-sm">Thiết lập phim hiển thị trên Hero Banner dạng 3 lớp (Background, Character, Logo).</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Thêm Hero
                </button>
            </div>

            {/* List */}
            <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                {isLoading ? (
                    <div className="p-10 flex justify-center">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : heroes.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">
                        Chưa có phim nào trên Hero. Hệ thống đang hiển thị Phim Thịnh Hành mặc định.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/10 text-sm text-gray-400">
                                    <th className="p-4 font-medium">Preview (Logo)</th>
                                    <th className="p-4 font-medium">Tên phim</th>
                                    <th className="p-4 font-medium">Slug</th>
                                    <th className="p-4 font-medium">Thứ tự</th>
                                    <th className="p-4 font-medium">Trạng thái</th>
                                    <th className="p-4 font-medium text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {heroes.map((hero) => (
                                    <tr key={hero._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4">
                                            <div className="w-24 h-12 bg-black/50 border border-white/10 rounded overflow-hidden relative flex items-center justify-center">
                                                {hero.layer_logo ? (
                                                    <Image src={hero.layer_logo} alt="Logo" fill className="object-contain p-1" unoptimized />
                                                ) : (
                                                    <ImageIcon className="w-5 h-5 text-gray-600" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 font-bold text-white">{hero.name}</td>
                                        <td className="p-4 text-sm text-gray-400">{hero.slug}</td>
                                        <td className="p-4 text-sm text-gray-300">{hero.order}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs font-bold rounded ${hero.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {hero.isActive ? 'Hiển thị' : 'Đang ẩn'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(hero)}
                                                    className="p-2 text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(hero._id, hero.name)}
                                                    className="p-2 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                                    title="Xóa"
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

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-[#1a1c23] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl my-8 relative">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#1a1c23] rounded-t-2xl z-10">
                            <h2 className="text-xl font-bold text-white">
                                {editingId ? "Chỉnh sửa Custom Hero" : "Thêm Custom Hero"}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Tên phim *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-primary transition-colors"
                                        placeholder="Vd: Quỷ Cẩu"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Slug phim *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-primary transition-colors"
                                        placeholder="Vd: quy-cau"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Dùng để trỏ link đến trang chi tiết.</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">URL Ảnh Nền (Background) *</label>
                                <input
                                    type="url"
                                    required
                                    value={formData.layer_bg}
                                    onChange={(e) => setFormData({ ...formData, layer_bg: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-primary transition-colors"
                                    placeholder="https://..."
                                />
                                <p className="text-xs text-gray-500 mt-1">Ảnh phong cảnh nằm dưới cùng, chiếm toàn bộ màn hình ngang.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">URL Ảnh Nhân Vật (Character Transparent) *</label>
                                <input
                                    type="url"
                                    required
                                    value={formData.layer_character}
                                    onChange={(e) => setFormData({ ...formData, layer_character: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-primary transition-colors"
                                    placeholder="https://..."
                                />
                                <p className="text-xs text-gray-500 mt-1">Ảnh PNG tách nền hiển thị nhân vật chồng lên ảnh nền chính.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">URL Ảnh Logo (Title Transparent) *</label>
                                <input
                                    type="url"
                                    required
                                    value={formData.layer_logo}
                                    onChange={(e) => setFormData({ ...formData, layer_logo: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-primary transition-colors"
                                    placeholder="https://..."
                                />
                                <p className="text-xs text-gray-500 mt-1">Ảnh PNG text tên phim bự (thay vì chữ gõ thông thường).</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Thứ tự hiển thị (Order)</label>
                                    <input
                                        type="number"
                                        value={formData.order}
                                        onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-primary transition-colors"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Số nhỏ xếp trước.</p>
                                </div>
                                <div className="flex items-center mt-6">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                            className="w-5 h-5 rounded bg-black/50 border-white/10 text-primary accent-primary"
                                        />
                                        <span className="text-sm font-medium text-white">Kích hoạt (Hiển thị)</span>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/10 flex justify-end gap-3 sticky bottom-0 bg-[#1a1c23] pb-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 rounded-lg font-medium text-white hover:bg-white/10 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-5 py-2.5 rounded-lg font-bold bg-primary text-black hover:bg-yellow-400 transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Lưu lại
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* PREVIEW COMPONENT? Maybe later */}
        </div>
    );
}
