"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { User, LogOut, History, Heart, Settings, Camera } from "lucide-react";

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-[#111] flex items-center justify-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
            </div>
        );
    }

    if (!session) return null;

    return (
        <main className="min-h-screen bg-[#111] text-white pb-20">
            {/* Cover Image */}
            <div className="h-60 w-full relative bg-gradient-to-r from-yellow-900/20 to-black">
                <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent"></div>
            </div>

            <div className="container mx-auto px-4 -mt-20 relative z-10">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Sidebar */}
                    <div className="w-full md:w-1/4">
                        <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-white/5 text-center shadow-xl">
                            <div className="relative inline-block mb-4">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#111] shadow-2xl mx-auto bg-gradient-to-br from-yellow-500 to-yellow-700 p-1">
                                    {session.user?.image ? (
                                        <Image
                                            src={session.user.image}
                                            alt={session.user.name || "User"}
                                            width={128}
                                            height={128}
                                            className="rounded-full object-cover w-full h-full bg-[#111]"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-[#333] flex items-center justify-center text-4xl font-bold text-white rounded-full">
                                            {session.user?.name?.[0] || "U"}
                                        </div>
                                    )}
                                </div>
                                <button className="absolute bottom-0 right-0 bg-yellow-500 p-2 rounded-full hover:bg-yellow-400 transition-colors shadow-lg">
                                    <Camera className="w-4 h-4 text-black" />
                                </button>
                            </div>

                            <h1 className="text-2xl font-bold text-white mb-1">{session.user?.name}</h1>
                            <p className="text-gray-400 text-sm mb-6">{session.user?.email}</p>

                            <div className="space-y-2">
                                <button
                                    onClick={() => setActiveTab("overview")}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "overview" ? "bg-yellow-500 text-black font-semibold" : "hover:bg-white/5 text-gray-300"
                                        }`}
                                >
                                    <User className="w-5 h-5" /> Tổng quan
                                </button>
                                <Link href="/lich-su-xem" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-gray-300 transition-all">
                                    <History className="w-5 h-5" /> Lịch sử xem
                                </Link>
                                <Link href="/phim-yeu-thich" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-gray-300 transition-all">
                                    <Heart className="w-5 h-5" /> Phim yêu thích
                                </Link>
                                <div className="h-px bg-white/10 my-2"></div>
                                <button
                                    onClick={() => signOut()}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-500 transition-all"
                                >
                                    <LogOut className="w-5 h-5" /> Đăng xuất
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 w-full text-white"> {/* Add text-white explicitly */}
                        <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-white/5 min-h-[400px]">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <Settings className="w-6 h-6 text-yellow-500" />
                                Thông tin cá nhân
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-gray-400 text-sm">Tên hiển thị</label>
                                    <div className="bg-[#111] p-4 rounded-xl border border-white/5 text-white">
                                        {session.user?.name}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-gray-400 text-sm">Email</label>
                                    <div className="bg-[#111] p-4 rounded-xl border border-white/5 text-gray-300">
                                        {session.user?.email}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-gray-400 text-sm">ID Người dùng</label>
                                    <div className="bg-[#111] p-4 rounded-xl border border-white/5 text-gray-500 font-mono text-sm">
                                        {/* @ts-ignore */}
                                        {session.user?.id || "N/A"}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-gray-400 text-sm">Vai trò</label>
                                    <div className="bg-[#111] p-4 rounded-xl border border-white/5 text-yellow-500 font-semibold">
                                        Thành viên
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 p-6 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                                <h3 className="text-yellow-500 font-bold mb-2">Gói thành viên</h3>
                                <p className="text-gray-300">Bạn đang sử dụng gói <span className="text-white font-bold">Miễn phí</span>. Nâng cấp lên VIP để xem phim không quảng cáo và chất lượng 4K.</p>
                                <button className="mt-4 px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition-colors">
                                    Nâng cấp ngay
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
