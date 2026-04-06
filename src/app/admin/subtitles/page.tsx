"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Loader2, Pencil, Plus, Save, Search, Trash2, X,
    Download, Globe, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Film,
} from "lucide-react";

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

interface OSResult {
    id: string;
    language: string;
    downloadCount: number;
    release: string;
    fps?: number;
    ratings?: number;
    votes?: number;
    fromTrusted?: boolean;
    uploader?: string;
    files: { fileId: number; fileName: string }[];
}

const LANG_LABELS: Record<string, string> = {
    vi: "Tiếng Việt",
    en: "English",
    zh: "中文",
    ko: "한국어",
    ja: "日本語",
    fr: "Français",
    es: "Español",
    th: "ภาษาไทย",
};

const emptyForm = {
    movieId: "", movieSlug: "", movieName: "",
    episodeSlug: "", episodeName: "",
    language: "vi", label: "Tiếng Việt",
    format: "srt", sourceType: "url",
    sourceName: "manual", url: "", content: "",
    isDefault: true, notes: "",
};

export default function AdminSubtitlesPage() {
    // ── List state ──────────────────────────────────────────────────────
    const [items, setItems] = useState<SubtitleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
    const [searchInput, setSearchInput] = useState("");
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // ── Create/Edit modal ────────────────────────────────────────────────
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<SubtitleItem | null>(null);
    const [formData, setFormData] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    // ── OpenSubtitles search ─────────────────────────────────────────────
    const [osOpen, setOsOpen] = useState(false);
    const [osQuery, setOsQuery] = useState("");
    const [osLang, setOsLang] = useState("vi,en");
    const [osSeason, setOsSeason] = useState("");
    const [osEpisode, setOsEpisode] = useState("");
    const [osLoading, setOsLoading] = useState(false);
    const [osResults, setOsResults] = useState<OSResult[]>([]);
    const [osError, setOsError] = useState("");
    const [osTotal, setOsTotal] = useState(0);

    // Context for import (which movie/episode to attach to)
    const [osContext, setOsContext] = useState({ movieSlug: "", movieName: "", episodeSlug: "" });
    const [importing, setImporting] = useState<number | null>(null);
    const [importedIds, setImportedIds] = useState<Set<number>>(new Set());

    // ── Fetch list ───────────────────────────────────────────────────────
    const fetchItems = useCallback(async (targetPage: number, targetQuery: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(targetPage), limit: "20" });
            if (targetQuery) params.set("q", targetQuery);
            const res = await fetch(`/api/admin/subtitles?${params}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setItems(data.items || []);
            setTotalPages(data.pagination?.totalPages || 1);
            setTotalItems(data.pagination?.totalItems || 0);
        } catch (e: any) {
            showMsg(e?.message || "Không tải được danh sách", false);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchItems(page, query); }, [page, query, fetchItems]);

    function showMsg(text: string, ok: boolean) {
        setMessage({ text, ok });
        setTimeout(() => setMessage(null), 4000);
    }

    // ── CRUD handlers ────────────────────────────────────────────────────
    const openCreate = () => {
        setEditingItem(null);
        setFormData(emptyForm);
        setIsModalOpen(true);
    };

    const openEdit = async (item: SubtitleItem) => {
        try {
            const res = await fetch(`/api/admin/subtitles/${item._id}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            const s = data.item as SubtitleItem;
            setEditingItem(s);
            setFormData({
                movieId: s.movieId || "", movieSlug: s.movieSlug, movieName: s.movieName,
                episodeSlug: s.episodeSlug, episodeName: s.episodeName || "",
                language: s.language, label: s.label,
                format: s.format, sourceType: s.sourceType,
                sourceName: s.sourceName || "", url: s.url || "",
                content: s.content || "", isDefault: Boolean(s.isDefault), notes: s.notes || "",
            });
            setIsModalOpen(true);
        } catch (e: any) { showMsg(e?.message, false); }
    };

    const closeModal = () => { setIsModalOpen(false); setEditingItem(null); setFormData(emptyForm); };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingItem ? `/api/admin/subtitles/${editingItem._id}` : "/api/admin/subtitles";
            const method = editingItem ? "PUT" : "POST";
            const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            showMsg(editingItem ? "Đã cập nhật subtitle." : "Đã tạo subtitle.", true);
            closeModal();
            fetchItems(page, query);
        } catch (e: any) { showMsg(e?.message, false); }
        finally { setSaving(false); }
    };

    const handleDelete = async (item: SubtitleItem) => {
        if (!confirm(`Xóa subtitle ${item.label} của ${item.movieName} / ${item.episodeSlug}?`)) return;
        try {
            const res = await fetch(`/api/admin/subtitles/${item._id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            showMsg("Đã xóa subtitle.", true);
            fetchItems(page, query);
        } catch (e: any) { showMsg(e?.message, false); }
    };

    // ── OpenSubtitles search ─────────────────────────────────────────────
    const searchOS = async () => {
        if (!osQuery.trim()) { setOsError("Nhập tên phim để tìm kiếm"); return; }
        setOsLoading(true); setOsError(""); setOsResults([]);
        try {
            const params = new URLSearchParams({ query: osQuery.trim(), lang: osLang });
            if (osSeason) params.set("season", osSeason);
            if (osEpisode) params.set("episode", osEpisode);
            const res = await fetch(`/api/admin/subtitles/opensubtitles?${params}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setOsResults(data.items || []);
            setOsTotal(data.total || 0);
        } catch (e: any) { setOsError(e?.message || "Lỗi tìm kiếm"); }
        finally { setOsLoading(false); }
    };

    const openOSSearch = (item?: SubtitleItem) => {
        setOsResults([]); setOsError(""); setImportedIds(new Set());
        if (item) {
            setOsQuery(item.movieName);
            setOsContext({ movieSlug: item.movieSlug, movieName: item.movieName, episodeSlug: item.episodeSlug });
        } else {
            setOsQuery(""); setOsContext({ movieSlug: "", movieName: "", episodeSlug: "" });
        }
        setOsOpen(true);
    };

    const importSub = async (result: OSResult) => {
        if (!osContext.movieSlug || !osContext.episodeSlug) {
            setOsError("Chọn phim/tập trước khi import — mở từ nút 🔍 trên dòng phim.");
            return;
        }
        const file = result.files[0];
        if (!file) { setOsError("Không có file trong kết quả này"); return; }
        setImporting(file.fileId);
        try {
            const res = await fetch("/api/admin/subtitles/opensubtitles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fileId: file.fileId,
                    fileName: file.fileName,
                    language: result.language,
                    movieSlug: osContext.movieSlug,
                    movieName: osContext.movieName,
                    episodeSlug: osContext.episodeSlug,
                    isDefault: result.language === "vi",
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setImportedIds(prev => new Set(prev).add(file.fileId));
            showMsg(`✅ Import thành công: ${result.language.toUpperCase()} — ${file.fileName}${data.remainingDownloads !== undefined ? ` (còn ${data.remainingDownloads} lượt tải hôm nay)` : ""}`, true);
            fetchItems(page, query);
        } catch (e: any) { setOsError(e?.message || "Lỗi import"); }
        finally { setImporting(null); }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Quản Lý Subtitle</h1>
                    <p className="text-gray-400 mt-1 text-sm">Thêm phụ đề thủ công hoặc tìm tự động từ OpenSubtitles · Phụ đề sẽ hiện trên player ngay sau khi lưu.</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => openOSSearch()}
                        className="px-4 py-2.5 rounded-lg bg-[#8FA7C5]/20 text-[#d7e0ec] hover:bg-[#8FA7C5]/30 transition-colors font-bold flex items-center gap-2 border border-[#8FA7C5]/30"
                    >
                        <Globe className="w-4 h-4" /> Tìm OpenSubtitles
                    </button>
                    <button
                        onClick={openCreate}
                        className="px-4 py-2.5 rounded-lg bg-primary text-black hover:bg-yellow-400 transition-colors font-bold flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Thêm thủ công
                    </button>
                </div>
            </div>

            {/* Stats */}
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
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <div className="text-gray-400 text-sm">OpenSubtitles API</div>
                    </div>
                    <div className="text-white text-base font-bold">Đã kết nối</div>
                    <div className="text-gray-500 text-xs mt-1">Tìm & import phụ đề tự động — click "Tìm OpenSubtitles"</div>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`px-4 py-3 rounded-xl border flex items-center gap-2 text-sm ${message.ok ? "border-green-500/30 bg-green-500/10 text-green-300" : "border-red-500/30 bg-red-500/10 text-red-300"}`}>
                    {message.ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    {message.text}
                </div>
            )}

            {/* Search bar */}
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-4">
                <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") { setPage(1); setQuery(searchInput.trim()); } }}
                            placeholder="Tìm theo tên phim, slug, tập, ngôn ngữ, label..."
                            className="w-full bg-black/50 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-white outline-none focus:border-primary text-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => { setPage(1); setQuery(searchInput.trim()); }} className="px-4 py-2.5 rounded-lg bg-white/10 text-white font-semibold hover:bg-white/15 transition-colors text-sm">Tìm</button>
                        <button onClick={() => { setSearchInput(""); setQuery(""); setPage(1); }} className="px-4 py-2.5 rounded-lg bg-white/5 text-gray-300 font-semibold hover:bg-white/10 transition-colors text-sm">Reset</button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
                ) : items.length === 0 ? (
                    <div className="py-20 text-center text-gray-500 flex flex-col items-center gap-3">
                        <Film className="w-12 h-12 text-white/10" />
                        <p>Chưa có subtitle nào. Dùng "Tìm OpenSubtitles" để import tự động.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px]">
                            <thead className="bg-white/5 border-b border-white/10 text-left text-xs uppercase tracking-wider text-gray-400">
                                <tr>
                                    <th className="p-4">Phim / Tập</th>
                                    <th className="p-4">Ngôn ngữ</th>
                                    <th className="p-4">Format / Nguồn</th>
                                    <th className="p-4">Mặc định</th>
                                    <th className="p-4">Cập nhật</th>
                                    <th className="p-4 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(item => (
                                    <tr key={item._id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                        <td className="p-4">
                                            <div className="font-bold text-white text-sm">{item.movieName}</div>
                                            <div className="text-xs text-gray-500 mt-0.5">{item.movieSlug} · {item.episodeSlug}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 rounded bg-[#8FA7C5]/15 text-[#d7e0ec] text-xs font-bold uppercase">{item.language}</span>
                                                <span className="text-sm text-gray-300">{item.label}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-300 uppercase font-mono">{item.format}</span>
                                            <span className="text-xs text-gray-500 ml-2">{item.sourceName || item.sourceType}</span>
                                        </td>
                                        <td className="p-4">
                                            {item.isDefault
                                                ? <span className="text-xs px-2 py-0.5 rounded bg-green-500/15 text-green-400 font-bold">Mặc định</span>
                                                : <span className="text-xs text-gray-600">—</span>}
                                        </td>
                                        <td className="p-4 text-xs text-gray-400">{item.updatedAt ? new Date(item.updatedAt).toLocaleString("vi-VN") : "—"}</td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => openOSSearch(item)}
                                                    title="Tìm thêm sub từ OpenSubtitles cho phim/tập này"
                                                    className="p-2 rounded-lg text-[#8FA7C5] hover:bg-[#8FA7C5]/10 transition-colors"
                                                >
                                                    <Globe className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => openEdit(item)} className="p-2 rounded-lg text-blue-400 hover:bg-blue-400/10 transition-colors">
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

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">Tổng: <span className="text-white font-bold">{totalItems.toLocaleString()}</span> subtitle</div>
                <div className="flex gap-2">
                    <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-4 py-2 rounded-lg bg-white/5 text-white disabled:opacity-40 hover:bg-white/10 transition-colors text-sm">Trước</button>
                    <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-4 py-2 rounded-lg bg-white/5 text-white disabled:opacity-40 hover:bg-white/10 transition-colors text-sm">Sau</button>
                </div>
            </div>

            {/* ── OpenSubtitles search modal ── */}
            {osOpen && (
                <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm p-4 overflow-y-auto flex items-start justify-center">
                    <div className="w-full max-w-3xl my-8 bg-[#13151c] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#13151c] z-10">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Globe className="w-5 h-5 text-[#8FA7C5]" /> Tìm trên OpenSubtitles
                                </h2>
                                {osContext.movieSlug ? (
                                    <p className="text-xs text-[#8FA7C5] mt-1">
                                        Import cho: <span className="font-bold text-white">{osContext.movieName}</span> · <span className="font-mono">{osContext.episodeSlug}</span>
                                    </p>
                                ) : (
                                    <p className="text-xs text-yellow-400 mt-1">⚠ Chưa chọn phim/tập — mở từ nút 🌐 trên dòng phim để liên kết.</p>
                                )}
                            </div>
                            <button onClick={() => setOsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Search inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="sm:col-span-2">
                                    <label className="text-xs text-gray-400 mb-1 block">Tên phim *</label>
                                    <input
                                        value={osQuery}
                                        onChange={e => setOsQuery(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && searchOS()}
                                        placeholder="VD: Squid Game, One Piece..."
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-primary text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Ngôn ngữ</label>
                                    <select value={osLang} onChange={e => setOsLang(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-white outline-none focus:border-primary text-sm">
                                        <option value="vi">Tiếng Việt</option>
                                        <option value="en">English</option>
                                        <option value="vi,en">Tiếng Việt + English</option>
                                        <option value="zh">中文</option>
                                        <option value="ko">한국어</option>
                                        <option value="ja">日本語</option>
                                        <option value="vi,en,zh,ko">VI + EN + ZH + KO</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs text-gray-400 mb-1 block">Season (nếu có)</label>
                                        <input value={osSeason} onChange={e => setOsSeason(e.target.value)} placeholder="VD: 1" className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-white outline-none focus:border-primary text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 mb-1 block">Episode (nếu có)</label>
                                        <input value={osEpisode} onChange={e => setOsEpisode(e.target.value)} placeholder="VD: 3" className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-white outline-none focus:border-primary text-sm" />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={searchOS}
                                disabled={osLoading}
                                className="w-full py-2.5 rounded-lg bg-primary text-black font-bold hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {osLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                {osLoading ? "Đang tìm..." : "Tìm kiếm"}
                            </button>

                            {osError && (
                                <div className="px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" /> {osError}
                                </div>
                            )}

                            {/* Results */}
                            {osResults.length > 0 && (
                                <div className="space-y-2">
                                    <div className="text-xs text-gray-400">Tìm thấy <span className="text-white font-bold">{osTotal}</span> kết quả (hiển thị {osResults.length})</div>
                                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                                        {osResults.map(result => (
                                            <div key={result.id} className="bg-white/[0.03] border border-white/10 rounded-xl p-3.5 flex items-start justify-between gap-3 hover:border-white/20 transition-all">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center flex-wrap gap-2 mb-1">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${result.language === "vi" ? "bg-red-500/20 text-red-300" : result.language === "en" ? "bg-blue-500/20 text-blue-300" : "bg-[#8FA7C5]/20 text-[#d7e0ec]"}`}>
                                                            {result.language}
                                                        </span>
                                                        {result.fromTrusted && (
                                                            <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Trusted</span>
                                                        )}
                                                        {result.ratings && result.ratings > 0 && (
                                                            <span className="text-xs text-yellow-400">⭐ {result.ratings.toFixed(1)}</span>
                                                        )}
                                                        <span className="text-xs text-gray-500">↓ {result.downloadCount?.toLocaleString()}</span>
                                                    </div>
                                                    <div className="text-sm text-white/80 font-medium truncate">{result.files[0]?.fileName || "Không rõ tên file"}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5 truncate">{result.release} {result.uploader ? `· by ${result.uploader}` : ""}</div>
                                                </div>
                                                <button
                                                    onClick={() => importSub(result)}
                                                    disabled={importing === result.files[0]?.fileId || importedIds.has(result.files[0]?.fileId)}
                                                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${importedIds.has(result.files[0]?.fileId) ? "bg-green-500/20 text-green-400 cursor-default" : "bg-primary/20 text-primary hover:bg-primary hover:text-black disabled:opacity-50"}`}
                                                >
                                                    {importing === result.files[0]?.fileId ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : importedIds.has(result.files[0]?.fileId) ? (
                                                        <><CheckCircle className="w-3.5 h-3.5" /> Đã import</>
                                                    ) : (
                                                        <><Download className="w-3.5 h-3.5" /> Import</>
                                                    )}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Create/Edit modal ── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="max-w-4xl mx-auto my-8 bg-[#1a1c23] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#1a1c23] z-10">
                            <div>
                                <h2 className="text-xl font-bold text-white">{editingItem ? "Chỉnh sửa subtitle" : "Thêm subtitle thủ công"}</h2>
                                <p className="text-sm text-gray-400 mt-1">Điền thông tin và lưu để phụ đề hiện ngay trên player.</p>
                            </div>
                            <button onClick={closeModal} className="text-gray-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="Movie Slug *"><input value={formData.movieSlug} onChange={e => setFormData({ ...formData, movieSlug: e.target.value })} required className="input-admin" /></Field>
                                <Field label="Tên phim *"><input value={formData.movieName} onChange={e => setFormData({ ...formData, movieName: e.target.value })} required className="input-admin" /></Field>
                                <Field label="Episode Slug *"><input value={formData.episodeSlug} onChange={e => setFormData({ ...formData, episodeSlug: e.target.value })} required className="input-admin" placeholder="full, tap-1, ep-01..." /></Field>
                                <Field label="Tên tập"><input value={formData.episodeName} onChange={e => setFormData({ ...formData, episodeName: e.target.value })} className="input-admin" /></Field>
                                <Field label="Ngôn ngữ *">
                                    <select value={formData.language} onChange={e => setFormData({ ...formData, language: e.target.value, label: LANG_LABELS[e.target.value] || e.target.value.toUpperCase() })} className="input-admin">
                                        {Object.entries(LANG_LABELS).map(([k, v]) => <option key={k} value={k}>{k} — {v}</option>)}
                                    </select>
                                </Field>
                                <Field label="Label hiển thị"><input value={formData.label} onChange={e => setFormData({ ...formData, label: e.target.value })} className="input-admin" /></Field>
                                <Field label="Format">
                                    <select value={formData.format} onChange={e => setFormData({ ...formData, format: e.target.value })} className="input-admin">
                                        {["srt", "vtt", "ass", "ssa"].map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
                                    </select>
                                </Field>
                                <Field label="Nguồn">
                                    <select value={formData.sourceType} onChange={e => setFormData({ ...formData, sourceType: e.target.value })} className="input-admin">
                                        <option value="url">URL (link trực tiếp)</option>
                                        <option value="content">Content (lưu nội dung)</option>
                                        <option value="external">External</option>
                                    </select>
                                </Field>
                                {formData.sourceType === "url" && (
                                    <Field label="URL subtitle" className="md:col-span-2"><input value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} className="input-admin" placeholder="https://..." /></Field>
                                )}
                                <Field label="Mặc định">
                                    <select value={String(formData.isDefault)} onChange={e => setFormData({ ...formData, isDefault: e.target.value === "true" })} className="input-admin">
                                        <option value="true">Có — tự động bật khi xem</option>
                                        <option value="false">Không</option>
                                    </select>
                                </Field>
                                <Field label="Provider"><input value={formData.sourceName} onChange={e => setFormData({ ...formData, sourceName: e.target.value })} className="input-admin" placeholder="manual, opensubtitles..." /></Field>
                            </div>

                            {formData.sourceType === "content" && (
                                <Field label="Nội dung subtitle (SRT/VTT)">
                                    <textarea rows={12} value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} className="input-admin resize-y min-h-[240px] font-mono text-xs" placeholder="Dán nội dung SRT hoặc WebVTT tại đây..." />
                                </Field>
                            )}

                            <Field label="Ghi chú">
                                <textarea rows={2} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="input-admin resize-none" />
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
                    background: rgba(0,0,0,0.5);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 0.75rem;
                    padding: 0.625rem 0.95rem;
                    color: white;
                    outline: none;
                    font-size: 0.875rem;
                    transition: border-color 0.2s;
                }
                .input-admin:focus { border-color: #eab308; }
            `}</style>
        </div>
    );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
    return (
        <label className={`block ${className}`}>
            <div className="text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">{label}</div>
            {children}
        </label>
    );
}
