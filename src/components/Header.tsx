"use client";

import Link from "next/link";
import { Search, Bell, User, LogOut, Shield, Trash2, Clock, History, Heart, Settings, Menu, X, ChevronDown, Play, Film, Video, LayoutGrid, Download } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

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

    const handleSearch = (query?: string) => {
        const searchTerm = query || searchQuery;
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
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                isScrolled ? "bg-black/80 backdrop-blur-md border-b border-white/10" : "bg-gradient-to-b from-black/80 to-transparent"
            )}
        >
            <div className="container mx-auto px-4 h-20 flex items-center justify-between">
                {/* Left: Logo & Nav */}
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-primary to-yellow-600 flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
                            <Play className="w-5 h-5 text-black fill-black ml-1" />
                        </div>
                        <span className="text-xl font-black text-white tracking-tighter hidden sm:inline-block">MOVIE<span className="text-primary">BOX</span> - Xem phim là mê</span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden lg:flex items-center gap-6">
                        <Link href="/" className={`text-sm font-bold hover:text-primary transition-colors ${pathname === '/' ? 'text-primary' : 'text-gray-300'}`}>Trang Chủ</Link>
                        <Link href="/danh-sach/phim-le" className={`text-sm font-bold hover:text-primary transition-colors ${pathname?.includes('/phim-le') ? 'text-primary' : 'text-gray-300'}`}>Phim Lẻ</Link>
                        <Link href="/danh-sach/phim-bo" className={`text-sm font-bold hover:text-primary transition-colors ${pathname?.includes('/phim-bo') ? 'text-primary' : 'text-gray-300'}`}>Phim Bộ</Link>
                        <Link href="/danh-sach/tv-shows" className={`text-sm font-bold hover:text-primary transition-colors ${pathname?.includes('/tv-shows') ? 'text-primary' : 'text-gray-300'}`}>TV Shows</Link>

                        {/* Categories Dropdown */}
                        <div className="relative group/cat py-4">
                            <button className="flex items-center gap-1 text-sm font-bold text-gray-300 group-hover/cat:text-primary transition-colors">
                                Thể Loại <ChevronDown className="w-4 h-4 transition-transform group-hover/cat:rotate-180" />
                            </button>
                            <div className="absolute top-full left-0 w-[400px] bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover/cat:opacity-100 group-hover/cat:visible transition-all duration-300 transform translate-y-2 group-hover/cat:translate-y-0 p-4 grid grid-cols-3 gap-2 z-50">
                                {displayCategories.map(c => (
                                    <Link key={c.slug} href={`/the-loai/${c.slug}`} className="text-xs text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded transition-colors">{c.name}</Link>
                                ))}
                            </div>
                        </div>

                        {/* Countries Dropdown */}
                        <div className="relative group/country py-4">
                            <button className="flex items-center gap-1 text-sm font-bold text-gray-300 group-hover/country:text-primary transition-colors">
                                Quốc Gia <ChevronDown className="w-4 h-4 transition-transform group-hover/country:rotate-180" />
                            </button>
                            <div className="absolute top-full left-0 w-[300px] bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover/country:opacity-100 group-hover/country:visible transition-all duration-300 transform translate-y-2 group-hover/country:translate-y-0 p-4 grid grid-cols-2 gap-2 z-50">
                                {displayCountries.map(c => (
                                    <Link key={c.slug} href={`/quoc-gia/${c.slug}`} className="text-xs text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded transition-colors">{c.name}</Link>
                                ))}
                            </div>
                        </div>
                    </nav>
                </div>

                {/* Right: Search & User */}
                <div className="flex items-center gap-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <div className={`flex items-center bg-white/5 border border-white/10 rounded-full transition-all duration-300 ${isSearchOpen ? 'w-full md:w-64 bg-black/50 border-primary/50' : 'w-10 h-10 hover:bg-white/10 cursor-pointer justify-center'}`}>
                            {isSearchOpen ? (
                                <div className="flex items-center w-full px-3 py-1.5">
                                    <Search className="w-4 h-4 text-primary shrink-0" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="Tìm kiếm..."
                                        className="bg-transparent border-none outline-none text-white text-sm ml-2 w-full placeholder:text-gray-500"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        onBlur={() => !searchQuery && setIsSearchOpen(false)}
                                    />
                                    <button onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }} className="ml-1 text-gray-400 hover:text-white">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ) : (
                                <button onClick={() => setIsSearchOpen(true)} className="w-full h-full flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                                    <Search className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Download App Button */}
                    <a href="/app-release.apk" target="_blank" download className="hidden lg:flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:scale-105 hover:shadow-lg hover:shadow-purple-500/40 transition-all duration-300">
                        <Download className="w-4 h-4" /> <span>Tải App</span>
                    </a>

                    {/* User Actions */}
                    {session ? (
                        <div className="relative group/user hidden lg:block">
                            <Link href="/thong-tin-tai-khoan" className="block">
                                <div className="w-9 h-9 rounded-full overflow-hidden border border-white/20 hover:border-primary transition-colors p-[1px]">
                                    <img src={session.user?.image || `https://ui-avatars.com/api/?name=${session.user?.name}`} alt="User" className="w-full h-full object-cover rounded-full" />
                                </div>
                            </Link>
                            {/* Dropdown would go here */}
                        </div>
                    ) : (
                        <Link href="/login" className="hidden lg:flex items-center gap-2 bg-primary text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-yellow-400 transition-all shadow-lg shadow-primary/20 transform hover:scale-105">
                            <User className="w-4 h-4" /> <span>Đăng nhập</span>
                        </Link>
                    )}

                    {/* Mobile Menu Toggle */}
                    <button
                        className="lg:hidden p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                        onClick={() => setIsMobileMenuOpen(true)}
                        aria-label="Open menu"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay - Full Screen Slide In */}
            <div
                className={cn(
                    "fixed inset-0 z-[10000] lg:hidden bg-black/95 backdrop-blur-xl transition-transform duration-300 ease-in-out flex flex-col",
                    isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Mobile Header with Close Button */}
                <div className="flex items-center justify-between px-4 h-20 border-b border-white/10 shrink-0">
                    <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2">
                        <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-primary to-yellow-600 flex items-center justify-center shadow-lg shadow-primary/30">
                            <Play className="w-4 h-4 text-black fill-black ml-0.5" />
                        </div>
                        <span className="text-xl font-black text-white tracking-tighter">MOVIE<span className="text-primary">BOX</span></span>
                    </Link>
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
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
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-gray-300"
                                >
                                    <History className="w-4 h-4 text-blue-400" /> Lịch sử
                                </Link>
                                <Link
                                    href="/phim-yeu-thich"
                                    onClick={() => setIsMobileMenuOpen(false)}
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
                                onClick={() => setIsMobileMenuOpen(false)}
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
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-4 text-lg font-bold text-white p-3 rounded-xl hover:bg-white/5 transition-colors"
                        >
                            <span className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-500">
                                <Play className="w-4 h-4 fill-current" />
                            </span>
                            Trang Chủ
                        </Link>
                        <Link
                            href="/danh-sach/phim-le"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-4 text-lg font-bold text-white p-3 rounded-xl hover:bg-white/5 transition-colors"
                        >
                            <span className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-500">
                                <Film className="w-4 h-4" />
                            </span>
                            Phim Lẻ
                        </Link>
                        <Link
                            href="/danh-sach/phim-bo"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-4 text-lg font-bold text-white p-3 rounded-xl hover:bg-white/5 transition-colors"
                        >
                            <span className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-500">
                                <Film className="w-4 h-4" />
                            </span>
                            Phim Bộ
                        </Link>
                        <Link
                            href="/danh-sach/tv-shows"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-4 text-lg font-bold text-white p-3 rounded-xl hover:bg-white/5 transition-colors"
                        >
                            <span className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-500">
                                <Video className="w-4 h-4" />
                            </span>
                            TV Shows
                        </Link>

                        {/* Expandable Categories */}
                        <div className="space-y-1">
                            <div className="w-full flex items-center justify-between text-lg font-bold text-white p-3 rounded-xl bg-white/5">
                                <div className="flex items-center gap-4">
                                    <span className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                                        <LayoutGrid className="w-4 h-4" />
                                    </span>
                                    <span>Thể Loại</span>
                                </div>
                            </div>
                            <div className="pl-4 grid grid-cols-2 gap-2 pt-2">
                                {displayCategories.slice(0, 10).map((cat) => (
                                    <Link
                                        key={cat.slug}
                                        href={`/the-loai/${cat.slug}`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="text-gray-400 text-sm hover:text-white bg-white/5 p-2 rounded text-center transition-colors"
                                    >
                                        {cat.name}
                                    </Link>
                                ))}
                                <Link
                                    href="/danh-sach/tat-ca-the-loai"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-primary text-sm font-medium hover:text-white bg-white/5 p-2 rounded text-center transition-colors col-span-2"
                                >
                                    Xem tất cả...
                                </Link>
                            </div>
                        </div>

                        {/* Expandable Countries */}
                        <div className="space-y-1">
                            <div className="w-full flex items-center justify-between text-lg font-bold text-white p-3 rounded-xl bg-white/5">
                                <div className="flex items-center gap-4">
                                    <span className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-500">
                                        <Settings className="w-4 h-4" />
                                    </span>
                                    <span>Quốc Gia</span>
                                </div>
                            </div>
                            <div className="pl-4 grid grid-cols-2 gap-2 pt-2">
                                {displayCountries.map((country) => (
                                    <Link
                                        key={country.slug}
                                        href={`/quoc-gia/${country.slug}`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="text-gray-400 text-sm hover:text-white bg-white/5 p-2 rounded text-center transition-colors"
                                    >
                                        {country.name}
                                    </Link>
                                ))}
                            </div>
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
        </header>
    );
}

// Helper icons (if not imported from lucide-react, but we imported them so we use them directly)
// Added imports: Menu, X, ChevronDown, Play, Film, Video, LayoutGrid to top import.
