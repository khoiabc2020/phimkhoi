"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Users, Film, Activity, Server, TrendingUp, DollarSign } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function AdminPage() {
    const { data: session } = useSession();
    const [stats, setStats] = useState({ users: 0, comments: 0, movies: 0, active: 0, chartData: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
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

    if (loading) return <div className="text-white text-center py-20">Loading Dashboard...</div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Tổng Quan</h1>
                    <p className="text-gray-400">Chào mừng trở lại, {session?.user?.name}</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-primary text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors">
                        Tải báo cáo
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={Users} color="blue" label="Thành viên" value={stats.users} trend="+12%" />
                <StatCard icon={Film} color="yellow" label="Tổng phim" value={(stats.movies || 0).toLocaleString()} trend="+5%" />
                <StatCard icon={Activity} color="purple" label="Bình luận" value={stats.comments} trend="+8%" />
                <StatCard icon={Server} color="green" label="Hệ thống" value="99.9%" sub="Uptime" />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Growth Chart */}
                <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/10">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-500" /> Tăng trưởng thành viên
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.chartData && stats.chartData.length > 0 ? stats.chartData : []}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#6b7280" />
                                <YAxis stroke="#6b7280" />
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="users" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsers)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Activity Chart */}
                <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/10">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-purple-500" /> Lượt xem & Tương tác
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.chartData && stats.chartData.length > 0 ? stats.chartData : []}>
                                <XAxis dataKey="name" stroke="#6b7280" />
                                <YAxis stroke="#6b7280" />
                                <Tooltip
                                    cursor={{ fill: '#374151' }}
                                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="views" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, color, label, value, trend, sub }: any) {
    const colors: any = {
        blue: "text-blue-500 bg-blue-500/10",
        yellow: "text-yellow-500 bg-yellow-500/10",
        purple: "text-purple-500 bg-purple-500/10",
        green: "text-green-500 bg-green-500/10",
    };

    return (
        <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-colors">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${colors[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend && (
                    <span className="text-green-500 text-sm font-bold bg-green-500/10 px-2 py-1 rounded-full">
                        {trend}
                    </span>
                )}
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
            <p className="text-gray-400 text-sm">{label} {sub && <span className="text-gray-500">({sub})</span>}</p>
        </div>
    );
}
