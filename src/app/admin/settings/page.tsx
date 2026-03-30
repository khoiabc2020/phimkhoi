"use client";

import { useState } from "react";
import { Settings, Database, Shield, RefreshCw, Trash2, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { useSession } from "next-auth/react";

export default function AdminSettingsPage() {
    const { data: session } = useSession();
    const [syncLoading, setSyncLoading] = useState(false);
    const [syncPages, setSyncPages] = useState({ start: 1, end: 3 });
    const [syncResult, setSyncResult] = useState<{ success: boolean; message: string; errors?: unknown[] } | null>(null);
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    const showToast = (type: "success" | "error", msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 4000);
    };

    const handleSync = async () => {
        setSyncLoading(true);
        setSyncResult(null);
        try {
            const res = await fetch(`/api/admin/sync?start=${syncPages.start}&end=${syncPages.end}`);
            const data = await res.json();
            setSyncResult(data);
            if (data.success) {
                showToast("success", data.message);
            } else {
                showToast("error", data.error || "Đồng bộ thất bại");
            }
        } catch {
            showToast("error", "Không thể kết nối đến server");
        } finally {
            setSyncLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-lg font-bold shadow-xl flex items-center gap-2 ${toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                    {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Cài Đặt Hệ Thống</h1>
                <p className="text-gray-400">Quản lý cấu hình và bảo trì hệ thống</p>
            </div>

            {/* Admin Info */}
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-yellow-500" /> Thông tin Admin
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Tên</p>
                        <p className="text-white font-bold">{session?.user?.name || "—"}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Email</p>
                        <p className="text-white font-bold">{session?.user?.email || "—"}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Vai trò</p>
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20">
                            <Shield className="w-3 h-3" /> ADMIN
                        </span>
                    </div>
                </div>
            </div>

            {/* Movie Sync */}
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-500" /> Đồng bộ phim từ API
                </h2>
                <p className="text-gray-500 text-sm mb-5">Kéo dữ liệu phim mới từ phimapi.com về database. Mỗi trang chứa ~10 phim.</p>

                <div className="flex flex-wrap gap-4 items-end mb-5">
                    <div>
                        <label className="block text-gray-400 text-xs mb-1.5">Từ trang</label>
                        <input
                            type="number"
                            min={1}
                            max={500}
                            value={syncPages.start}
                            onChange={e => setSyncPages(p => ({ ...p, start: Math.max(1, parseInt(e.target.value) || 1) }))}
                            className="w-24 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 text-xs mb-1.5">Đến trang</label>
                        <input
                            type="number"
                            min={1}
                            max={500}
                            value={syncPages.end}
                            onChange={e => setSyncPages(p => ({ ...p, end: Math.max(p.start, parseInt(e.target.value) || p.start) }))}
                            className="w-24 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                        />
                    </div>
                    <button
                        onClick={handleSync}
                        disabled={syncLoading}
                        className="px-6 py-2.5 bg-primary text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw className={`w-4 h-4 ${syncLoading ? "animate-spin" : ""}`} />
                        {syncLoading ? "Đang đồng bộ..." : `Đồng bộ trang ${syncPages.start}–${syncPages.end}`}
                    </button>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-sm text-blue-300">
                    <Info className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>Mỗi trang sẽ fetch chi tiết từng phim → có thể mất vài phút nếu đồng bộ nhiều trang cùng lúc.</span>
                </div>

                {syncResult && (
                    <div className={`mt-4 p-4 rounded-lg border ${syncResult.success ? "bg-green-500/5 border-green-500/20 text-green-300" : "bg-red-500/5 border-red-500/20 text-red-300"}`}>
                        <p className="font-bold flex items-center gap-2">
                            {syncResult.success ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                            {syncResult.message || syncResult.success ? "Thành công" : "Thất bại"}
                        </p>
                        {syncResult.errors && syncResult.errors.length > 0 && (
                            <p className="text-xs mt-1 text-yellow-400">{syncResult.errors.length} lỗi nhỏ (xem console để biết thêm)</p>
                        )}
                    </div>
                )}
            </div>

            {/* Danger Zone */}
            <div className="bg-[#1a1a1a] border border-red-500/20 rounded-xl p-6">
                <h2 className="text-lg font-bold text-red-400 mb-1 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" /> Vùng nguy hiểm
                </h2>
                <p className="text-gray-500 text-sm mb-5">Các thao tác này không thể hoàn tác. Thực hiện cẩn thận.</p>

                <div className="space-y-3">
                    <DangerAction
                        label="Xóa tất cả bình luận"
                        description="Xóa toàn bộ bình luận của tất cả người dùng"
                        onConfirm={async () => {
                            showToast("error", "Tính năng này đã bị khoá để bảo vệ dữ liệu");
                        }}
                    />
                    <DangerAction
                        label="Xóa cache phim"
                        description="Buộc reload dữ liệu phim từ DB lần tiếp theo"
                        onConfirm={async () => {
                            showToast("success", "Cache đã được xóa (tính năng dev)");
                        }}
                    />
                </div>
            </div>

            {/* System Info */}
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-gray-400" /> Thông tin kỹ thuật
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <InfoRow label="Framework" value="Next.js 15" />
                    <InfoRow label="Database" value="MongoDB" />
                    <InfoRow label="Auth" value="NextAuth v4" />
                    <InfoRow label="Hosting" value="VPS" />
                    <InfoRow label="Node" value="v18+" />
                    <InfoRow label="Language" value="TypeScript" />
                    <InfoRow label="Styling" value="Tailwind CSS" />
                    <InfoRow label="API Source" value="phimapi.com" />
                </div>
            </div>
        </div>
    );
}

function DangerAction({ label, description, onConfirm }: { label: string; description: string; onConfirm: () => Promise<void> }) {
    const [confirming, setConfirming] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        if (!confirming) { setConfirming(true); return; }
        setLoading(true);
        await onConfirm();
        setLoading(false);
        setConfirming(false);
    };

    return (
        <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/5 border border-red-500/10">
            <div>
                <p className="text-white font-bold text-sm">{label}</p>
                <p className="text-gray-500 text-xs">{description}</p>
            </div>
            <button
                onClick={handleClick}
                disabled={loading}
                onBlur={() => setTimeout(() => setConfirming(false), 200)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${confirming
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                    } disabled:opacity-50`}
            >
                <Trash2 className="w-4 h-4" />
                {loading ? "Đang xử lý..." : confirming ? "Nhấn lần nữa để xác nhận" : "Thực hiện"}
            </button>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-gray-500 text-xs mb-0.5">{label}</p>
            <p className="text-white font-mono text-sm">{value}</p>
        </div>
    );
}
