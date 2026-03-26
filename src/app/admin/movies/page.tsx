"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Film, Loader2, Pencil, Plus, RefreshCcw, Save, Search, Trash2, UploadCloud, X } from "lucide-react";

interface AdminMovieItem {
    _id: string;
    name: string;
    slug: string;
    origin_name?: string;
    content?: string;
    type?: string;
    status?: string;
    thumb_url?: string;
    poster_url?: string;
    quality?: string;
    lang?: string;
    time?: string;
    year?: number;
    episode_current?: string;
    episode_total?: string;
    actor?: string[];
    director?: string[];
    category?: { name: string; slug: string }[];
    country?: { name: string; slug: string }[];
    episodes?: { server_name?: string; server_data?: any[] }[];
    updatedAt?: string;
}

const emptyForm = {
    slug: "",
    name: "",
    origin_name: "",
    content: "",
    type: "series",
    status: "",
    thumb_url: "",
    poster_url: "",
    quality: "",
    lang: "",
    time: "",
    year: "",
    episode_current: "",
    episode_total: "",
    actor: "",
    director: "",
    category: "",
    country: "",
};

export default function AdminMoviesPage() {
    const [movies, setMovies] = useState<AdminMovieItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [importing, setImporting] = useState(false);
    const [message, setMessage] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [importSlug, setImportSlug] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMovie, setEditingMovie] = useState<AdminMovieItem | null>(null);
    const [formData, setFormData] = useState(emptyForm);

    useEffect(() => {
        fetchMovies(page, query);
    }, [page, query]);

    const fetchMovies = async (targetPage: number, targetQuery: string) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: String(targetPage),
                limit: "20",
            });

            if (targetQuery) {
                params.set("q", targetQuery);
            }

            const res = await fetch(`/api/admin/movies?${params.toString()}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Không tải được danh sách phim.");
            }

            setMovies(data.items || []);
            setTotalPages(data.pagination?.totalPages || 1);
            setTotalItems(data.pagination?.totalItems || 0);
        } catch (error: any) {
            setMessage(error?.message || "Không tải được danh sách phim.");
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingMovie(null);
        setFormData(emptyForm);
        setIsModalOpen(true);
    };

    const openEditModal = (movie: AdminMovieItem) => {
        setEditingMovie(movie);
        setFormData({
            slug: movie.slug || "",
            name: movie.name || "",
            origin_name: movie.origin_name || "",
            content: movie.content || "",
            type: movie.type || "series",
            status: movie.status || "",
            thumb_url: movie.thumb_url || "",
            poster_url: movie.poster_url || "",
            quality: movie.quality || "",
            lang: movie.lang || "",
            time: movie.time || "",
            year: movie.year ? String(movie.year) : "",
            episode_current: movie.episode_current || "",
            episode_total: movie.episode_total || "",
            actor: (movie.actor || []).join(", "),
            director: (movie.director || []).join(", "),
            category: (movie.category || []).map((item) => item.name).join(", "),
            country: (movie.country || []).map((item) => item.name).join(", "),
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingMovie(null);
        setFormData(emptyForm);
    };

    const handleSave = async (event: React.FormEvent) => {
        event.preventDefault();

        try {
            setSaving(true);
            setMessage("");

            const payload = {
                ...formData,
                year: formData.year ? Number(formData.year) : 0,
            };

            const url = editingMovie ? `/api/admin/movies/${editingMovie._id}` : "/api/admin/movies";
            const method = editingMovie ? "PUT" : "POST";
            const body = editingMovie ? payload : { movie: payload };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Không lưu được phim.");
            }

            setMessage(editingMovie ? "Đã cập nhật phim trong database." : "Đã thêm phim thủ công vào database.");
            closeModal();
            fetchMovies(page, query);
        } catch (error: any) {
            setMessage(error?.message || "Không lưu được phim.");
        } finally {
            setSaving(false);
        }
    };

    const handleImportMovie = async () => {
        if (!importSlug.trim()) {
            setMessage("Nhập slug phim trước khi import.");
            return;
        }

        try {
            setImporting(true);
            setMessage("");

            const res = await fetch("/api/admin/movies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slug: importSlug.trim() }),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Không import được phim.");
            }

            setImportSlug("");
            setMessage(data.mode === "updated" ? "Đã cập nhật phim từ nguồn vào database." : "Đã import phim mới vào database.");
            setPage(1);
            fetchMovies(1, query);
        } catch (error: any) {
            setMessage(error?.message || "Không import được phim.");
        } finally {
            setImporting(false);
        }
    };

    const handleDeleteMovie = async (movie: AdminMovieItem) => {
        if (!confirm(`Xóa phim "${movie.name}" khỏi database?`)) return;

        try {
            const res = await fetch(`/api/admin/movies/${movie._id}`, {
                method: "DELETE",
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Không xóa được phim.");
            }

            setMessage("Đã xóa phim khỏi database.");
            fetchMovies(page, query);
        } catch (error: any) {
            setMessage(error?.message || "Không xóa được phim.");
        }
    };

    const handleSyncLatest = async () => {
        try {
            setSyncing(true);
            setMessage("");

            const res = await fetch("/api/admin/sync?start=1&end=1");
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Không sync được dữ liệu mới.");
            }

            setMessage(data.message || "Đã sync phim mới.");
            fetchMovies(page, query);
        } catch (error: any) {
            setMessage(error?.message || "Không sync được dữ liệu mới.");
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Quản Lý Phim</h1>
                    <p className="text-gray-400 mt-1">Quản trị database phim, thêm phim mới bằng slug nguồn, sửa metadata và xoá phim trực tiếp trong MongoDB.</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleSyncLatest}
                        disabled={syncing}
                        className="px-4 py-2.5 rounded-lg bg-white/10 text-white hover:bg-white/15 transition-colors font-semibold flex items-center gap-2 disabled:opacity-50"
                    >
                        {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                        Sync Mới Nhất
                    </button>
                    <button
                        onClick={openCreateModal}
                        className="px-4 py-2.5 rounded-lg bg-primary text-black hover:bg-yellow-400 transition-colors font-bold flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Thêm Thủ Công
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="bg-[#141414] border border-white/10 rounded-2xl p-5">
                    <div className="text-gray-400 text-sm">Tổng phim trong DB</div>
                    <div className="text-white text-3xl font-black mt-2">{totalItems.toLocaleString()}</div>
                </div>
                <div className="bg-[#141414] border border-white/10 rounded-2xl p-5">
                    <div className="text-gray-400 text-sm">Trang hiện tại</div>
                    <div className="text-white text-3xl font-black mt-2">{page}/{totalPages}</div>
                </div>
                <div className="bg-[#141414] border border-white/10 rounded-2xl p-5">
                    <div className="text-gray-400 text-sm">Import từ nguồn</div>
                    <div className="mt-3 flex gap-2">
                        <input
                            value={importSlug}
                            onChange={(e) => setImportSlug(e.target.value)}
                            placeholder="vd: tham-tu-lung-danh-conan"
                            className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-white outline-none focus:border-primary"
                        />
                        <button
                            onClick={handleImportMovie}
                            disabled={importing}
                            className="px-4 rounded-lg bg-[#8FA7C5] text-black font-bold hover:bg-[#a4b7d0] transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                            Import
                        </button>
                    </div>
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
                            placeholder="Tìm theo tên phim, tên gốc hoặc slug..."
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
                ) : movies.length === 0 ? (
                    <div className="py-20 text-center text-gray-500">
                        Không có phim nào trong kết quả hiện tại.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1100px]">
                            <thead className="bg-white/5 border-b border-white/10 text-left text-xs uppercase tracking-wider text-gray-400">
                                <tr>
                                    <th className="p-4">Phim</th>
                                    <th className="p-4">Slug</th>
                                    <th className="p-4">Năm</th>
                                    <th className="p-4">Ngôn ngữ</th>
                                    <th className="p-4">Server</th>
                                    <th className="p-4">Cập nhật</th>
                                    <th className="p-4 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movies.map((movie) => (
                                    <tr key={movie._id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-14 h-20 rounded-lg overflow-hidden border border-white/10 bg-black/40 shrink-0">
                                                    {movie.poster_url || movie.thumb_url ? (
                                                        <Image
                                                            src={movie.poster_url || movie.thumb_url || ""}
                                                            alt={movie.name}
                                                            fill
                                                            className="object-cover"
                                                            unoptimized
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Film className="w-5 h-5 text-white/20" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white">{movie.name}</div>
                                                    <div className="text-sm text-gray-400 line-clamp-1">{movie.origin_name || "Không có tên gốc"}</div>
                                                    <div className="mt-1 flex flex-wrap gap-1.5">
                                                        {movie.quality && <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-bold text-gray-200">{movie.quality}</span>}
                                                        {movie.type && <span className="px-2 py-0.5 rounded bg-[#8FA7C5]/15 text-[10px] font-bold text-[#d2dceb] uppercase">{movie.type}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-300">{movie.slug}</td>
                                        <td className="p-4 text-sm text-gray-300">{movie.year || "-"}</td>
                                        <td className="p-4 text-sm text-gray-300">{movie.lang || "-"}</td>
                                        <td className="p-4 text-sm text-gray-300">{movie.episodes?.length || 0}</td>
                                        <td className="p-4 text-sm text-gray-400">
                                            {movie.updatedAt ? new Date(movie.updatedAt).toLocaleString("vi-VN") : "-"}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(movie)}
                                                    className="p-2 rounded-lg text-blue-400 hover:bg-blue-400/10 transition-colors"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteMovie(movie)}
                                                    className="p-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
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

            <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                    Tổng kết quả: {totalItems.toLocaleString()}
                </div>
                <div className="flex gap-2">
                    <button
                        disabled={page <= 1}
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        className="px-4 py-2 rounded-lg bg-white/5 text-white disabled:opacity-40 hover:bg-white/10 transition-colors"
                    >
                        Trước
                    </button>
                    <button
                        disabled={page >= totalPages}
                        onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                        className="px-4 py-2 rounded-lg bg-white/5 text-white disabled:opacity-40 hover:bg-white/10 transition-colors"
                    >
                        Sau
                    </button>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="max-w-5xl mx-auto my-8 bg-[#1a1c23] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#1a1c23] z-10">
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {editingMovie ? "Chỉnh sửa phim" : "Thêm phim thủ công"}
                                </h2>
                                <p className="text-sm text-gray-400 mt-1">
                                    {editingMovie ? "Cập nhật metadata phim trong database." : "Tạo bản ghi phim mới trực tiếp trong database."}
                                </p>
                            </div>
                            <button onClick={closeModal} className="text-gray-400 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="Slug *">
                                    <input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required className="input-admin" />
                                </Field>
                                <Field label="Tên phim *">
                                    <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="input-admin" />
                                </Field>
                                <Field label="Tên gốc">
                                    <input value={formData.origin_name} onChange={(e) => setFormData({ ...formData, origin_name: e.target.value })} className="input-admin" />
                                </Field>
                                <Field label="Loại phim">
                                    <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="input-admin">
                                        <option value="series">series</option>
                                        <option value="single">single</option>
                                        <option value="tvshows">tvshows</option>
                                        <option value="hoathinh">hoathinh</option>
                                    </select>
                                </Field>
                                <Field label="Trạng thái">
                                    <input value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="input-admin" />
                                </Field>
                                <Field label="Năm">
                                    <input value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} className="input-admin" />
                                </Field>
                                <Field label="Chất lượng">
                                    <input value={formData.quality} onChange={(e) => setFormData({ ...formData, quality: e.target.value })} className="input-admin" />
                                </Field>
                                <Field label="Ngôn ngữ">
                                    <input value={formData.lang} onChange={(e) => setFormData({ ...formData, lang: e.target.value })} className="input-admin" />
                                </Field>
                                <Field label="Thời lượng">
                                    <input value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} className="input-admin" />
                                </Field>
                                <Field label="Tập hiện tại">
                                    <input value={formData.episode_current} onChange={(e) => setFormData({ ...formData, episode_current: e.target.value })} className="input-admin" />
                                </Field>
                                <Field label="Tổng tập">
                                    <input value={formData.episode_total} onChange={(e) => setFormData({ ...formData, episode_total: e.target.value })} className="input-admin" />
                                </Field>
                                <Field label="Ảnh dọc poster">
                                    <input value={formData.poster_url} onChange={(e) => setFormData({ ...formData, poster_url: e.target.value })} className="input-admin" />
                                </Field>
                                <Field label="Ảnh ngang thumb">
                                    <input value={formData.thumb_url} onChange={(e) => setFormData({ ...formData, thumb_url: e.target.value })} className="input-admin" />
                                </Field>
                                <Field label="Diễn viên (cách nhau dấu phẩy)">
                                    <input value={formData.actor} onChange={(e) => setFormData({ ...formData, actor: e.target.value })} className="input-admin" />
                                </Field>
                                <Field label="Đạo diễn (cách nhau dấu phẩy)">
                                    <input value={formData.director} onChange={(e) => setFormData({ ...formData, director: e.target.value })} className="input-admin" />
                                </Field>
                                <Field label="Thể loại (cách nhau dấu phẩy)">
                                    <input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="input-admin" />
                                </Field>
                                <Field label="Quốc gia (cách nhau dấu phẩy)">
                                    <input value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} className="input-admin" />
                                </Field>
                            </div>

                            <Field label="Nội dung">
                                <textarea
                                    rows={6}
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    className="input-admin resize-y min-h-[140px]"
                                />
                            </Field>

                            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-5 py-2.5 rounded-lg text-white hover:bg-white/10 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2.5 rounded-lg bg-primary text-black font-bold hover:bg-yellow-400 transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Lưu phim
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
