"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Users, Film, Activity, Server, TrendingUp, Eye, MessageSquare, RefreshCw, Clock } from "lucide-react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, Legend
} from "recharts";

const ACTION_LABELS: Record<string, string> = {
    DELETE_MOVIE: "Xóa phim",
    SYNC_MOVIES: "Đồng bộ phim",
    CHANGE_USER_ROLE: "Đổi vai trò",
    DELETE_USER: "Xóa thành viên",
    UPDATE_USER: "Cập nhật thành viên",
};

const ACTION_COLORS: Record<string, string> = {
    DELETE_MOVIE: "text-red-400",
    SYNC_MOVIES: "text-green-400",
    CHANGE_USER_ROLE: "text-yellow-400",
    DELETE_USER: "text-red-400",
    UPDATE_USER: "text-blue-400",
};

export default function AdminPage() {
    const { data: session } = useSession();
    const [stats, setStats] = useState<any>({ users: 0, comments: 0, movies: 0, active: 0, totalWatches: 0, chartData: [], recentActivity: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/stats");
            const data = await res.json();
            if (data) setStats(data);
        } catch (error) {
            console.error("Failed to fetch admin data", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-32">
            <div className="flex items-center gap-3 text-gray-400">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Đang tải dashboard...</span>
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Tổng Quan</h1>
                    <p className="text-gray-400">Chào mừng trở lại, <span className="text-primary">{session?.user?.name}</span></p>
                </div>
                <button
                    onClick={fetchData}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 transition-colors flex items-center gap-2 text-sm"
                >
                    <RefreshCw className="w-4 h-4" /> Làm mới
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <StatCard icon={Users} color="blue" label="Thành viên" value={stats.users?.toLocaleString()} sub="Tổng tài khoản" />
                <StatCard icon={Film} color="yellow" label="Tổng phim" value={(stats.movies || 0).toLocaleString()} sub="Trong CSDL" />
                <StatCard icon={MessageSquare} color="purple" label="Bình luận" value={stats.comments?.toLocaleString()} sub="Tất cả bình luận" />
                <StatCard icon={Activity} color="green" label="Người dùng active" value={stats.active?.toLocaleString()} sub="30 ngày qua" />
                <StatCard icon={Eye} color="orange" label="Lượt xem" value={(stats.totalWatches || 0).toLocaleString()} sub="Tổng lịch sử" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Growth */}
                <div className="bg-[#1a1a1a] p-6 rounded-lg border border-white/10">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-500" /> Tăng trưởng thành viên
                    </h3>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.chartData}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                                <YAxis stroke="#6b7280" fontSize={12} />
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }} itemStyle={{ color: "#fff" }} />
                                <Area type="monotone" dataKey="users" name="Thành viên mới" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsers)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Watch Activity */}
                <div className="bg-[#1a1a1a] p-6 rounded-lg border border-white/10">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Eye className="w-5 h-5 text-purple-500" /> Lượt xem phim
                    </h3>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.chartData}>
                                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                                <YAxis stroke="#6b7280" fontSize={12} />
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <Tooltip cursor={{ fill: "#374151" }} contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }} itemStyle={{ color: "#fff" }} />
                                <Legend wrapperStyle={{ color: "#9ca3af" }} />
                                <Bar dataKey="views" name="Lượt xem" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="users" name="Thành viên mới" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Activity & Quick Links */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Admin Activity */}
                <div className="bg-[#1a1a1a] p-6 rounded-lg border border-white/10">
                    <h3 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-yellow-500" /> Hoạt động gần đây
                    </h3>
                    {stats.recentActivity && stats.recentActivity.length > 0 ? (
                        <div className="space-y-3">
                            {stats.recentActivity.map((log: any) => (
                                <div key={log._id} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                    <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-bold text-sm ${ACTION_COLORS[log.action] || "text-white"}`}>
                                            {ACTION_LABELS[log.action] || log.action}
                                        </p>
                                        {log.entityName && (
                                            <p className="text-gray-400 text-xs truncate">{log.entityName}</p>
                                        )}
                                        <p className="text-gray-600 text-xs mt-0.5">
                                            {log.adminName} · {new Date(log.createdAt).toLocaleString("vi-VN")}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-gray-500 text-sm">Chưa có hoạt động nào được ghi nhận</div>
                    )}
                </div>

                {/* System Status */}
                <div className="bg-[#1a1a1a] p-6 rounded-lg border border-white/10">
                    <h3 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                        <Server className="w-5 h-5 text-green-500" /> Trạng thái hệ thống
                    </h3>
                    <div className="space-y-4">
                        <StatusRow label="Database" status="online" value="MongoDB Atlas" />
                        <StatusRow label="API Phim" status="online" value="phimapi.com" />
                        <StatusRow label="Storage" status="online" value="External CDN" />
                        <StatusRow label="Auth" status="online" value="NextAuth v4" />
                        <div className="pt-2 border-t border-white/10 mt-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Build time</span>
                                <span className="text-white font-mono text-xs">{new Date().toLocaleString("vi-VN")}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, color, label, value, sub }: any) {
    const colors: Record<string, string> = {
        blue: "text-blue-500 bg-blue-500/10",
        yellow: "text-yellow-500 bg-yellow-500/10",
        purple: "text-purple-500 bg-purple-500/10",
        green: "text-green-500 bg-green-500/10",
        orange: "text-orange-500 bg-orange-500/10",
    };
    return (
        <div className="bg-[#1a1a1a] p-5 rounded-lg border border-white/10 hover:border-white/20 transition-colors">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>
                <Icon className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-bold text-white">{value ?? "—"}</h3>
            <p className="text-gray-400 text-sm mt-0.5">{label}</p>
            {sub && <p className="text-gray-600 text-xs mt-0.5">{sub}</p>}
        </div>
    );
}

function StatusRow({ label, status, value }: { label: string; status: "online" | "offline" | "warn"; value: string }) {
    const dot = status === "online" ? "bg-green-500" : status === "warn" ? "bg-yellow-500" : "bg-red-500";
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${dot}`} />
                <span className="text-gray-400 text-sm">{label}</span>
            </div>
            <span className="text-white text-sm font-mono">{value}</span>
        </div>
    );
}
