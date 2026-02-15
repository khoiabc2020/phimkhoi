"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Mail, Shield, User as UserIcon, Clock, Film, Save } from "lucide-react";
import { getImageUrl } from "@/lib/utils";
import Link from "next/link";

export default function AdminUserDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (id) fetchUserDetail();
    }, [id]);

    const fetchUserDetail = async () => {
        try {
            const res = await fetch(`/api/admin/users/${id}`);
            const data = await res.json();
            if (data.user) setUser(data.user);
            else router.push("/admin/users");
        } catch (error) {
            console.error("Failed to fetch user", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-20 text-center text-gray-500">Đang tải thông tin...</div>;
    if (!user) return null;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
                <ArrowLeft className="w-5 h-5" /> Quay lại
            </button>

            {/* Profile Header */}
            <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/10 shadow-lg">
                    <img
                        src={user.image ? getImageUrl(user.image) : `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                        alt={user.name}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="flex-1 text-center md:text-left space-y-2">
                    <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-400">
                        <span className="flex items-center gap-2"><Mail className="w-4 h-4" /> {user.email}</span>
                        <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Tham gia: {new Date(user.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="pt-2">
                        <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold border ${user.role === 'admin'
                            ? 'bg-red-500/10 text-red-500 border-red-500/20'
                            : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            }`}>
                            {user.role === 'admin' ? <Shield className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                            {user.role.toUpperCase()}
                        </span>
                    </div>
                </div>
                <div className="flex flex-col gap-3">
                    <button className="px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-yellow-400 transition-colors shadow-lg shadow-primary/20 flex items-center gap-2">
                        <Save className="w-5 h-5" /> Lưu thay đổi
                    </button>
                    {/* Role Toggle Mock */}
                    <button className="px-6 py-3 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-colors border border-white/10">
                        Đổi mật khẩu
                    </button>
                </div>
            </div>

            {/* Watch History */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Clock className="w-6 h-6 text-primary" /> Lịch sử xem phim ({user.history?.length || 0})
                </h2>

                {user.history && user.history.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {user.history.map((item: any, index: number) => (
                            <Link href={`/phim/${item.slug}`} key={index} className="bg-[#1a1a1a] p-4 rounded-xl border border-white/10 hover:border-primary/50 transition-all group flex gap-4">
                                <div className="w-16 h-24 bg-gray-800 rounded-lg overflow-hidden shrink-0">
                                    <img
                                        src={`https://phimimg.com/${item.slug}/thumb.jpg`} // Placeholder heuristic
                                        onError={(e) => (e.currentTarget.src = "https://phimimg.com/upload/vod/20240801-1/5b35c0293375815615d1858564245598.jpg")}
                                        alt={item.slug}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                    />
                                </div>
                                <div className="flex-1 min-w-0 py-1">
                                    <h3 className="font-bold text-white truncate group-hover:text-primary transition-colors uppercase">{item.slug.replace(/-/g, " ")}</h3>
                                    <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                                        <Film className="w-3 h-3" /> Tập: <span className="text-white">{item.episode}</span>
                                    </p>
                                    <p className="text-gray-500 text-xs mt-2">
                                        {new Date(item.timestamp).toLocaleString('vi-VN')}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="p-10 bg-[#1a1a1a] rounded-2xl border border-white/10 text-center text-gray-500">
                        Người dùng này chưa xem phim nào.
                    </div>
                )}
            </div>
        </div>
    );
}
