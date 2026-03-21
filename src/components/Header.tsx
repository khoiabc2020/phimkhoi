"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, Bell, User, LogOut, Shield, Trash2, Clock, Settings, X, ChevronDown, Loader2, Bookmark, LogIn, Filter } from "lucide-react";
import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn, getImageUrl } from "@/lib/utils";
import MobileMenu from "./MobileMenu";
import { getRealtimeSearch } from "@/app/actions/search";
import { getTrendMovies } from "@/services/api";
import SearchSkeleton from "./SearchSkeleton";

interface HeaderProps {
    categories?: { name: string; slug: string }[];
    countries?: { name: string; slug: string }[];
}

export default function Header({ categories = [], countries = [] }: HeaderProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [movieSearchHistory, setMovieSearchHistory] = useState<string[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isSearchNavigating, startSearchTransition] = useTransition();
    const [searchResults, setSearchResults] = useState<{ movies: any[], actors: any[] } | null>(null);
    const [openDropdown, setOpenDropdown] = useState<"categories" | "countries" | null>(null);
    const router = useRouter();
    const pathname = usePathname();
    const { data: session } = useSession();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const navRef = useRef<HTMLDivElement | null>(null);

    const saveHistoryItem = (kind: "movies", value: string) => {
        const trimmed = value.trim();
        if (!trimmed) return;
        const key = "searchHistory_movies";
        const setState = setMovieSearchHistory;
        const current = movieSearchHistory;
        const next = [trimmed, ...current.filter(h => h !== trimmed)].slice(0, 10);
        setState(next);
        localStorage.setItem(key, JSON.stringify(next));
    };

    const handleSearch = (e?: React.FormEvent | string) => {
        if (e && typeof e === 'object' && 'preventDefault' in e) {
            e.preventDefault();
        }
        const searchTerm = typeof e === 'string' ? e : searchQuery;

        if (searchTerm.trim()) {
            // Save ONLY movie-search history for /tim-kiem
            saveHistoryItem("movies", searchTerm);
            const nextPath = `/tim-kiem?q=${encodeURIComponent(searchTerm)}`;
            router.prefetch(nextPath);
            startSearchTransition(() => {
                router.push(nextPath);
            });
            setIsSearchOpen(false);
            setShowHistory(false);
            setSearchQuery("");
        }
    };

    const clearHistory = () => {
        setMovieSearchHistory([]);
        localStorage.removeItem("searchHistory_movies");
        setShowHistory(false);
    };

    const isScrolledRef = useRef(false);

    useEffect(() => {
        let ticking = false;
        const handleScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                const scrolled = window.scrollY > 0;
                if (scrolled !== isScrolledRef.current) {
                    isScrolledRef.current = scrolled;
                    setIsScrolled(scrolled);
                }
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

    // Debounced realtime search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.trim().length >= 2) {
                setIsSearching(true);
                try {
                    const results = await getRealtimeSearch(searchQuery);
                    setSearchResults(results);
                } catch (e) {
                    console.error(e);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults(null);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Load search history from localStorage
    useEffect(() => {
        const savedMovies = localStorage.getItem("searchHistory_movies");
        if (savedMovies) {
            try { setMovieSearchHistory(JSON.parse(savedMovies)); } catch { }
        }
    }, []);

    useEffect(() => {
        if (isSearchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchOpen]);

    // Đóng dropdown khi click ra ngoài (hữu ích cho iPad / touch)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (!navRef.current) return;
            const target = event.target as Node | null;
            if (target && !navRef.current.contains(target)) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, []);

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
                suppressHydrationWarning
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
                    isScrolled
                        ? "h-[54px] lg:h-[64px] bg-[#0a0a0a]/95 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                        : "h-[64px] lg:h-[84px] bg-gradient-to-b from-black/80 to-transparent"
                )}
            >
                <div className="w-full h-[54px] lg:h-[64px] flex items-center justify-between gap-3 flex-nowrap pointer-events-auto px-4 lg:px-8">
                    {/* Mobile Section: Hamburger & Mobile Logo */}
                    <div className="flex lg:hidden items-center gap-2 shrink-0">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-white/90 active:scale-95 transition-transform"
                            aria-label="Mở menu"
                        >
                            <span className="relative flex h-4 w-5 flex-col items-start justify-center gap-1">
                                <span className="h-[2px] w-5 rounded-full bg-current" />
                                <span className="h-[2px] w-3.5 rounded-full bg-current" />
                                <span className="h-[2px] w-4.5 rounded-full bg-current" />
                            </span>
                        </button>

                        <Link href="/" className="flex items-center group">
                            <span className="font-display text-[19px] font-black uppercase tracking-tighter text-white">
                                KHOIPHIM<span className="text-primary ml-0.5">.</span>
                            </span>
                        </Link>
                    </div>

                    {/* Overlay to close dropdowns when clicking outside nav */}
                    {openDropdown && (
                        <div
                            className="fixed inset-0 z-30"
                            onClick={() => setOpenDropdown(null)}
                            aria-hidden="true"
                        />
                    )}

                    {/* Desktop Section: Brand + Links */}
                    <div className="hidden lg:flex items-center gap-4 xl:gap-10 flex-1">
                        <Link href="/" className="flex items-center shrink-0 -ml-1 group">
                            <span className="font-display text-[20px] xl:text-[24px] font-black uppercase tracking-tighter text-white group-hover:text-primary transition-colors">
                                KHOIPHIM<span className="text-primary ml-0.5">.</span>
                            </span>
                        </Link>

                        <nav ref={navRef} className="flex items-center gap-1">
                            {/* Categories Dropdown */}
                            <div className="relative group/nav">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDropdown(openDropdown === "categories" ? null : "categories");
                                    }}
                                    className={cn(
                                        "flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] font-medium capitalize tracking-tight transition-all",
                                        openDropdown === "categories" ? "text-white bg-white/10" : "text-white/70 hover:text-white"
                                    )}
                                >
                                    Thể loại <ChevronDown className={cn("w-3.5 h-3.5 opacity-60 transition-transform duration-300", openDropdown === "categories" ? "rotate-180 opacity-100" : "")} />
                                </button>
                                {openDropdown === "categories" && (
                                    <div
                                        className="absolute top-full left-0 mt-3 w-[520px] bg-[#0d0f14]/98 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl grid grid-cols-3 gap-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                                    >
                                        {displayCategories.map((cat) => (
                                            <Link
                                                key={cat.slug}
                                                href={`/the-loai/${cat.slug}`}
                                                onClick={() => setOpenDropdown(null)}
                                                className="px-3 py-2 rounded-xl text-[13px] font-semibold text-white/50 hover:text-white hover:bg-white/5 transition-all"
                                            >
                                                {cat.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="relative group/nav">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDropdown(openDropdown === "countries" ? null : "countries");
                                    }}
                                    className={cn(
                                        "flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] font-medium capitalize tracking-tight transition-all",
                                        openDropdown === "countries" ? "text-white bg-white/10" : "text-white/70 hover:text-white"
                                    )}
                                >
                                    Quốc gia <ChevronDown className={cn("w-3.5 h-3.5 opacity-60 transition-transform duration-300", openDropdown === "countries" ? "rotate-180 opacity-100" : "")} />
                                </button>
                                {openDropdown === "countries" && (
                                    <div
                                        className="absolute top-full left-0 mt-3 w-[560px] bg-[#0d0f14]/98 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                                    >
                                        <div className="grid grid-cols-3 gap-1 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                                            {displayCountries.map((c) => (
                                                <Link
                                                    key={c.slug}
                                                    href={`/quoc-gia/${c.slug}`}
                                                    onClick={() => setOpenDropdown(null)}
                                                    className="px-3 py-2 rounded-xl text-[13px] font-semibold text-white/50 hover:text-white hover:bg-white/5 transition-all"
                                                >
                                                    {c.name}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Lọc Phim - New Premium Link */}
                            <Link
                                href="/loc-phim"
                                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] xl:text-[13px] font-bold text-primary hover:bg-primary/10 transition-all border border-primary/20 shrink-0"
                            >
                                <Filter className="w-3.5 h-3.5" />
                                Lọc phim
                            </Link>

                            <Link href="/danh-sach/phim-moi-cap-nhat" className="hidden xl:block px-3 py-1.5 rounded-full text-[13px] font-medium text-white/70 hover:text-white transition-all whitespace-nowrap">Phim mới</Link>
                            <Link href="/danh-sach/phim-bo" className="hidden 2xl:block px-3 py-1.5 rounded-full text-[13px] font-medium capitalize tracking-tight text-white/70 hover:text-white transition-colors whitespace-nowrap">Phim Bộ</Link>
                        </nav>
                    </div>

                    {/* Right: Search & Actions */}
                    <div className="flex items-center gap-2 lg:gap-3 xl:gap-6 shrink-0">
                        {/* Search Unified */}
                        <div className="flex items-center justify-end">
                            <form
                                onSubmit={handleSearch}
                                className={cn(
                                    "flex relative items-center transition-all duration-500 ease-out h-10",
                                    isSearchOpen ? "w-[calc(100vw-3rem)] md:w-[420px] lg:w-[480px] absolute right-0 lg:relative z-[60] rounded-full" : "w-10"
                                )}
                            >
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (!isSearchOpen) setIsSearchOpen(true);
                                    }}
                                    className={cn(
                                        "absolute right-0 z-20 w-10 min-w-[40px] h-10 flex items-center justify-center rounded-full transition-all duration-300",
                                        isSearchOpen
                                            ? "bg-transparent pointer-events-none"
                                            : "bg-white/5 hover:bg-white/10 active:scale-90 border border-white/5"
                                    )}
                                >
                                    <Search className={cn("w-[20px] h-[20px] transition-colors", isSearchOpen ? "hidden" : "text-white/90")} />
                                </button>
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
                                        className="w-full h-10 bg-[#0B0B10] border border-white/[0.10] rounded-full pl-4 pr-10 text-sm text-white outline-none focus:border-primary/40 transition-all duration-300 shadow-[0_12px_36px_rgba(0,0,0,0.45)] backdrop-blur-md"
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
                                            {isSearchNavigating ? <Loader2 className="w-4 h-4 animate-spin" /> : searchQuery ? <Search className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                        </button>
                                    )}
                                    {/* Realtime Search & History Dropdown - Premium Upgrade */}
                                    {isSearchOpen && (showHistory || searchQuery.length >= 0) && (
                                        <div
                                            className="absolute top-full left-0 right-0 mt-3 bg-[#0c0c14] border border-white/[0.08] rounded-xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-300 max-w-[100vw]"
                                        >
                                            <div className="flex flex-col max-h-[85vh] md:max-h-[500px] overflow-y-auto no-scrollbar">
                                                
                                                {/* Single Column Content */}
                                                <div className="flex-1 p-4 md:p-5">
                                                    {searchQuery.length > 0 ? (
                                                        <>
                                                            <div className="flex items-center justify-between mb-4">
                                                                <span className="text-[11px] font-bold text-white/30 uppercase tracking-[0.1em]">Kết quả tìm kiếm</span>
                                                                {isSearching && <div className="w-4 h-4 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />}
                                                            </div>
                                                            
                                                            <div className="space-y-1">
                                                                {isSearching && !searchResults ? (
                                                                    <SearchSkeleton />
                                                                ) : (
                                                                    <>
                                                                        {searchResults?.movies?.map((movie: any) => (
                                                                            <Link
                                                                                href={`/phim/${movie.slug}`}
                                                                                key={movie._id || movie.slug}
                                                                                onClick={() => {
                                                                                    saveHistoryItem("movies", movie.name);
                                                                                    setIsSearchOpen(false);
                                                                                    setSearchQuery("");
                                                                                }}
                                                                                className="flex items-center gap-4 p-2 hover:bg-white/[0.06] rounded-xl transition-all group"
                                                                            >
                                                                                <div className="w-10 h-14 rounded-lg overflow-hidden bg-white/5 shrink-0 border border-white/10 group-hover:border-primary/40 transition-colors relative">
                                                                                    <Image 
                                                                                        src={getImageUrl(movie.poster_url || movie.thumb_url)} 
                                                                                        alt={movie.name} 
                                                                                        fill 
                                                                                        className="object-cover" 
                                                                                        unoptimized 
                                                                                    />
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="text-sm font-semibold text-white group-hover:text-primary transition-colors truncate">{movie.name}</div>
                                                                                    <div className="text-[11px] text-white/40 truncate flex items-center gap-2 mt-0.5">
                                                                                        <span>{movie.year || 'N/A'}</span>
                                                                                        <span className="text-primary/70">{movie.quality || 'FHD'}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </Link>
                                                                        ))}
                                                                        
                                                                        {searchResults && searchResults.movies.length === 0 && !isSearching && (
                                                                            <div className="py-8 text-center">
                                                                                <p className="text-white/30 text-sm">Không tìm thấy phim phù hợp</p>
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="space-y-6">
                                                            {movieSearchHistory.length > 0 && (
                                                                <div>
                                                                    <div className="flex items-center justify-between mb-3 px-1">
                                                                        <span className="text-[11px] font-bold text-white/30 uppercase tracking-[0.1em]">Tìm kiếm gần đây</span>
                                                                        <button onClick={clearHistory} className="text-[10px] font-bold text-white/20 hover:text-red-500 uppercase tracking-wider transition-colors">Xóa</button>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {movieSearchHistory.map((q, i) => (
                                                                            <button
                                                                                key={i}
                                                                                onClick={() => setSearchQuery(q)}
                                                                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full text-[12px] text-white/70 hover:text-white transition-all border border-white/5"
                                                                            >
                                                                                {q}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <div>
                                                                <div className="mb-3 px-1">
                                                                    <span className="text-[11px] font-bold text-white/30 uppercase tracking-[0.1em]">Từ khóa hot</span>
                                                                </div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {["Marvel", "Hành động", "Phim bộ mới", "Anime hay", "Phim Hàn Quốc", "Kinh dị"].map((tag) => (
                                                                        <button
                                                                            key={tag}
                                                                            onClick={() => setSearchQuery(tag)}
                                                                            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[12px] font-medium text-white/80 transition-all border border-white/5"
                                                                        >
                                                                            {tag}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            {searchQuery.length > 0 && (
                                                <button
                                                    onClick={handleSearch}
                                                    className="w-full bg-primary py-3 text-black font-extrabold text-[13px] uppercase tracking-wider hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    Xem tất cả kết quả cho "{searchQuery}"
                                                    <Search className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                                </div>
                            </form>

                            {/* Invisible overlay to close history + search when clicking out */}
                            {isSearchOpen && (
                                <div
                                    className="fixed inset-0 z-30"
                                    onClick={() => { setShowHistory(false); setIsSearchOpen(false); setSearchQuery(""); }}
                                    aria-hidden="true"
                                />
                            )}
                        </div>

                        {/* Minimalist Notification & Profile Group (Image 2 style) */}
                        <div className={cn("flex items-center gap-3 lg:gap-6 transition-opacity duration-300", isSearchOpen ? "opacity-0 pointer-events-none" : "opacity-100")}>
                            {/* Notification Bell Icon */}
                            <Link href="/thong-bao" className="relative p-1.5 sm:p-2 rounded-full hover:bg-white/5 transition-all active:scale-90 group shrink-0" title="Thông báo">
                                <Bell className="w-[19px] h-[19px] sm:w-[22px] sm:h-[22px] text-white/70 group-hover:text-white transition-colors" />
                                <span className="absolute top-1 sm:top-1.5 right-1 sm:right-1.5 flex w-2 sm:w-2.5 h-2 sm:h-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 sm:h-2.5 w-2 sm:w-2.5 bg-red-500 border-2 border-[#0a0a0a]"></span>
                                </span>
                            </Link>

                            {/* User Profile Horizontal Layout */}
                            {!mounted ? (
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 animate-pulse" />
                            ) : session ? (
                                <div className="relative group">
                                    <button className="flex items-center gap-2 sm:gap-3 py-1 sm:py-1.5 px-2 rounded-full hover:bg-white/5 transition-all">
                                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-white/10 p-0.5 bg-black/40">
                                            {session.user?.image ? (
                                                <Image src={session.user.image} alt="" width={36} height={36} className="w-full h-full object-cover rounded-full" />
                                            ) : (
                                                <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-[10px] sm:text-xs font-bold text-white uppercase">
                                                    {session.user?.name?.[0]}
                                                </div>
                                            )}
                                        </div>
                                        <span className="hidden xl:block text-sm font-semibold text-white/90 truncate max-w-[120px]">{session.user?.name}</span>
                                        <ChevronDown className="hidden xl:block w-4 h-4 text-white/40 group-hover:text-white transition-all group-hover:rotate-180" />
                                    </button>

                                    {/* Dropdown Menu */}
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-[#0a0a0c]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right shadow-2xl z-50">
                                        <div className="px-4 py-3 border-b border-white/[0.06] mb-1">
                                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Tài khoản</p>
                                            <p className="text-sm font-semibold text-white truncate">{session.user?.name}</p>
                                        </div>
                                        <Link href="/thong-tin-tai-khoan" className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                                            <User className="w-4 h-4 opacity-70" /> <span>Hồ sơ cá nhân</span>
                                        </Link>
                                        {(session.user as any)?.role === "admin" && (
                                            <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                                                <Shield className="w-4 h-4 opacity-70" /> <span>Quản trị viên</span>
                                            </Link>
                                        )}
                                        <div className="h-px bg-white/[0.06] my-1" />
                                        <button
                                            onClick={() => signOut({ callbackUrl: "/login" })}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all"
                                        >
                                            <LogOut className="w-4 h-4 opacity-70" /> <span>Đăng xuất</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <Link
                                    href="/login"
                                    className="px-2.5 sm:px-5 py-1.5 sm:py-2 rounded-full bg-white text-black text-[11px] sm:text-sm font-black hover:bg-gray-200 transition-all active:scale-95 whitespace-nowrap flex items-center justify-center shrink-0"
                                >
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
