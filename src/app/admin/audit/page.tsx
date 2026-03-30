"use client";

import { useState, useEffect, useCallback } from "react";
import { History, Search, ChevronLeft, ChevronRight, RefreshCw, Shield, Film, User, MessageSquare, Bell } from "lucide-react";

type AuditLog = {
    _id: string;
    action: string;
    entity: string;
    entityId?: string;
    entityName?: string;
    adminId: string;
    adminName: string;
    adminEmail: string;
    details?: Record<string, unknown>;
    status: "success" | "error";
    createdAt: string;
};

const ACTION_LABELS: Record<string, string> = {
    DELETE_MOVIE: "Xóa phim",
    SYNC_MOVIES: "Đồng bộ phim",
    CHANGE_USER_ROLE: "Đổi vai trò",
    DELETE_USER: "Xóa thành viên",
    UPDATE_USER: "Cập nhật thành viên",
};

const ENTITY_ICONS: Record<string, React.ElementType> = {
    movie: Film,
    user: User,
    comment: MessageSquare,
    notification: Bell,
};

const ACTION_COLOR: Record<string, string> = {
    DELETE_MOVIE: "bg-red-500/10 text-red-400 border-red-500/20",
    SYNC_MOVIES: "bg-green-500/10 text-green-400 border-green-500/20",
    CHANGE_USER_ROLE: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    DELETE_USER: "bg-red-500/10 text-red-400 border-red-500/20",
    UPDATE_USER: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const ENTITIES = ["", "movie", "user", "comment", "notification"];

export default function AdminAuditPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [entityFilter, setEntityFilter] = useState("");
    const [actionSearch, setActionSearch] = useState("");

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: "20" });
            if (entityFilter) params.set("entity", entityFilter);
            if (actionSearch) params.set("action", actionSearch);
            const res = await fetch(`/api/admin/audit?${params}`);
            const data = await res.json();
            setLogs(data.logs || []);
            setTotalPages(data.totalPages || 1);
            setTotal(data.total || 0);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, [page, entityFilter, actionSearch]);

    useEffect(() => {
        const t = setTimeout(fetchLogs, actionSearch ? 400 : 0);
        return () => clearTimeout(t);
    }, [fetchLogs, actionSearch]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <History className="w-8 h-8 text-primary" /> Nhật Ký Quản Trị
                    </h1>
                    <p className="text-gray-400 mt-1">
                        Tổng <span className="text-primary font-bold">{total}</span> hành động đã ghi nhận
                    </p>
                </div>
                <button
                    onClick={fetchLogs}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 transition-colors flex items-center gap-2 text-sm"
                >
                    <RefreshCw className="w-4 h-4" /> Làm mới
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm theo hành động (SYNC, DELETE...)"
                        value={actionSearch}
                        onChange={e => { setActionSearch(e.target.value); setPage(1); }}
                        className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg py-3 pl-11 pr-4 text-white focus:outline-none focus:border-primary"
                    />
                </div>
                <select
                    value={entityFilter}
                    onChange={e => { setEntityFilter(e.target.value); setPage(1); }}
                    className="bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                >
                    <option value="">Tất cả đối tượng</option>
                    {ENTITIES.slice(1).map(e => (
                        <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="bg-[#1a1a1a] rounded-lg border border-white/10 overflow-hidden shadow-2xl">
                {loading ? (
                    <div className="p-20 text-center text-gray-500 flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" /> Đang tải...
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-20 text-center">
                        <History className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                        <p className="text-gray-500">Chưa có nhật ký nào được ghi nhận</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 border-b border-white/10 text-gray-400 uppercase text-xs font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Hành động</th>
                                    <th className="px-6 py-4">Đối tượng</th>
                                    <th className="px-6 py-4">Admin</th>
                                    <th className="px-6 py-4">Chi tiết</th>
                                    <th className="px-6 py-4">Thời gian</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {logs.map(log => {
                                    const EntityIcon = ENTITY_ICONS[log.entity] || Shield;
                                    const colorClass = ACTION_COLOR[log.action] || "bg-white/5 text-gray-400 border-white/10";
                                    return (
                                        <tr key={log._id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${colorClass}`}>
                                                    {ACTION_LABELS[log.action] || log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <EntityIcon className="w-4 h-4 text-gray-500 shrink-0" />
                                                    <div>
                                                        <p className="text-white text-sm font-medium capitalize">{log.entity}</p>
                                                        {log.entityName && (
                                                            <p className="text-gray-500 text-xs truncate max-w-[160px]">{log.entityName}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-white text-sm font-medium">{log.adminName}</p>
                                                <p className="text-gray-500 text-xs">{log.adminEmail}</p>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-xs font-mono max-w-[200px]">
                                                {log.details ? (
                                                    <details className="cursor-pointer">
                                                        <summary className="text-primary hover:text-yellow-400 cursor-pointer">Xem chi tiết</summary>
                                                        <pre className="mt-2 text-gray-400 whitespace-pre-wrap break-all bg-black/30 p-2 rounded text-xs">
                                                            {JSON.stringify(log.details, null, 2)}
                                                        </pre>
                                                    </details>
                                                ) : "—"}
                                            </td>
                                            <td className="px-6 py-4 text-gray-400 text-sm whitespace-nowrap">
                                                {new Date(log.createdAt).toLocaleString("vi-VN")}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-gray-500">
                    <p>Trang {page} / {totalPages} — {total} bản ghi</p>
                    <div className="flex gap-2 items-center">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                            className="p-2 bg-[#1a1a1a] rounded-lg hover:bg-white/10 disabled:opacity-30">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                            return (
                                <button key={p} onClick={() => setPage(p)}
                                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${p === page ? "bg-primary text-black" : "bg-[#1a1a1a] hover:bg-white/10 text-white"}`}>
                                    {p}
                                </button>
                            );
                        })}
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                            className="p-2 bg-[#1a1a1a] rounded-lg hover:bg-white/10 disabled:opacity-30">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
