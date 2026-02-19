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

    // Fallback if data is missing
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
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
                isScrolled
                    ? "backdrop-blur-[28px] bg-[#0B0D12]/70 border-b border-white/5 shadow-2xl shadow-black/50"
                    : "bg-gradient-to-b from-black/80 via-black/40 to-transparent backdrop-blur-[2px]"
            )}
        >
            <div className="max-w-[1400px] mx-auto px-4 lg:px-8 h-[72px] flex items-center justify-between gap-4">

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="lg:hidden p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors"
                >
                    <Menu className="w-6 h-6" />
                </button>

                {/* Left: Logo */}
                <Link href="/" className="flex items-center gap-3 group shrink-0">
                    <div className="relative w-10 h-10 flex items-center justify-center">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative w-10 h-10 rounded-full border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                            <Play className="w-4 h-4 text-primary fill-primary ml-0.5" />
                        </div>
                    </div>
                    <div className="flex flex-col justify-center">
                        <span className="text-xl lg:text-2xl font-bold text-white tracking-tight leading-none font-sans">
                            MOVIE<span className="text-primary">BOX</span>
                        </span>
                    </div>
                </Link>



                <nav className="hidden lg:flex items-center gap-8">
                    {[
                        { name: "Trang chủ", href: "/" },
                        { name: "Phim lẻ", href: "/danh-sach/phim-le" },
                        { name: "Phim bộ", href: "/danh-sach/phim-bo" },
                        { name: "Hoạt hình", href: "/danh-sach/hoat-hinh" },
                    ].map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="text-sm font-medium text-white/70 hover:text-white hover:text-glow transition-all"
                        >
                            {item.name}
                        </Link>
                    ))}
                </nav>
            </div>

            {/* Right: Search & Actions */}
            <div className="flex items-center gap-6">
                {/* Search Bar - iOS Style Pill */}
                <form onSubmit={handleSearch} className="hidden lg:flex items-center relative group">
                    <div className={`absolute inset-0 bg-primary/5 blur-lg rounded-full transition-opacity duration-300 ${searchQuery ? 'opacity-100' : 'opacity-0'}`} />
                    <div className="relative flex items-center bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] rounded-full px-4 py-2 w-64 focus-within:w-80 focus-within:border-primary/50 focus-within:bg-black/40 transition-all duration-300">
                        <Search className="w-4 h-4 text-white/50 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm phim, diễn viên..."
                            className="bg-transparent border-none outline-none text-sm text-white ml-3 w-full placeholder:text-white/30"
                        />
                    </div>
                </form>

                <div className="flex items-center gap-4">
                    {/* History Button */}
                    <Link href="/lich-su-xem" className="hidden lg:flex w-10 h-10 items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.08] transition-all hover:scale-105 active:scale-95" title="Lịch sử xem">
                        <History className="w-4 h-4 text-white/80" />
                    </Link>

                    {/* Watchlist Button */}
                    <Link href="/phim-yeu-thich" className="hidden lg:flex w-10 h-10 items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.08] transition-all hover:scale-105 active:scale-95" title="Phim yêu thích">
                        <Heart className="w-4 h-4 text-white/80" />
                    </Link>

                    {session ? (
                        <div className="relative group">
                            <button className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10 hover:border-primary/50 transition-all p-0.5">
                                <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-sm font-bold text-white">
                                    {session.user?.name?.[0]?.toUpperCase() || "U"}
                                </div>
                            </button>
                            {/* Dropdown Menu */}
                            <div className="absolute right-0 top-full mt-2 w-56 glass-panel p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                                <div className="px-3 py-2 border-b border-white/10 mb-2">
                                    <p className="text-sm font-medium text-white">{session.user?.name}</p>
                                    <p className="text-xs text-white/50 truncate">{session.user?.email}</p>
                                </div>
                                <Link href="/thong-tin-tai-khoan" className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                                    <User className="w-4 h-4" /> Tài khoản
                                </Link>
                                <Link href="/admin" className="first-letter:flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10 10 10 0 0 0-10-10Z" /><path d="m9 12 2 2 4-4" /></svg>
                                    Quản trị
                                </Link>
                                <button
                                    onClick={() => signOut()}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors mt-1"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                                    Đăng xuất
                                </button>
                            </div>
                        </div>
                    ) : (
                        <Link href="/login" className="btn-ios bg-white text-black px-6 py-2 rounded-full font-bold text-sm hover:bg-white/90">
                            Đăng nhập
                        </Link>
                    )}

                    <button
                        className="md:hidden p-2 text-white"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </div>



            {/* Mobile Menu Overlay */}
            {
                isMobileMenuOpen && (
                    <div className="absolute top-16 left-0 right-0 glass-panel border-t border-white/10 p-4 md:hidden animate-in slide-in-from-top-4 fade-in duration-200">
                        <form onSubmit={handleSearch} className="mb-6">
                            <div className="flex items-center bg-white/10 rounded-xl px-4 py-3">
                                <Search className="w-5 h-5 text-white/50" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Tìm kiếm..."
                                    className="bg-transparent border-none outline-none text-white ml-3 w-full"
                                />
                            </div>
                        </form>
                        <nav className="flex flex-col gap-2">
                            {[
                                { name: "Trang chủ", href: "/" },
                                { name: "Phim lẻ", href: "/danh-sach/phim-le" },
                                { name: "Phim bộ", href: "/danh-sach/phim-bo" },
                                { name: "Hoạt hình", href: "/danh-sach/hoat-hinh" },
                                { name: "Lịch sử xem", href: "/lich-su-xem" },
                                { name: "Phim yêu thích", href: "/phim-yeu-thich" },
                            ].map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="px-4 py-3 rounded-xl hover:bg-white/10 text-white font-medium transition-colors"
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </nav>
                    </div>
                )
            }
        </header >
    );
}

// Helper icons (if not imported from lucide-react, but we imported them so we use them directly)
