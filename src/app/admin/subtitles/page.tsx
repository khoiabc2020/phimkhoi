"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Save, Search, Trash2, X } from "lucide-react";

interface SubtitleItem {
    _id: string;
    movieId?: string;
    movieSlug: string;
    movieName: string;
    episodeSlug: string;
    episodeName?: string;
    language: string;
    label: string;
    format: string;
    sourceType: string;
    sourceName?: string;
    url?: string;
    content?: string;
    isDefault?: boolean;
    notes?: string;
    updatedAt?: string;
}

const emptyForm = {
    movieId: "",
    movieSlug: "",
    movieName: "",
    episodeSlug: "",
    episodeName: "",
    language: "vi",
    label: "VI",
    format: "srt",
    sourceType: "url",
    sourceName: "manual",
    url: "",
    content: "",
    isDefault: true,
    notes: "",
};

export default function AdminSubtitlesPage() {
    const [items, setItems] = useState<SubtitleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<SubtitleItem | null>(null);
    const [formData, setFormData] = useState(emptyForm);

    useEffect(() => {
        fetchItems(page, query);
    }, [page, query]);

    const fetchItems = async (targetPage: number, targetQuery: string) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: String(targetPage),
                limit: "20",
            });
            if (targetQuery) params.set("q", targetQuery);

            const res = await fetch(`/api/admin/subtitles?${params.toString()}`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Không tải được subtitles.");

            setItems(data.items || []);
            setTotalPages(data.pagination?.totalPages || 1);
            setTotalItems(data.pagination?.totalItems || 0);
        } catch (error: any) {
            setMessage(error?.message || "Không tải được subtitles.");
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingItem(null);
        setFormData(emptyForm);
        setIsModalOpen(true);
    };

    const openEditModal = async (item: SubtitleItem) => {
        try {
            const res = await fetch(`/api/admin/subtitles/${item._id}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Không tải được subtitle.");

            const subtitle = data.item as SubtitleItem;
            setEditingItem(subtitle);
            setFormData({
                movieId: subtitle.movieId || "",
                movieSlug: subtitle.movieSlug || "",
                movieName: subtitle.movieName || "",
                episodeSlug: subtitle.episodeSlug || "",
                episodeName: subtitle.episodeName || "",
                language: subtitle.language || "vi",
                label: subtitle.label || "",
                format: subtitle.format || "srt",
                sourceType: subtitle.sourceType || "url",
                sourceName: subtitle.sourceName || "",
                url: subtitle.url || "",
                content: subtitle.content || "",
                isDefault: Boolean(subtitle.isDefault),
                notes: subtitle.notes || "",
            });
            setIsModalOpen(true);
        } catch (error: any) {
            setMessage(error?.message || "Không tải được subtitle.");
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData(emptyForm);
    };

    const handleSave = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            setSaving(true);
            setMessage("");

            const url = editingItem ? `/api/admin/subtitles/${editingItem._id}` : "/api/admin/subtitles";
            const method = editingItem ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Không lưu được subtitle.");

            setMessage(editingItem ? "Đã cập nhật subtitle." : "Đã tạo subtitle.");
            closeModal();
            fetchItems(page, query);
        } catch (error: any) {
            setMessage(error?.message || "Không lưu được subtitle.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (item: SubtitleItem) => {
        if (!confirm(`Xóa subtitle ${item.label} của ${item.movieName} / ${item.episodeSlug}?`)) return;
        try {
            const res = await fetch(`/api/admin/subtitles/${item._id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Không xóa được subtitle.");

            setMessage("Đã xóa subtitle.");
            fetchItems(page, query);
        } catch (error: any) {
            setMessage(error?.message || "Không xóa được subtitle.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Quản Lý Subtitle</h1>
                    <p className="text-gray-400 mt-1">Quản lý subtitle theo phim, tập và ngôn ngữ. Đây là nền dữ liệu để nối tiếp sang player song ngữ và tìm sub tự động.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="px-4 py-2.5 rounded-lg bg-primary text-black hover:bg-yellow-400 transition-colors font-bold flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Thêm Subtitle
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#141414] border border-white/10 rounded-2xl p-5">
                    <div className="text-gray-400 text-sm">Tổng subtitle</div>
                    <div className="text-white text-3xl font-black mt-2">{totalItems.toLocaleString()}</div>
                </div>
                <div className="bg-[#141414] border border-white/10 rounded-2xl p-5">
                    <div className="text-gray-400 text-sm">Trang hiện tại</div>
                    <div className="text-white text-3xl font-black mt-2">{page}/{totalPages}</div>
                </div>
                <div className="bg-[#141414] border border-white/10 rounded-2xl p-5">
                    <div className="text-gray-400 text-sm">Provider đề xuất</div>
                    <div className="text-white text-lg font-bold mt-2">OpenSubtitles</div>
                    <div className="text-gray-500 text-xs mt-1">Bước tiếp theo là nối API tìm tự động và ghép vào player.</div>
                </div>
            </div>

            <div className="bg-[#141414] border border-white/10 rounded-2xl p-4">
                <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    setPage(1);
                                    setQuery(searchInput.trim());
                                }
                            }}
                            placeholder="Tìm theo phim, tập, language, label..."
                            className="w-full bg-black/50 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-white outline-none focus:border-primary"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setPage(1);
                                setQuery(searchInput.trim());
                            }}
                            className="px-4 py-2.5 rounded-lg bg-white/10 text-white font-semibold hover:bg-white/15 transition-colors"
                        >
                            Tìm kiếm
                        </button>
                        <button
                            onClick={() => {
                                setSearchInput("");
                                setQuery("");
                                setPage(1);
                            }}
                            className="px-4 py-2.5 rounded-lg bg-white/5 text-gray-300 font-semibold hover:bg-white/10 transition-colors"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {message && (
                <div className="px-4 py-3 rounded-xl border border-[#8FA7C5]/20 bg-[#8FA7C5]/10 text-[#d7e0ec] text-sm">
                    {message}
                </div>
            )}

            <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="py-20 flex justify-center">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : items.length === 0 ? (
                    <div className="py-20 text-center text-gray-500">
                        Chưa có subtitle nào trong hệ thống.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1100px]">
                            <thead className="bg-white/5 border-b border-white/10 text-left text-xs uppercase tracking-wider text-gray-400">
                                <tr>
                                    <th className="p-4">Phim / Tập</th>
                                    <th className="p-4">Ngôn ngữ</th>
                                    <th className="p-4">Nguồn</th>
                                    <th className="p-4">Mặc định</th>
                                    <th className="p-4">Cập nhật</th>
                                    <th className="p-4 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr key={item._id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                        <td className="p-4">
                                            <div className="font-bold text-white">{item.movieName}</div>
                                            <div className="text-sm text-gray-400">{item.movieSlug} / {item.episodeSlug}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 rounded bg-[#8FA7C5]/15 text-[#d7e0ec] text-xs font-bold uppercase">{item.language}</span>
                                                <span className="text-sm text-gray-300">{item.label}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-300">{item.sourceName || item.sourceType}</td>
                                        <td className="p-4 text-sm text-gray-300">{item.isDefault ? "Có" : "Không"}</td>
                                        <td className="p-4 text-sm text-gray-400">{item.updatedAt ? new Date(item.updatedAt).toLocaleString("vi-VN") : "-"}</td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => openEditModal(item)} className="p-2 rounded-lg text-blue-400 hover:bg-blue-400/10 transition-colors">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(item)} className="p-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors">
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

            <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">Tổng kết quả: {totalItems.toLocaleString()}</div>
                <div className="flex gap-2">
                    <button disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))} className="px-4 py-2 rounded-lg bg-white/5 text-white disabled:opacity-40 hover:bg-white/10 transition-colors">
                        Trước
                    </button>
                    <button disabled={page >= totalPages} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} className="px-4 py-2 rounded-lg bg-white/5 text-white disabled:opacity-40 hover:bg-white/10 transition-colors">
                        Sau
                    </button>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="max-w-4xl mx-auto my-8 bg-[#1a1c23] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#1a1c23] z-10">
                            <div>
                                <h2 className="text-xl font-bold text-white">{editingItem ? "Chỉnh sửa subtitle" : "Thêm subtitle"}</h2>
                                <p className="text-sm text-gray-400 mt-1">Lưu subtitle theo phim, tập, ngôn ngữ để sau đó nối vào player song ngữ.</p>
                            </div>
                            <button onClick={closeModal} className="text-gray-400 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="Movie ID"><input value={formData.movieId} onChange={(e) => setFormData({ ...formData, movieId: e.target.value })} className="input-admin" /></Field>
                                <Field label="Movie Slug *"><input value={formData.movieSlug} onChange={(e) => setFormData({ ...formData, movieSlug: e.target.value })} required className="input-admin" /></Field>
                                <Field label="Tên phim *"><input value={formData.movieName} onChange={(e) => setFormData({ ...formData, movieName: e.target.value })} required className="input-admin" /></Field>
                                <Field label="Episode Slug *"><input value={formData.episodeSlug} onChange={(e) => setFormData({ ...formData, episodeSlug: e.target.value })} required className="input-admin" /></Field>
                                <Field label="Tên tập"><input value={formData.episodeName} onChange={(e) => setFormData({ ...formData, episodeName: e.target.value })} className="input-admin" /></Field>
                                <Field label="Language *"><input value={formData.language} onChange={(e) => setFormData({ ...formData, language: e.target.value.toLowerCase() })} required className="input-admin" /></Field>
                                <Field label="Label"><input value={formData.label} onChange={(e) => setFormData({ ...formData, label: e.target.value })} className="input-admin" /></Field>
                                <Field label="Format">
                                    <select value={formData.format} onChange={(e) => setFormData({ ...formData, format: e.target.value })} className="input-admin">
                                        <option value="srt">srt</option>
                                        <option value="vtt">vtt</option>
                                        <option value="ass">ass</option>
                                        <option value="ssa">ssa</option>
                                        <option value="txt">txt</option>
                                    </select>
                                </Field>
                                <Field label="Source Type">
                                    <select value={formData.sourceType} onChange={(e) => setFormData({ ...formData, sourceType: e.target.value })} className="input-admin">
                                        <option value="url">url</option>
                                        <option value="content">content</option>
                                        <option value="external">external</option>
                                    </select>
                                </Field>
                                <Field label="Source Name"><input value={formData.sourceName} onChange={(e) => setFormData({ ...formData, sourceName: e.target.value })} className="input-admin" /></Field>
                                <Field label="URL subtitle"><input value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} className="input-admin" /></Field>
                                <Field label="Mặc định">
                                    <select value={String(formData.isDefault)} onChange={(e) => setFormData({ ...formData, isDefault: e.target.value === "true" })} className="input-admin">
                                        <option value="true">Có</option>
                                        <option value="false">Không</option>
                                    </select>
                                </Field>
                            </div>

                            <Field label="Nội dung subtitle">
                                <textarea rows={10} value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className="input-admin resize-y min-h-[220px] font-mono text-sm" placeholder="Dán nội dung SRT/VTT nếu không dùng URL..." />
                            </Field>

                            <Field label="Ghi chú">
                                <textarea rows={3} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="input-admin resize-y" />
                            </Field>

                            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                                <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-lg text-white hover:bg-white/10 transition-colors">Hủy</button>
                                <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-lg bg-primary text-black font-bold hover:bg-yellow-400 transition-colors flex items-center gap-2 disabled:opacity-50">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Lưu subtitle
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .input-admin {
                    width: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 0.75rem;
                    padding: 0.75rem 0.95rem;
                    color: white;
                    outline: none;
                    transition: border-color 0.2s ease;
                }
                .input-admin:focus {
                    border-color: #eab308;
                }
            `}</style>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <div className="text-sm font-medium text-gray-300 mb-1.5">{label}</div>
            {children}
        </label>
    );
}
