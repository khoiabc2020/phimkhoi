"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
    Film, Video, LayoutGrid, Download, History, Heart, LogOut, Globe,
    X, ChevronDown, Home, Tv, Star, MonitorPlay, Smartphone, Clapperboard, LogIn, SlidersHorizontal
} from "lucide-react";
import { useState } from "react";

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    categories?: { name: string; slug: string }[];
    countries?: { name: string; slug: string }[];
}

// URL APK qua API route — server sẽ phục vụ file trực tiếp từ public/downloads/
const APK_DOWNLOAD_URL = "/api/download/apk";


export default function MobileMenu({
    isOpen,
    onClose,
    categories = [],
    countries = []
}: MobileMenuProps) {
    const { data: session } = useSession();
    const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
    const [isCountriesOpen, setIsCountriesOpen] = useState(false);

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
        { name: "Hoạt Hình", slug: "hoat-hinh" },
    ];

    const displayCountries = countries.length > 0 ? countries : [
        { name: "Hàn Quốc", slug: "han-quoc" },
        { name: "Trung Quốc", slug: "trung-quoc" },
        { name: "Nhật Bản", slug: "nhat-ban" },
        { name: "Âu Mỹ", slug: "au-my" },
        { name: "Thái Lan", slug: "thai-lan" },
        { name: "Việt Nam", slug: "viet-nam" },
    ];

    const navLinks = [
        { href: "/", label: "Trang Chủ", icon: Home },
        { href: "/loc-phim", label: "Lọc Phim Nâng Cao", icon: SlidersHorizontal, badge: "NEW" },
        { href: "/phim-han", label: "Phim Hàn Quốc", icon: Tv },
        { href: "/phim-trung", label: "Phim Trung Quốc", icon: Video },
        { href: "/danh-sach/phim-le", label: "Phim Lẻ", icon: Film },
        { href: "/danh-sach/tv-shows", label: "TV Shows", icon: Tv },
        { href: "/danh-sach/hoat-hinh", label: "Hoạt Hình", icon: Clapperboard },
        { href: "/danh-sach/phim-chieu-rap", label: "Chiếu Rạp", id: "cinema", icon: MonitorPlay, badge: "HOT" },
    ];

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div className="fixed inset-0 z-[9999] lg:hidden bg-black/78 backdrop-blur-[3px]" onClick={onClose} />
            )}

            {/* Drawer */}
            <div
                className={cn(
                    "fixed top-0 left-0 bottom-0 z-[10000] lg:hidden w-[min(320px,85vw)] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-[0_18px_60px_rgba(0,0,0,0.8)]",
                    "border-r border-white/[0.03] backdrop-blur-2xl bg-[#0a0a0a]",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 h-[72px] shrink-0 border-b border-white/[0.04] bg-[#0a0a0a]">
                    <Link href="/" onClick={onClose} className="flex items-center group">
                        <span className="font-display text-[22px] font-black uppercase tracking-tighter text-white group-active:scale-95 transition-transform">
                            KHOIPHIM<span className="text-[#8FA7C5] ml-0.5">.</span>
                        </span>
                    </Link>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.05] transition-all active:scale-90"
                        aria-label="Đóng menu"
                    >
                        <X className="w-5 h-5" strokeWidth={2.5} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-6 space-y-6">

                    {/* User Profile Section */}
                    {session ? (
                        <div className="rounded-2xl p-4 border border-white/[0.04] bg-[#111111]/50 backdrop-blur-sm">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#8FA7C5]/30 shrink-0 shadow-lg shadow-[#8FA7C5]/10">
                                    <img
                                        src={session.user?.image || `https://ui-avatars.com/api/?name=${session.user?.name}&background=1a1a1a&color=8FA7C5&bold=true`}
                                        alt={session.user?.name || "User"}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-white text-[16px] truncate tracking-tight">{session.user?.name}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#00A859] animate-pulse" />
                                        <p className="text-[12px] text-white/40 font-bold uppercase tracking-widest text-[10px]">Premium Member</p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                <Link href="/lich-su-xem" onClick={onClose}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold text-white/70 hover:text-white transition-all bg-white/[0.03] hover:bg-white/[0.08] active:scale-[0.98]"
                                >
                                    <History className="w-4 h-4 text-[#8FA7C5]" /> Lịch sử xem phim
                                </Link>
                                <Link href="/phim-yeu-thich" onClick={onClose}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold text-white/70 hover:text-white transition-all bg-white/[0.03] hover:bg-white/[0.08] active:scale-[0.98]"
                                >
                                    <Heart className="w-4 h-4 text-[#ff4b4b]" /> Phim đã yêu thích
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-2xl p-5 border border-white/[0.04] text-center bg-[#111111]/50">
                            <p className="text-white/30 mb-5 text-[13px] leading-relaxed font-medium">Đăng nhập để đồng bộ lịch sử xem & phim yêu thích của bạn.</p>
                            <Link href="/login" onClick={onClose}
                                className="flex items-center justify-center gap-2 w-full bg-white text-black font-black py-3 rounded-xl text-[14px] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-white/5"
                            >
                                <LogIn className="w-4 h-4" />
                                <span>Đăng nhập ngay</span>
                            </Link>
                        </div>
                    )}

                    {/* Navigation Heading */}
                    <div className="flex items-center gap-4 px-2">
                        <span className="text-[10px] text-white/20 font-black uppercase tracking-[0.3em] whitespace-nowrap">Duyệt Phim</span>
                        <div className="flex-1 h-px bg-white/[0.03]" />
                    </div>

                    {/* Navigation */}
                    <nav className="space-y-0.5">
                        {navLinks.map(({ href, label, icon: Icon, badge }) => (
                            <Link
                                key={href}
                                href={href}
                                onClick={onClose}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-[15px] font-semibold text-white/80 hover:text-white hover:bg-white/[0.05] transition-all group"
                            >
                                <Icon className="w-[17px] h-[17px] text-white/35 group-hover:text-[#8FA7C5]/80 transition-colors" strokeWidth={1.5} />
                                <span className="flex-1">{label}</span>
                                {badge && (
                                    <span className="text-[9px] font-black text-[#0a0a0a] bg-[#8FA7C5] px-1.5 py-0.5 rounded-md">{badge}</span>
                                )}
                            </Link>
                        ))}

                        {/* Categories Accordion */}
                        <div>
                            <button
                                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-[12px] text-[14px] font-medium text-white/70 hover:text-white hover:bg-white/[0.06] transition-all group"
                            >
                                <span className="flex items-center gap-3">
                                    <LayoutGrid className="w-[17px] h-[17px] text-white/30 group-hover:text-[#8FA7C5]/80 transition-colors" strokeWidth={1.5} />
                                    Thể Loại
                                </span>
                                <ChevronDown
                                    className="w-4 h-4 text-white/25 transition-transform duration-200"
                                    style={{ transform: isCategoriesOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                                    strokeWidth={1.5}
                                />
                            </button>
                            {isCategoriesOpen && (
                                <div className="mx-1 mt-1 mb-1 rounded-[12px] p-3 grid grid-cols-3 gap-1.5 max-h-[240px] overflow-y-auto custom-scrollbar bg-white/[0.03]">
                                    {displayCategories.map((cat) => (
                                        <Link
                                            key={cat.slug}
                                            href={`/the-loai/${cat.slug}`}
                                            onClick={onClose}
                                            className="text-white/55 text-[12px] hover:text-white px-2 py-2 rounded-[10px] text-center transition-colors hover:bg-white/[0.06]"
                                        >
                                            {cat.name}
                                        </Link>
                                    ))}
                                    <Link href="/the-loai" onClick={onClose}
                                        className="text-[#8FA7C5]/80 text-[12px] hover:text-[#8FA7C5] px-3 py-2 rounded-[10px] text-center transition-colors col-span-3 font-medium"
                                    >
                                        Xem tất cả thể loại →
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Countries Accordion */}
                        <div>
                            <button
                                onClick={() => setIsCountriesOpen(!isCountriesOpen)}
                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-[12px] text-[14px] font-medium text-white/70 hover:text-white hover:bg-white/[0.06] transition-all group"
                            >
                                <span className="flex items-center gap-3">
                                    <Globe className="w-[17px] h-[17px] text-white/30 group-hover:text-[#8FA7C5]/80 transition-colors" strokeWidth={1.5} />
                                    Quốc Gia
                                </span>
                                <ChevronDown
                                    className="w-4 h-4 text-white/25 transition-transform duration-200"
                                    style={{ transform: isCountriesOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                                    strokeWidth={1.5}
                                />
                            </button>
                            {isCountriesOpen && (
                                <div className="mx-1 mt-1 mb-1 rounded-[12px] p-3 grid grid-cols-3 gap-1.5 max-h-[240px] overflow-y-auto custom-scrollbar bg-white/[0.03]">
                                    {displayCountries.map((c) => (
                                        <Link
                                            key={c.slug}
                                            href={`/quoc-gia/${c.slug}`}
                                            onClick={onClose}
                                            className="text-white/55 text-[12px] hover:text-white px-2 py-2 rounded-[10px] text-center transition-colors hover:bg-white/[0.06]"
                                        >
                                            {c.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </nav>

                    {/* Divider */}
                    <div className="h-px bg-white/[0.05]" />

                    {/* Download App Banner */}
                    <div className="rounded-[14px] overflow-hidden border border-white/[0.08] bg-[#0B0B10]">
                        <div className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-[12px] bg-[#8FA7C5]/12 flex items-center justify-center border border-[#8FA7C5]/16">
                                    <Smartphone className="w-5 h-5 text-[#8FA7C5]" strokeWidth={1.5} />
                                </div>
                                <div>
                                    <p className="text-white font-semibold text-[14px]">Ứng Dụng KHOIPHIM</p>
                                    <p className="text-white/40 text-[12px]">Xem phim mọi lúc, mọi nơi</p>
                                </div>
                            </div>
                            <a
                                href={APK_DOWNLOAD_URL}
                                download="PhimKhoi-Release.apk"
                                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[12px] text-[13px] font-bold text-[#0a0a0a] bg-[#8FA7C5] hover:brightness-105 transition-all"
                            >
                                <Download className="w-4 h-4" strokeWidth={2.5} />
                                Tải APK Android
                            </a>
                        </div>
                    </div>

                    {/* Logout */}
                    {session && (
                        <div className="pb-6">
                            <button
                                onClick={() => signOut({ callbackUrl: "/login" })}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[12px] text-[14px] font-medium transition-all"
                                style={{ color: "#ff5a5a", background: "rgba(255,60,60,0.07)", border: "1px solid rgba(255,60,60,0.12)" }}
                            >
                                <LogOut className="w-4 h-4" strokeWidth={1.5} />
                                Đăng Xuất
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
