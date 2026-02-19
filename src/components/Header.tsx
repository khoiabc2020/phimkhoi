"use client";

import Link from "next/link";
import { Search, Bell, User, LogOut, Shield, Trash2, Clock, History, Heart, Settings, Menu, X, ChevronDown, Play, Film, Video, LayoutGrid, Download } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import MobileMenu from "./MobileMenu";

interface HeaderProps {
    categories?: { name: string; slug: string }[];
    countries?: { name: string; slug: string }[];
}

export default function Header({ categories = [], countries = [] }: HeaderProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const { data: session } = useSession();
    const searchInputRef = useRef<HTMLInputElement>(null);

    const handleSearch = (e?: React.FormEvent | string) => {
        if (e && typeof e === 'object' && 'preventDefault' in e) {
            e.preventDefault();
        }
        const searchTerm = typeof e === 'string' ? e : searchQuery;

        if (searchTerm.trim()) {
            // Save to history
            const newHistory = [searchTerm, ...searchHistory.filter(h => h !== searchTerm)].slice(0, 10);
            setSearchHistory(newHistory);
            localStorage.setItem('searchHistory', JSON.stringify(newHistory));

            router.push(`/tim-kiem?q=${encodeURIComponent(searchTerm)}`);
            setIsSearchOpen(false);
            setShowHistory(false);
            setSearchQuery("");
        }
    };

    const clearHistory = () => {
        setSearchHistory([]);
        localStorage.removeItem('searchHistory');
        setShowHistory(false);
    };

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Load search history from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('searchHistory');
        if (saved) {
            try {
                setSearchHistory(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load search history:', e);
            }
        }
    }, []);

    useEffect(() => {
        if (isSearchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchOpen]);

    // Hide Header on specific routes
    if (pathname === "/login" || pathname === "/register" || pathname?.startsWith("/admin")) {
        return null;
    }

    // Prevent hydration mismatch by returning null on server or initial client render if needed
    // However, for SEO we usually want the header. The error #418 often comes from invalid nesting.
    // Let's verify nesting first.
    // Structure: header > div > (button, Link, nav) | div > (form > div, div, input, button) | div > (Link, Link, div, button).
    // The nesting seems correct.
    // The error might be due to extensions.
    // Let's try adding suppressHydrationWarning to the header tag.

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
        { name: "Trung Quốc", slug: "trung-quoc" },
        { name: "Hàn Quốc", slug: "han-quoc" },
        { name: "Nhật Bản", slug: "nhat-ban" },
        { name: "Mỹ", slug: "my" },
        { name: "Thái Lan", slug: "thai-lan" },
        { name: "Việt Nam", slug: "viet-nam" },
    ];

    if (!mounted) return null; // Force client-side rendering to avoid hydration mismatch completely

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
                isScrolled
                    ? "backdrop-blur-[28px] bg-[#0B0D12]/80 border-b border-white/5 shadow-2xl shadow-black/50"
                    : "bg-gradient-to-b from-black/80 via-black/40 to-transparent backdrop-blur-[2px]"
            )}
        >
            <div className="max-w-[1600px] mx-auto px-4 lg:px-8 h-[72px] flex items-center justify-between gap-4 flex-nowrap">

                {/* Left Section: Logo & Mobile Menu */}
                <div className="flex items-center gap-4 shrink-0">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="lg:hidden p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors order-1 md:order-none"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group shrink-0 order-2 md:order-none">
                        <div className="relative w-9 h-9 md:w-10 md:h-10 flex items-center justify-center">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative w-full h-full rounded-full border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                                <Play className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary fill-primary ml-0.5" />
                            </div>
                        </div>
                        <div className="flex flex-col justify-center">
                            <span className="text-lg md:text-xl lg:text-2xl font-bold text-white tracking-tight leading-none font-sans whitespace-nowrap">
                                MOVIE<span className="text-primary">BOX</span>
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Middle Section: Desktop Nav */}
                <nav className="hidden lg:flex items-center gap-1 xl:gap-2 absolute left-1/2 -translate-x-1/2">
                    <Link href="/" className="px-3 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-full transition-all whitespace-nowrap">
                        Trang chủ
                    </Link>

                    {/* Categories Dropdown */}
                    <div className="relative group">
                        <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white/70 group-hover:text-white hover:bg-white/5 rounded-full transition-all whitespace-nowrap">
                            Thể loại <ChevronDown className="w-3 h-3 transition-transform group-hover:rotate-180" />
                        </button>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-[400px] bg-[#0B0D12]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 shadow-[0_20px_40px_rgba(0,0,0,0.5)] grid grid-cols-2 gap-2 z-50 mt-2">
                            {displayCategories.map((cat) => (
                                <Link
                                    key={cat.slug}
                                    href={`/the-loai/${cat.slug}`}
                                    className="block px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-white/80 hover:text-white transition-colors"
                                >
                                    {cat.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Countries Dropdown */}
                    <div className="relative group">
                        <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white/70 group-hover:text-white hover:bg-white/5 rounded-full transition-all whitespace-nowrap">
                            Quốc gia <ChevronDown className="w-3 h-3 transition-transform group-hover:rotate-180" />
                        </button>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-48 bg-[#0B0D12]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 shadow-[0_20px_40px_rgba(0,0,0,0.5)] flex flex-col gap-1 z-50 mt-2">
                            {displayCountries.map((country) => (
                                <Link
                                    key={country.slug}
                                    href={`/quoc-gia/${country.slug}`}
                                    className="block px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-white/80 hover:text-white transition-colors"
                                >
                                    {country.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <Link href="/danh-sach/phim-le" className="px-3 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-full transition-all whitespace-nowrap">
                        Phim lẻ
                    </Link>
                    <Link href="/danh-sach/phim-bo" className="px-3 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-full transition-all whitespace-nowrap">
                        Phim bộ
                    </Link>
                    <Link href="/danh-sach/hoat-hinh" className="px-3 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-full transition-all whitespace-nowrap">
                        Hoạt hình
                    </Link>
                </nav>

                {/* Right: Search & Actions */}
                <div className="flex items-center gap-3 shrink-0">

                    {/* Search Bar - Expandable */}
                    <div className="flex items-center">
                        <form
                            onSubmit={handleSearch}
                            className={cn(
                                "relative flex items-center transition-all duration-500 ease-out",
                                isSearchOpen ? "w-[180px] md:w-60" : "w-10"
                            )}
                        >
                            {/* Search Toggle / Icon */}
                            <div
                                onClick={() => {
                                    if (!isSearchOpen) {
                                        setIsSearchOpen(true);
                                    }
                                }}
                                className={cn(
                                    "cursor-pointer absolute right-0 z-20 w-10 h-10 flex items-center justify-center rounded-full border transition-all duration-300",
                                    isSearchOpen
                                        ? "bg-transparent border-transparent pointer-events-none"
                                        : "bg-white/[0.08] hover:bg-white/[0.15] border-white/[0.08] hover:scale-105 active:scale-95"
                                )}
                            >
                                <Search className={cn("w-4.5 h-4.5 transition-colors", isSearchOpen ? "hidden" : "text-white/80")} />
                            </div>

                            {/* Input Field */}
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onBlur={() => {
                                    if (!searchQuery) setIsSearchOpen(false);
                                }}
                                placeholder="Tìm kiếm..."
                                className={cn(
                                    "absolute right-0 top-0 h-10 bg-white/[0.08] border border-white/[0.08] rounded-full pl-4 pr-10 text-sm text-white outline-none focus:border-primary/50 focus:bg-black/40 transition-all duration-500",
                                    isSearchOpen ? "w-full opacity-100 visible" : "w-10 opacity-0 invisible"
                                )}
                            />

                            {/* Close/Search Icon inside Input */}
                            {isSearchOpen && (
                                <button
                                    type={searchQuery ? "submit" : "button"}
                                    onClick={(e) => {
                                        if (!searchQuery) {
                                            setIsSearchOpen(false);
                                            e.preventDefault();
                                        }
                                    }}
                                    className="absolute right-0 top-0 w-10 h-10 flex items-center justify-center z-30 text-white/50 hover:text-white transition-colors"
                                >
                                    {searchQuery ? <Search className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                </button>
                            )}
                        </form>
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden lg:flex items-center gap-3">
                        <Link href="/lich-su-xem" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.08] transition-all hover:scale-105 active:scale-95 group" title="Lịch sử xem">
                            <History className="w-4.5 h-4.5 text-white/70 group-hover:text-white transition-colors" />
                        </Link>
                        <Link href="/phim-yeu-thich" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.08] transition-all hover:scale-105 active:scale-95 group" title="Phim yêu thích">
                            <Heart className="w-4.5 h-4.5 text-white/70 group-hover:text-red-500 transition-colors" />
                        </Link>
                    </div>

                    {/* Auth */}
                    {session ? (
                        <div className="relative group ml-1">
                            <button className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10 hover:border-primary/50 transition-all p-0.5">
                                <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-sm font-bold text-white shadow-inner">
                                    {session.user?.name?.[0]?.toUpperCase() || "U"}
                                </div>
                            </button>
                            {/* Dropdown Menu */}
                            <div className="absolute right-0 top-full mt-3 w-60 bg-[#0B0D12]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right shadow-2xl ring-1 ring-black/50">
                                <div className="px-4 py-3 border-b border-white/10 mb-2">
                                    <p className="text-sm font-bold text-white truncate">{session.user?.name}</p>
                                    <p className="text-xs text-white/50 truncate">{session.user?.email}</p>
                                </div>
                                <Link href="/thong-tin-tai-khoan" className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
                                    <User className="w-4 h-4" /> Tài khoản
                                </Link>
                                <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
                                    <Settings className="w-4 h-4" /> Quản trị
                                </Link>
                                <button
                                    onClick={() => signOut()}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors mt-1"
                                >
                                    <LogOut className="w-4 h-4" /> Đăng xuất
                                </button>
                            </div>
                        </div>
                    ) : (
                        <Link href="/login" className="bg-[#F4C84A] hover:bg-[#ffe58a] text-black px-5 py-2 rounded-full font-bold text-sm transition-transform hover:scale-105 active:scale-95 ml-1 whitespace-nowrap shadow-[0_0_15px_rgba(244,200,74,0.3)]">
                            Đăng nhập
                        </Link>
                    )}
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {
                isMobileMenuOpen && (
                    <>
                        <div
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <div className="fixed top-0 left-0 bottom-0 w-[280px] bg-[#0B0D12] z-50 lg:hidden border-r border-white/10 flex flex-col animate-in slide-in-from-left duration-300">
                            <div className="p-4 flex items-center justify-between border-b border-white/5">
                                <span className="text-lg font-bold text-white">Menu</span>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-white/50 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-4">
                                {/* Mobile Search */}
                                <form onSubmit={handleSearch} className="mb-6 relative">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Tìm kiếm phim..."
                                        className="w-full h-11 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 text-sm text-white outline-none focus:border-primary/50 transition-colors"
                                    />
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                </form>

                                <nav className="flex flex-col gap-1">
                                    {[
                                        { name: "Trang chủ", href: "/", icon: null },
                                        { name: "Phim lẻ", href: "/danh-sach/phim-le", icon: Film },
                                        { name: "Phim bộ", href: "/danh-sach/phim-bo", icon: LayoutGrid },
                                        { name: "Hoạt hình", href: "/danh-sach/hoat-hinh", icon: Play },
                                        { name: "Lịch sử xem", href: "/lich-su-xem", icon: History },
                                        { name: "Phim yêu thích", href: "/phim-yeu-thich", icon: Heart },
                                    ].map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="px-4 py-3 rounded-xl hover:bg-white/10 text-white/80 hover:text-white font-medium transition-colors flex items-center gap-3"
                                        >
                                            {item.icon && <item.icon className="w-4 h-4 text-white/50" />}
                                            {item.name}
                                        </Link>
                                    ))}
                                </nav>
                            </div>
                        </div>
                    </>
                )
            }
        </header >
    );
}

// Helper icons (if not imported from lucide-react, but we imported them so we use them directly)
