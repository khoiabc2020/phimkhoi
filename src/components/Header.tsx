"use client";

import Link from "next/link";
import Image from "next/image";
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
        let ticking = false;
        const handleScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                setIsScrolled(window.scrollY > 0);
                ticking = false;
            });
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
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


    return (
        <>
            <header
                className={cn(
                    "fixed top-0 left-0 right-0 z-40 transition-all duration-500",
                    isScrolled
                        ? "bg-[#0B0D12]/98 border-b border-white/5 shadow-2xl shadow-black/50"
                        : "bg-gradient-to-b from-black/80 via-black/40 to-transparent"
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
                                <Image
                                    src="/logo.webp"
                                    alt="MovieBox Logo"
                                    width={40}
                                    height={40}
                                    className="relative w-full h-full rounded-2xl object-cover shadow-lg group-hover:scale-105 transition-transform duration-300"
                                />
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-lg md:text-xl lg:text-2xl font-bold text-white tracking-tight leading-none font-sans whitespace-nowrap">
                                    Movie<span className="text-primary">Box</span>
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
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-[400px] bg-[#0B0D12] border border-white/10 rounded-2xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 shadow-[0_20px_40px_rgba(0,0,0,0.8)] grid grid-cols-2 gap-2 z-50 mt-2">
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
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-72 bg-[#0B0D12] border border-white/10 rounded-2xl p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 shadow-[0_20px_40px_rgba(0,0,0,0.8)] grid grid-cols-2 gap-1 z-50 mt-2">
                                {displayCountries.map((country) => (
                                    <Link
                                        key={country.slug}
                                        href={`/quoc-gia/${country.slug}`}
                                        className="block px-3 py-1.5 rounded-lg hover:bg-white/10 text-sm text-white/80 hover:text-white transition-colors truncate"
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

                        <div className="flex items-center justify-end flex-1">
                            {/* Unified expandable search bar for both Mobile and Desktop */}
                            <form
                                onSubmit={handleSearch}
                                className={cn(
                                    "flex relative items-center transition-all duration-500 ease-out h-10",
                                    isSearchOpen ? "w-[calc(100vw-6rem)] md:w-80 lg:w-60 absolute right-4 lg:relative lg:right-0 bg-[#0B0D12] lg:bg-transparent z-40 rounded-full" : "w-10 relative"
                                )}
                            >
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (!isSearchOpen) setIsSearchOpen(true);
                                    }}
                                    className={cn(
                                        "absolute right-0 z-20 w-10 h-10 flex items-center justify-center rounded-full border transition-all duration-300",
                                        isSearchOpen
                                            ? "bg-transparent border-transparent pointer-events-none"
                                            : "bg-white/[0.08] hover:bg-white/[0.15] border-white/[0.08] hover:scale-105 active:scale-95"
                                    )}
                                >
                                    <Search className={cn("w-4 h-4 transition-colors", isSearchOpen ? "hidden" : "text-white/80")} />
                                </button>
                                {/* Input wrapper to position popup correctly */}
                                <div className={cn(
                                    "absolute right-0 top-0 transition-all duration-500",
                                    isSearchOpen ? "w-full opacity-100 visible h-auto z-40" : "w-10 opacity-0 invisible h-10"
                                )}>
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onFocus={() => setShowHistory(true)}
                                        placeholder="Tìm kiếm..."
                                        className="w-full h-10 bg-white/[0.08] border border-white/[0.08] rounded-full pl-4 pr-10 text-sm text-white outline-none focus:border-primary/50 focus:bg-black/80 transition-all duration-300 shadow-xl"
                                    />

                                    {isSearchOpen && (
                                        <button
                                            type={searchQuery ? "submit" : "button"}
                                            onClick={(e) => {
                                                if (!searchQuery) {
                                                    setIsSearchOpen(false);
                                                    setShowHistory(false);
                                                    e.preventDefault();
                                                }
                                            }}
                                            className="absolute right-0 top-0 w-10 h-10 flex items-center justify-center z-30 text-white/50 hover:text-white transition-colors"
                                        >
                                            {searchQuery ? <Search className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                        </button>
                                    )}

                                    {/* History Dropdown */}
                                    {showHistory && searchHistory.length > 0 && isSearchOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0B0D12] border border-white/10 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex items-center justify-between px-3 pb-2 pt-1 border-b border-white/10 mb-2">
                                                <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Lịch sử tìm kiếm</span>
                                                <button type="button" onClick={clearHistory} className="text-xs text-red-400 hover:text-red-300 transition-colors">Xóa</button>
                                            </div>
                                            <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                                                {searchHistory.map((item, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => {
                                                            setSearchQuery(item);
                                                            handleSearch(item);
                                                        }}
                                                        className="flex items-center gap-3 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors text-left"
                                                    >
                                                        <Clock className="w-3.5 h-3.5 text-white/40 shrunk-0" />
                                                        <span className="truncate">{item}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </form>

                            {/* Invisible overlay to close history when clicking out */}
                            {showHistory && isSearchOpen && (
                                <div
                                    className="fixed inset-0 z-30"
                                    onClick={() => setShowHistory(false)}
                                    aria-hidden="true"
                                />
                            )}
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

                        {/* Auth — hidden on mobile (accessible via hamburger menu) */}
                        <div className="hidden lg:block">
                            {!mounted ? (
                                <div className="w-24 h-10 bg-white/5 rounded-full animate-pulse" />
                            ) : session ? (
                                <div className="relative group ml-1">
                                    <button className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10 hover:border-primary/50 transition-all p-0.5">
                                        <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-sm font-bold text-white shadow-inner">
                                            {session.user?.name?.[0]?.toUpperCase() || "U"}
                                        </div>
                                    </button>
                                    {/* Dropdown Menu */}
                                    <div className="absolute right-0 top-full mt-3 w-60 bg-[#0B0D12] border border-white/10 rounded-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right shadow-2xl ring-1 ring-black/50">
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
                </div>

            </header>
            {/* Mobile Menu — outside <header> to escape backdrop-filter stacking context on iOS */}
            <MobileMenu
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                categories={displayCategories}
                countries={displayCountries}
            />
        </>
    );
}

// Helper icons (if not imported from lucide-react, but we imported them so we use them directly)
