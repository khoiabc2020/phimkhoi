"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    User, LogOut, History, Heart, Settings, Camera, Plus, Activity, Clock,
    ChevronRight, Play, X, Trash2, Edit2
} from "lucide-react";

// Mock Data for "Danh sách" (Lists) demo to match screenshot
const MOCK_LISTS = [
    { id: 1, name: "Hay VL", count: 3, slug: "hay-vl" }
];

const MOCK_LIST_MOVIES = [
    {
        id: 1,
        title: "Gia Tài Của Ngoại",
        image: "https://image.tmdb.org/t/p/w342/jB98FIrO7z1t3s6E3L7k0.jpg", // Placeholder or real URL
        quality: "FHD",
        lang: "L.Tiếng"
    },
    {
        id: 2,
        title: "Lâu Đài Di Động Của Pháp Sư Howl",
        image: "https://image.tmdb.org/t/p/w342/6pZgH10jhpToPcf0uvyTA.jpg",
        quality: "FHD",
        lang: "L.Tiếng"
    },
    {
        id: 3,
        title: "Khi Điện Thoại Đổ Chuông",
        image: "https://image.tmdb.org/t/p/w342/8GK1.jpg", // Placeholder
        quality: "FHD",
        lang: "TM, 8"
    }
];

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("account"); // Default tab

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!session) return null;

    const renderContent = () => {
        switch (activeTab) {
            case "favorites":
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6">Phim Yêu Thích</h2>
                        <div className="text-gray-400 text-center py-20 bg-[#151515] rounded-xl border border-white/5">
                            <Heart className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                            <p>Chưa có phim yêu thích nào.</p>
                            <Link href="/" className="text-yellow-500 mt-2 inline-block hover:underline">Khám phá ngay</Link>
                        </div>
                    </div>
                );
            case "lists":
                return (
                    <div>
                        <div className="flex items-center gap-4 mb-8">
                            <h2 className="text-2xl font-bold text-white">Danh sách</h2>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-full transition-colors border border-white/10">
                                <Plus className="w-3.5 h-3.5" /> Thêm mới
                            </button>
                        </div>

                        {/* List Collections */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                            {MOCK_LISTS.map(list => (
                                <div key={list.id} className="bg-[#151515] border border-yellow-500/50 p-4 rounded-xl relative group cursor-pointer hover:bg-[#1a1a1a] transition-colors">
                                    <h3 className="text-white font-bold text-lg">{list.name}</h3>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-gray-400 text-xs flex items-center gap-1">
                                            <Play className="w-3 h-3 bg-gray-700 rounded-full p-0.5" /> {list.count} phim
                                        </span>
                                        <button className="text-gray-500 hover:text-white text-xs">Sửa</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Movies Grid (Matches Screenshot) */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {MOCK_LIST_MOVIES.map((movie, idx) => ( // Using mock data to replicate design
                                <div key={idx} className="relative group">
                                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-[#151515]">
                                        {/* Delete Button */}
                                        <button className="absolute top-2 right-2 w-6 h-6 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-red-500 transition-all z-10">
                                            <X className="w-3.5 h-3.5" />
                                        </button>

                                        {/* Poster */}
                                        <img
                                            src={movie.image || `https://placehold.co/300x450/111/333?text=${movie.title}`}
                                            alt={movie.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />

                                        {/* Quality Badges */}
                                        <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                                            <span className="px-1.5 py-0.5 bg-black/60 backdrop-blur-md border border-white/10 rounded text-[10px] font-bold text-white uppercase">
                                                {movie.quality}
                                            </span>
                                            <span className="px-1.5 py-0.5 bg-blue-600/80 backdrop-blur-md rounded text-[10px] font-bold text-white uppercase">
                                                {movie.lang}
                                            </span>
                                        </div>
                                    </div>
                                    <h3 className="text-white text-sm font-medium mt-2 line-clamp-2 hover:text-yellow-500 transition-colors cursor-pointer">
                                        {movie.title}
                                    </h3>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case "continue-watching":
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6">Đang xem dở</h2>
                        <div className="text-gray-400 text-center py-20 bg-[#151515] rounded-xl border border-white/5">
                            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                            <p>Lịch sử xem trống.</p>
                            <Link href="/" className="text-yellow-500 mt-2 inline-block hover:underline">Xem phim ngay</Link>
                        </div>
                    </div>
                );
            case "account":
            default:
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6">Thông tin tài khoản</h2>
                        <div className="bg-[#151515] rounded-2xl p-6 border border-white/5 max-w-2xl">
                            <div className="flex items-start gap-6">
                                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-yellow-500/50 bg-[#222]">
                                    {session.user?.image ? (
                                        <Image src={session.user.image} alt="Avatar" width={96} height={96} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-yellow-500">
                                            {session.user?.name?.[0]}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <label className="text-gray-500 text-xs font-bold uppercase mb-1 block">Tên hiển thị</label>
                                        <div className="flex items-center justify-between bg-[#0a0a0a] p-3 rounded-lg border border-white/5">
                                            <span className="text-white font-medium">{session.user?.name}</span>
                                            <Edit2 className="w-4 h-4 text-gray-500 cursor-pointer hover:text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-gray-500 text-xs font-bold uppercase mb-1 block">Email</label>
                                        <div className="flex items-center justify-between bg-[#0a0a0a] p-3 rounded-lg border border-white/5">
                                            <span className="text-gray-300">{session.user?.email}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-gray-500 text-xs font-bold uppercase mb-1 block">Vai trò</label>
                                        <span className="text-yellow-500 font-bold bg-yellow-500/10 px-3 py-1 rounded text-sm">Thành viên</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <main className="min-h-screen bg-[#0a0a0a] pt-24 pb-20">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row gap-8 min-h-[600px]">

                    {/* Sidebar Navigation */}
                    <div className="w-full md:w-64 flex-shrink-0">
                        <div className="bg-[#151515] rounded-2xl p-6 border border-white/5 h-full flex flex-col sticky top-24">
                            <h1 className="text-lg font-bold text-white mb-6 px-2">Quản lý tài khoản</h1>

                            <nav className="flex-1 space-y-1">
                                <button
                                    onClick={() => setActiveTab("favorites")}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeTab === "favorites" ? "text-yellow-400 bg-white/5" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
                                >
                                    <Heart className="w-4 h-4" /> Yêu thích
                                </button>
                                <button
                                    onClick={() => setActiveTab("lists")}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeTab === "lists" ? "text-yellow-400 bg-white/5" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
                                >
                                    <Plus className="w-4 h-4" /> Danh sách
                                </button>
                                <button
                                    onClick={() => setActiveTab("continue-watching")}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeTab === "continue-watching" ? "text-yellow-400 bg-white/5" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
                                >
                                    <History className="w-4 h-4" /> Xem tiếp
                                </button>
                                <button
                                    onClick={() => setActiveTab("account")}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeTab === "account" ? "text-yellow-400 bg-white/5" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
                                >
                                    <User className="w-4 h-4" /> Tài khoản
                                </button>
                            </nav>

                            {/* Divider */}
                            <div className="h-px bg-white/10 my-6"></div>

                            {/* User Footer */}
                            <div className="flex items-center gap-3 px-2 mb-4">
                                <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden border border-white/10 shrink-0">
                                    {session.user?.image ? (
                                        <Image src={session.user.image} alt="Avatar" width={40} height={40} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white font-bold bg-[#333]">
                                            {session.user?.name?.[0]}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-bold text-sm truncate">{session.user?.name}</p>
                                    <p className="text-gray-500 text-xs truncate max-w-[120px]">{session.user?.email}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => signOut({ callbackUrl: "/login" })}
                                className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-red-500 transition-colors text-sm font-medium"
                            >
                                <LogOut className="w-4 h-4" /> Thoát
                            </button>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 w-full md:min-w-0">
                        {renderContent()}
                    </div>

                </div>
            </div>
        </main>
    );
}
