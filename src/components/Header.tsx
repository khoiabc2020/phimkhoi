"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Search, Bell, User, LogOut, ChevronDown, Filter, Shield, Loader2, X } from "lucide-react";
import { getImageUrl, cn } from "@/lib/utils";
import { signOut, useSession } from "next-auth/react";
import MobileMenu from "./MobileMenu";
import { getRealtimeSearch } from "@/app/actions/search";
import SearchSkeleton from "./SearchSkeleton";

interface HeaderProps {
    categories: any[];
    countries: any[];
}

export default function Header({ categories, countries }: HeaderProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    
    // Real-time search states
    const [searchResults, setSearchResults] = useState<any>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [movieSearchHistory, setMovieSearchHistory] = useState<string[]>([]);
    const [isSearchNavigating, setIsSearchNavigating] = useState(false);

    const navRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        handleScroll();
        window.addEventListener("scroll", handleScroll);
        
        // Load search history
        const saved = localStorage.getItem("movieSearchHistory");
        if (saved) {
            try {
                setMovieSearchHistory(JSON.parse(saved));
            } catch (e) {
                setMovieSearchHistory([]);
            }
        }

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Perform real-time search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.trim().length >= 2) {
                setIsSearching(true);
                try {
                    const results = await getRealtimeSearch(searchQuery);
                    setSearchResults(results);
                } catch (error) {
                    console.error("Search error:", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults(null);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setIsSearchNavigating(true);
            saveHistoryItem("movies", searchQuery.trim());
            router.push(`/tim-kiem?keyword=${encodeURIComponent(searchQuery.trim())}`);
            setTimeout(() => {
                setIsSearchOpen(false);
                setIsSearchNavigating(false);
                setSearchQuery("");
            }, 100);
        }
    };

    const saveHistoryItem = (type: string, value: string) => {
        const item = value.trim();
        if (!item) return;
        const newHistory = [item, ...movieSearchHistory.filter(q => q !== item)].slice(0, 8);
        setMovieSearchHistory(newHistory);
        localStorage.setItem("movieSearchHistory", JSON.stringify(newHistory));
    };

    const clearHistory = (e: React.MouseEvent) => {
        e.stopPropagation();
        setMovieSearchHistory([]);
        localStorage.removeItem("movieSearchHistory");
    };

    useEffect(() => {
        if (isSearchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchOpen]);

    const closeDropdown = () => setOpenDropdown(null);

    if (pathname === "/login" || pathname === "/register" || pathname?.startsWith("/admin")) {
        return null;
    }

    const displayCategories = categories.length > 0 ? categories : [
        { name: "Hành Động", slug: "hanh-dong" },
        { name: "Tình Cảm", slug: "tinh-cam" },
        { name: "Hài Hước", slug: "hai-huoc" },
        { name: "Cổ Trang", slug: "co-trang" },
        { name: "Tâm Lý", slug: "tam-ly" },
        { name: "Hình Sự", slug: "hinh-su" },
    ];

    const displayCountries = countries.length > 0 ? countries : [
        { name: "Trung Quốc", slug: "trung-quoc" },
        { name: "Hàn Quốc", slug: "han-quoc" },
        { name: "Nhật Bản", slug: "nhat-ban" },
        { name: "Mỹ", slug: "my" },
    ];

    return (
        <>
            <header
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
                    !mounted 
                        ? "h-[64px] lg:h-[84px] bg-gradient-to-b from-black/80 to-transparent"
                        : isScrolled
                            ? "h-[54px] lg:h-[64px] bg-[#0a0a0a]/90 backdrop-blur-[8px] shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                            : (pathname === "/" || pathname === "/phim-trung" || pathname === "/phim-han")
                                ? "h-[64px] lg:h-[90px] bg-transparent shadow-none"
                                : "h-[64px] lg:h-[84px] bg-gradient-to-b from-black/80 to-transparent"
                )}
            >
                <div className="w-full h-[54px] lg:h-[64px] flex items-center justify-between gap-3 flex-nowrap pointer-events-auto px-4 lg:px-8">
                    {/* Mobile Section */}
                    <div className="flex lg:hidden items-center gap-2 shrink-0">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-white/90 active:scale-95 transition-transform"
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

                    {/* Overlay to close dropdowns */}
                    {openDropdown && (
                        <div
                            className="fixed inset-0 z-30"
                            onClick={closeDropdown}
                            aria-hidden="true"
                        />
                    )}

                    {/* Desktop Section */}
                    <div className="hidden lg:flex items-center gap-4 xl:gap-8 flex-1">
                        <Link href="/" className="flex items-center shrink-0 -ml-1 group">
                            <span className="font-display text-[20px] xl:text-[23px] font-black uppercase tracking-tighter text-white group-hover:text-primary transition-colors">
                                KHOIPHIM<span className="text-primary ml-0.5">.</span>
                            </span>
                        </Link>

                        <nav ref={navRef} className="flex items-center gap-1">
                            <div className="relative group/nav">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDropdown(openDropdown === "categories" ? null : "categories");
                                    }}
                                    className={cn(
                                        "flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] font-medium transition-all",
                                        openDropdown === "categories" ? "text-white bg-white/10" : "text-white/70 hover:text-white"
                                    )}
                                >
                                    Thể loại <ChevronDown className={cn("w-3.5 h-3.5 opacity-60 transition-transform duration-300", openDropdown === "categories" ? "rotate-180 opacity-100" : "")} />
                                </button>
                                {openDropdown === "categories" && (
                                    <div className="absolute top-full left-0 mt-3 w-[520px] bg-[#0d0f14]/98 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl grid grid-cols-3 gap-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                        {displayCategories.map((cat) => (
                                            <Link
                                                key={cat.slug}
                                                href={`/the-loai/${cat.slug}`}
                                                onClick={closeDropdown}
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
                                        "flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] font-medium transition-all",
                                        openDropdown === "countries" ? "text-white bg-white/10" : "text-white/70 hover:text-white"
                                    )}
                                >
                                    Quốc gia <ChevronDown className={cn("w-3.5 h-3.5 opacity-60 transition-transform duration-300", openDropdown === "countries" ? "rotate-180 opacity-100" : "")} />
                                </button>
                                {openDropdown === "countries" && (
                                    <div className="absolute top-full left-0 mt-3 w-[560px] bg-[#0d0f14]/98 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="grid grid-cols-3 gap-1 max-h-[400px] overflow-y-auto custom-scrollbar">
                                            {displayCountries.map((c) => (
                                                <Link
                                                    key={c.slug}
                                                    href={`/quoc-gia/${c.slug}`}
                                                    onClick={closeDropdown}
                                                    className="px-3 py-2 rounded-xl text-[13px] font-semibold text-white/50 hover:text-white hover:bg-white/5 transition-all"
                                                >
                                                    {c.name}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Link href="/loc-phim" className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] font-bold text-primary hover:bg-primary/10 transition-all border border-primary/20 shrink-0">
                                <Filter className="w-3.5 h-3.5" /> Lọc phim
                            </Link>
                            <Link href="/danh-sach/phim-moi-cap-nhat" className="hidden xl:block px-3 py-1.5 rounded-full text-[13px] font-medium text-white/70 hover:text-white">Phim mới</Link>
                            <Link href="/danh-sach/phim-bo" className="hidden 2xl:block px-3 py-1.5 rounded-full text-[13px] font-medium text-white/70 hover:text-white">Phim Bộ</Link>
                            <Link href="/danh-sach/phim-le" className="hidden 2xl:block px-3 py-1.5 rounded-full text-[13px] font-medium text-white/70 hover:text-white">Phim Lẻ</Link>
                        </nav>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-2 lg:gap-3 xl:gap-6 shrink-0">
                        <div className="flex items-center justify-end">
                            <form
                                onSubmit={handleSearch}
                                className={cn(
                                    "flex relative items-center transition-all duration-500 linear h-10",
                                    isSearchOpen ? "w-[calc(100vw-3rem)] md:w-[420px] lg:w-[480px] absolute right-0 lg:relative z-[60]" : "w-10"
                                )}
                            >
                                <button
                                    type="button"
                                    onClick={() => !isSearchOpen && setIsSearchOpen(true)}
                                    className={cn(
                                        "absolute right-0 z-20 w-10 h-10 flex items-center justify-center rounded-full transition-all",
                                        isSearchOpen ? "bg-transparent pointer-events-none" : "bg-white/5 hover:bg-white/10"
                                    )}
                                >
                                    {!isSearchOpen && <Search className="w-5 h-5 text-white/90" />}
                                </button>
                                <div className={cn(
                                    "absolute right-0 top-0 transition-all duration-300 w-full",
                                    isSearchOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
                                )}>
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onFocus={() => setShowHistory(true)}
                                        placeholder="Tìm kiếm..."
                                        className="w-full h-10 bg-[#0B0B10]/95 border border-white/[0.10] rounded-full pl-4 pr-10 text-sm text-white outline-none focus:border-primary/40 shadow-2xl backdrop-blur-md"
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
                                            className="absolute right-0 top-0 w-10 h-10 flex items-center justify-center z-30 text-white/50 hover:text-white"
                                        >
                                            {isSearchNavigating ? <Loader2 className="w-4 h-4 animate-spin" /> : searchQuery ? <Search className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                        </button>
                                    )}

                                    {/* Real-time Search Dropdown */}
                                    {isSearchOpen && (showHistory || searchQuery.length >= 0) && (
                                        <div className="absolute top-full left-0 right-0 mt-3 bg-[#0c0c14] border border-white/[0.08] rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 max-w-[100vw]">
                                            <div className="flex flex-col max-h-[500px] overflow-y-auto no-scrollbar p-4">
                                                {searchQuery.length > 0 ? (
                                                    <>
                                                        <div className="flex items-center justify-between mb-3 px-1">
                                                            <span className="text-[11px] font-bold text-white/30 uppercase tracking-widest">Kết quả</span>
                                                            {isSearching && <Loader2 className="w-3 h-3 text-primary animate-spin" />}
                                                        </div>
                                                        <div className="space-y-1">
                                                            {isSearching && !searchResults ? <SearchSkeleton /> : (
                                                                <>
                                                                    {searchResults?.movies?.slice(0, 5).map((movie: any) => (
                                                                        <Link
                                                                            href={`/phim/${movie.slug}`}
                                                                            key={movie._id}
                                                                            onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }}
                                                                            className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-all group"
                                                                        >
                                                                            <div className="w-9 h-12 relative rounded overflow-hidden">
                                                                                <Image src={getImageUrl(movie.poster_url || movie.thumb_url)} alt="" fill className="object-cover" unoptimized />
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="text-sm font-semibold truncate group-hover:text-primary">{movie.name}</div>
                                                                                <div className="text-[11px] text-white/40">{movie.year} • {movie.quality}</div>
                                                                            </div>
                                                                        </Link>
                                                                    ))}
                                                                </>
                                                            )}
                                                        </div>
                                                    </>
                                                ) : movieSearchHistory.length > 0 && (
                                                    <div>
                                                        <div className="flex items-center justify-between mb-3 px-1">
                                                            <span className="text-[11px] font-bold text-white/30 uppercase tracking-widest">Gần đây</span>
                                                            <button onClick={clearHistory} className="text-[10px] text-white/20 hover:text-red-500 uppercase font-black">Xóa</button>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {movieSearchHistory.map((q, i) => (
                                                                <button key={i} onClick={() => setSearchQuery(q)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full text-[12px] text-white/70 transition-all">
                                                                    {q}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {searchQuery.length > 0 && (
                                                <button onClick={handleSearch} className="w-full bg-primary py-3 text-black font-extrabold text-[12px] uppercase tracking-widest hover:bg-[#a8bdd8] transition-colors">
                                                    Xem tất cả kết quả
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </form>
                            
                            {isSearchOpen && (
                                <div className="fixed inset-0 z-30" onClick={() => { setIsSearchOpen(false); setShowHistory(false); }} />
                            )}
                        </div>

                        <div className={cn("flex items-center gap-3 lg:gap-6", isSearchOpen ? "hidden lg:flex" : "flex")}>
                            <Link href="/thong-bao" className="relative p-2 rounded-full hover:bg-white/5 transition-all text-white/70 hover:text-white">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-[#0a0a0a] rounded-full" />
                            </Link>

                            {!mounted ? (
                                <div className="w-9 h-9 rounded-full bg-white/5 animate-pulse" />
                            ) : session ? (
                                <div className="relative group">
                                    <button className="flex items-center gap-2 py-1 px-1 rounded-full hover:bg-white/5">
                                        <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10">
                                            {session.user?.image ? (
                                                <Image src={session.user.image} alt="" width={36} height={36} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-800 text-xs font-bold text-white uppercase">
                                                    {session.user?.name?.[0]}
                                                </div>
                                            )}
                                        </div>
                                        <ChevronDown className="hidden xl:block w-4 h-4 text-white/40 group-hover:rotate-180 transition-transform" />
                                    </button>
                                    <div className="absolute right-0 top-full mt-2 w-52 bg-[#0a0a0c]/98 border border-white/10 rounded-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-2xl">
                                        <Link href="/thong-tin-tai-khoan" className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg">
                                            <User className="w-4 h-4" /> <span>Hồ sơ</span>
                                        </Link>
                                        {(session.user as any)?.role === "admin" && (
                                            <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg">
                                                <Shield className="w-4 h-4" /> <span>Quản trị</span>
                                            </Link>
                                        )}
                                        <div className="h-px bg-white/5 my-1" />
                                        <button onClick={() => signOut({ callbackUrl: "/login" })} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/5 rounded-lg">
                                            <LogOut className="w-4 h-4" /> <span>Đăng xuất</span>
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </header>

            <MobileMenu
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                categories={displayCategories}
                countries={displayCountries}
            />
        </>
    );
}
