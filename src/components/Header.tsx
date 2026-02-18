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

                {/* Center: Search Pill (Desktop) */}
                <div className="hidden lg:flex flex-1 justify-center max-w-xl mx-auto">
                    <div className="relative group/search w-full max-w-[420px]">
                        <div className={cn(
                            "relative flex items-center h-[44px] bg-white/5 border border-white/10 rounded-[22px] px-4 transition-all duration-300 overflow-hidden",
                            "focus-within:bg-[#0B0D12] focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 focus-within:shadow-[0_0_30px_-5px_rgba(244,200,74,0.3)]",
                            "hover:bg-white/10 hover:border-white/20"
                        )}>
                            <Search className="w-4 h-4 text-white/40 group-focus-within/search:text-primary transition-colors duration-300" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm phim, diễn viên..."
                                className="w-full bg-transparent border-none outline-none text-white text-[15px] ml-3 placeholder:text-gray-500 font-medium h-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery("")} className="p-1 rounded-full hover:bg-white/20 text-gray-400 hover:text-white transition-colors">
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3 lg:gap-5 shrink-0">

                    {/* Desktop Nav Links (Minimal) */}
                    <nav className="hidden xl:flex items-center gap-6 mr-4">
                        <Link href="/" className="text-[14px] font-medium text-gray-300 hover:text-white transition-colors">Trang chủ</Link>
                        <Link href="/danh-sach/phim-le" className="text-[14px] font-medium text-gray-300 hover:text-white transition-colors">Phim lẻ</Link>
                        <Link href="/danh-sach/phim-bo" className="text-[14px] font-medium text-gray-300 hover:text-white transition-colors">Phim bộ</Link>
                        <div className="h-4 w-[1px] bg-white/10" />
                    </nav>

                    {/* Mobile Search Toggle */}
                    <button
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                        className="lg:hidden p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                        <Search className="w-5 h-5" />
                    </button>

                    {/* History & Notification (Desktop) */}
                    <div className="hidden lg:flex items-center gap-3">
                        <Link href="/lich-su-xem" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all group" title="Lịch sử xem">
                            <Clock className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </Link>
                        {/* Removed Download Button from Header (too noisy for iOS style) or keep it subtle? User said "Quá nhiều badge to" -> remove/simplify */}
                        {/* Making it an icon only or very subtle pill */}
                        <a href="/app-release.apk" target="_blank" download className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/40 hover:to-purple-500/40 border border-indigo-500/30 flex items-center justify-center text-indigo-400 hover:text-indigo-300 transition-all group" title="Tải App">
                            <Download className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                        </a>
                    </div>

                    {/* User Profile */}
                    {session ? (
                        <div className="relative group/user">
                            <Link href="/thong-tin-tai-khoan" className="block">
                                <div className="w-10 h-10 rounded-full p-[2px] border border-white/10 hover:border-primary/50 transition-colors bg-white/5">
                                    <img
                                        src={session.user?.image || `https://ui-avatars.com/api/?name=${session.user?.name}`}
                                        alt="User"
                                        className="w-full h-full object-cover rounded-full"
                                    />
                                </div>
                            </Link>
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="hidden lg:flex items-center gap-2 bg-[#F4C84A] text-black px-6 py-2 rounded-full text-[14px] font-bold hover:bg-[#ffe58a] transition-all shadow-[0_0_20px_-5px_rgba(244,200,74,0.4)] hover:shadow-[0_0_30px_-5px_rgba(244,200,74,0.6)] hover:scale-105 active:scale-95"
                        >
                            <span>Đăng nhập</span>
                        </Link>
                    )}
                </div>
            </div>

            {/* Mobile Search Overlay */}
            <div className={cn(
                "lg:hidden absolute top-auto left-0 right-0 bg-[#0B0D12] border-b border-white/10 p-4 transition-all duration-300 overflow-hidden",
                isSearchOpen ? "h-auto opacity-100 visible" : "h-0 opacity-0 invisible"
            )}>
                <div className="relative flex items-center h-[40px] bg-white/10 rounded-full px-4">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        className="w-full bg-transparent border-none outline-none text-white text-sm ml-3"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>
            </div>

            {/* Mobile Menu */}
            <MobileMenu
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                categories={categories}
                countries={countries}
            />
        </header>
    );
}

// Helper icons (if not imported from lucide-react, but we imported them so we use them directly)
// Added imports: Menu, X, ChevronDown, Play, Film, Video, LayoutGrid to top import.
