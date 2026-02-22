"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Play, Film, Video, LayoutGrid, Download, History, Heart, LogOut, Globe, X, ChevronDown, Home, Tv } from "lucide-react";
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

    const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
    const [isCountriesOpen, setIsCountriesOpen] = useState(false);

    const navLinks = [
        { href: "/", label: "Trang Chủ", icon: Home },
        { href: "/danh-sach/phim-le", label: "Phim Lẻ", icon: Film },
        { href: "/danh-sach/phim-bo", label: "Phim Bộ", icon: Video },
        { href: "/danh-sach/tv-shows", label: "TV Shows", icon: Tv },
    ];

    return (
        <>
            {/* Backdrop overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[9999] lg:hidden bg-black/80"
                    onClick={onClose}
                />
            )}

            {/* Drawer */}
            <div
                className={cn(
                    "fixed top-0 left-0 bottom-0 z-[10000] lg:hidden w-[310px] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
                    "border-r border-white/[0.06]",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
                style={{
                    background: "#0D101A",
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 h-[72px] shrink-0 border-b border-white/[0.06]">
                    <Link href="/" onClick={onClose} className="flex items-center gap-2.5">
                        <Image
                            src="/logo.webp"
                            alt="MovieBox Logo"
                            width={28}
                            height={28}
                            className="w-7 h-7 rounded-lg object-cover shadow-[0_0_12px_rgba(244,200,74,0.2)]"
                        />
                        <span className="text-[17px] font-black text-white tracking-tighter">MOVIE<span className="text-[#F4C84A]">BOX</span></span>
                    </Link>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.08] transition-all"
                        aria-label="Đóng menu"
                    >
                        <X className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto min-h-0 px-4 py-5 space-y-5">

                    {/* User Card */}
                    {session ? (
                        <div
                            className="rounded-[20px] p-4 border border-white/[0.07]"
                            style={{ background: "rgba(255,255,255,0.05)" }}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20 shrink-0">
                                    <img
                                        src={session.user?.image || `https://ui-avatars.com/api/?name=${session.user?.name}&background=2a2d3a&color=F4C84A&bold=true`}
                                        alt={session.user?.name || "User"}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-white text-[16px] truncate">{session.user?.name}</p>
                                    <p className="text-[13px] text-white/50">Thành viên</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Link
                                    href="/lich-su-xem"
                                    onClick={onClose}
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] text-white/60 hover:text-white transition-colors"
                                    style={{ background: "rgba(255,255,255,0.05)" }}
                                >
                                    <History className="w-4 h-4" strokeWidth={1.5} /> Lịch sử
                                </Link>
                                <Link
                                    href="/phim-yeu-thich"
                                    onClick={onClose}
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] text-white/60 hover:text-white transition-colors"
                                    style={{ background: "rgba(255,255,255,0.05)" }}
                                >
                                    <Heart className="w-4 h-4" strokeWidth={1.5} /> Yêu thích
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div
                            className="rounded-[20px] p-5 border border-[#F4C84A]/15 text-center"
                            style={{ background: "rgba(244,200,74,0.07)" }}
                        >
                            <p className="text-white/50 mb-4 text-[13px] leading-relaxed">Đăng nhập để lưu phim yêu thích và lịch sử xem</p>
                            <Link
                                href="/login"
                                onClick={onClose}
                                className="block w-full bg-[#F4C84A] text-black font-bold py-2.5 rounded-[14px] text-[14px] hover:brightness-110 transition-all"
                            >
                                Đăng Nhập / Đăng Ký
                            </Link>
                        </div>
                    )}

                    {/* Navigation */}
                    <nav className="space-y-0.5">
                        {navLinks.map(({ href, label, icon: Icon }) => (
                            <Link
                                key={href}
                                href={href}
                                onClick={onClose}
                                className="flex items-center gap-3 px-3 py-3 rounded-[14px] text-[15px] font-medium text-white/75 hover:text-white hover:bg-white/[0.06] transition-all"
                            >
                                <Icon className="w-[18px] h-[18px] text-white/40" strokeWidth={1.5} />
                                {label}
                            </Link>
                        ))}

                        {/* Categories Accordion */}
                        <div>
                            <button
                                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                                className="w-full flex items-center justify-between px-3 py-3 rounded-[14px] text-[15px] font-medium text-white/75 hover:text-white hover:bg-white/[0.06] transition-all"
                            >
                                <span className="flex items-center gap-3">
                                    <LayoutGrid className="w-[18px] h-[18px] text-white/40" strokeWidth={1.5} />
                                    Thể Loại
                                </span>
                                <ChevronDown
                                    className="w-4 h-4 text-white/30 transition-transform duration-200"
                                    style={{ transform: isCategoriesOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                                    strokeWidth={1.5}
                                />
                            </button>
                            {isCategoriesOpen && (
                                <div
                                    className="mx-1 mt-1 mb-1 rounded-[16px] p-3 grid grid-cols-2 gap-1.5"
                                    style={{ background: "rgba(255,255,255,0.04)" }}
                                >
                                    {displayCategories.slice(0, 10).map((cat) => (
                                        <Link
                                            key={cat.slug}
                                            href={`/the-loai/${cat.slug}`}
                                            onClick={onClose}
                                            className="text-white/55 text-[13px] hover:text-white px-3 py-2 rounded-xl text-center transition-colors hover:bg-white/[0.06]"
                                        >
                                            {cat.name}
                                        </Link>
                                    ))}
                                    <Link
                                        href="/danh-sach/tat-ca-the-loai"
                                        onClick={onClose}
                                        className="text-[#F4C84A]/80 text-[13px] hover:text-[#F4C84A] px-3 py-2 rounded-xl text-center transition-colors col-span-2"
                                    >
                                        Xem tất cả →
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Countries Accordion */}
                        <div>
                            <button
                                onClick={() => setIsCountriesOpen(!isCountriesOpen)}
                                className="w-full flex items-center justify-between px-3 py-3 rounded-[14px] text-[15px] font-medium text-white/75 hover:text-white hover:bg-white/[0.06] transition-all"
                            >
                                <span className="flex items-center gap-3">
                                    <Globe className="w-[18px] h-[18px] text-white/40" strokeWidth={1.5} />
                                    Quốc Gia
                                </span>
                                <ChevronDown
                                    className="w-4 h-4 text-white/30 transition-transform duration-200"
                                    style={{ transform: isCountriesOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                                    strokeWidth={1.5}
                                />
                            </button>
                            {isCountriesOpen && (
                                <div
                                    className="mx-1 mt-1 mb-1 rounded-[16px] p-3 grid grid-cols-2 gap-1.5"
                                    style={{ background: "rgba(255,255,255,0.04)" }}
                                >
                                    {displayCountries.map((country) => (
                                        <Link
                                            key={country.slug}
                                            href={`/quoc-gia/${country.slug}`}
                                            onClick={onClose}
                                            className="text-white/55 text-[13px] hover:text-white px-3 py-2 rounded-xl text-center transition-colors hover:bg-white/[0.06]"
                                        >
                                            {country.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </nav>

                    {/* Download App Button */}
                    <a
                        href="/app-release.apk"
                        target="_blank"
                        download
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-[16px] text-[14px] font-semibold text-black bg-[#F4C84A] hover:brightness-105 transition-all shadow-[0_0_20px_rgba(244,200,74,0.2)]"
                    >
                        <Download className="w-4 h-4" strokeWidth={2} />
                        Tải Ứng Dụng Mobile
                    </a>

                    {/* Logout */}
                    {session && (
                        <div className="pb-8">
                            <button
                                onClick={() => signOut({ callbackUrl: "/login" })}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-[16px] text-[14px] font-medium transition-all"
                                style={{ color: "#ff5555", background: "rgba(255,60,60,0.08)" }}
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
