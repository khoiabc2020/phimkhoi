"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Play, Film, Video, LayoutGrid, Download, History, Heart, LogOut, Settings, X, ChevronDown } from "lucide-react";
import { useState } from "react";

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    categories?: { name: string; slug: string }[];
    countries?: { name: string; slug: string }[];
}

export default function MobileMenu({
    isOpen,
    onClose,
    categories = [],
    countries = []
}: MobileMenuProps) {
    const { data: session } = useSession();

    // Fallback data if empty
    const displayCategories = categories.length > 0 ? categories : [
        { name: "Hành Động", slug: "hanh-dong" },
        { name: "Tình Cảm", slug: "tinh-cam" },
        { name: "Hài Hước", slug: "hai-huoc" },
        { name: "Cổ Trang", slug: "co-trang" },
        { name: "Tâm Lý", slug: "tam-ly" },
        { name: "Hình Sự", slug: "hinh-su" },
        { name: "Chiến Tranh", slug: "chien-tranh" },
        { name: "Viễn Tưởng", slug: "vien-tuong" },
        { name: "Kinh Dị", slug: "kinh-di" },
        { name: "Hoạt Hình", slug: "hoat-hinh" }
    ];

    const displayCountries = countries.length > 0 ? countries : [
        { name: "Trung Quốc", slug: "trung-quoc" },
        { name: "Hàn Quốc", slug: "han-quoc" },
        { name: "Nhật Bản", slug: "nhat-ban" },
        { name: "Mỹ", slug: "my" },
        { name: "Thái Lan", slug: "thai-lan" },
        { name: "Việt Nam", slug: "viet-nam" }
    ];

    const [isCategoriesOpen, setIsCategoriesOpen] = useState(true);
    const [isCountriesOpen, setIsCountriesOpen] = useState(true);

    return (
        <div
            className={cn(
                "fixed inset-0 z-[10000] lg:hidden bg-black/95 backdrop-blur-xl transition-transform duration-300 ease-in-out flex flex-col",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}
        >
            {/* Mobile Header with Close Button */}
            <div className="flex items-center justify-between px-4 h-20 border-b border-white/10 shrink-0">
                <Link href="/" onClick={onClose} className="flex items-center gap-2">
                    <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-primary to-yellow-600 flex items-center justify-center shadow-lg shadow-primary/30">
                        <Play className="w-4 h-4 text-black fill-black ml-0.5" />
                    </div>
                    <span className="text-xl font-black text-white tracking-tighter">MOVIE<span className="text-primary">BOX</span></span>
                </Link>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
                    aria-label="Close menu"
                >
                    <X className="w-8 h-8" />
                </button>
            </div>

            {/* Mobile Menu Content */}
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
                {/* User Profile Section */}
                {session ? (
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary">
                                <img
                                    src={session.user?.image || `https://ui-avatars.com/api/?name=${session.user?.name}&background=random`}
                                    alt={session.user?.name || "User"}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div>
                                <p className="font-bold text-white text-lg">{session.user?.name}</p>
                                <p className="text-xs text-gray-400">Thành viên</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Link
                                href="/lich-su-xem"
                                onClick={onClose}
                                className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-gray-300"
                            >
                                <History className="w-4 h-4 text-blue-400" /> Lịch sử
                            </Link>
                            <Link
                                href="/phim-yeu-thich"
                                onClick={onClose}
                                className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-gray-300"
                            >
                                <Heart className="w-4 h-4 text-red-400" /> Yêu thích
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gradient-to-r from-primary/20 to-yellow-600/20 rounded-2xl p-6 border border-primary/20 text-center">
                        <p className="text-gray-300 mb-4 text-sm">Đăng nhập để lưu phim yêu thích và lịch sử xem</p>
                        <Link
                            href="/login"
                            onClick={onClose}
                            className="block w-full bg-primary text-black font-bold py-3 rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                        >
                            Đăng Nhập / Đăng Ký
                        </Link>
                    </div>
                )}

                {/* Navigation Links */}
                <nav className="space-y-2">
                    <Link
                        href="/"
                        onClick={onClose}
                        className="flex items-center gap-4 text-lg font-bold text-white p-3 rounded-xl hover:bg-white/5 transition-colors"
                    >
                        <span className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-500">
                            <Play className="w-4 h-4 fill-current" />
                        </span>
                        Trang Chủ
                    </Link>
                    <Link
                        href="/danh-sach/phim-le"
                        onClick={onClose}
                        className="flex items-center gap-4 text-lg font-bold text-white p-3 rounded-xl hover:bg-white/5 transition-colors"
                    >
                        <span className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-500">
                            <Film className="w-4 h-4" />
                        </span>
                        Phim Lẻ
                    </Link>
                    <Link
                        href="/danh-sach/phim-bo"
                        onClick={onClose}
                        className="flex items-center gap-4 text-lg font-bold text-white p-3 rounded-xl hover:bg-white/5 transition-colors"
                    >
                        <span className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-500">
                            <Film className="w-4 h-4" />
                        </span>
                        Phim Bộ
                    </Link>
                    <Link
                        href="/danh-sach/tv-shows"
                        onClick={onClose}
                        className="flex items-center gap-4 text-lg font-bold text-white p-3 rounded-xl hover:bg-white/5 transition-colors"
                    >
                        <span className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-500">
                            <Video className="w-4 h-4" />
                        </span>
                        TV Shows
                    </Link>

                    {/* Expandable Categories */}
                    <div className="space-y-1">
                        <button
                            onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                            className="w-full flex items-center justify-between text-lg font-bold text-white p-3 rounded-xl bg-white/5"
                        >
                            <div className="flex items-center gap-4">
                                <span className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                                    <LayoutGrid className="w-4 h-4" />
                                </span>
                                <span>Thể Loại</span>
                            </div>
                            <ChevronDown className={cn("w-5 h-5 transition-transform", isCategoriesOpen ? "rotate-180" : "")} />
                        </button>

                        {isCategoriesOpen && (
                            <div className="pl-4 grid grid-cols-2 gap-2 pt-2 animate-in slide-in-from-top-2 duration-200">
                                {displayCategories.slice(0, 10).map((cat) => (
                                    <Link
                                        key={cat.slug}
                                        href={`/the-loai/${cat.slug}`}
                                        onClick={onClose}
                                        className="text-gray-400 text-sm hover:text-white bg-white/5 p-2 rounded text-center transition-colors"
                                    >
                                        {cat.name}
                                    </Link>
                                ))}
                                <Link
                                    href="/danh-sach/tat-ca-the-loai"
                                    onClick={onClose}
                                    className="text-primary text-sm font-medium hover:text-white bg-white/5 p-2 rounded text-center transition-colors col-span-2"
                                >
                                    Xem tất cả...
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Expandable Countries */}
                    <div className="space-y-1">
                        <button
                            onClick={() => setIsCountriesOpen(!isCountriesOpen)}
                            className="w-full flex items-center justify-between text-lg font-bold text-white p-3 rounded-xl bg-white/5"
                        >
                            <div className="flex items-center gap-4">
                                <span className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-500">
                                    <Settings className="w-4 h-4" />
                                </span>
                                <span>Quốc Gia</span>
                            </div>
                            <ChevronDown className={cn("w-5 h-5 transition-transform", isCountriesOpen ? "rotate-180" : "")} />
                        </button>

                        {isCountriesOpen && (
                            <div className="pl-4 grid grid-cols-2 gap-2 pt-2 animate-in slide-in-from-top-2 duration-200">
                                {displayCountries.map((country) => (
                                    <Link
                                        key={country.slug}
                                        href={`/quoc-gia/${country.slug}`}
                                        onClick={onClose}
                                        className="text-gray-400 text-sm hover:text-white bg-white/5 p-2 rounded text-center transition-colors"
                                    >
                                        {country.name}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </nav>

                {/* Mobile Download App */}
                <div className="pt-4 pb-4">
                    <a href="/app-release.apk" target="_blank" download className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-3 rounded-xl hover:brightness-110 transition-all shadow-lg shadow-blue-500/20">
                        <Download className="w-5 h-5" /> Tải Ứng Dụng Mobile
                    </a>
                </div>

                {/* Footer Actions */}
                {session && (
                    <div className="pt-6 border-t border-white/10 pb-20">
                        <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-500 font-bold hover:bg-red-500/20 transition-colors"
                        >
                            <LogOut className="w-5 h-5" /> Đăng Xuất
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
