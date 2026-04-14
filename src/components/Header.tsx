"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Search, User, LogOut, ChevronDown, Shield, Loader2, X } from "lucide-react";
import { getPosterImageUrl, cn } from "@/lib/utils";
import { signOut, useSession } from "next-auth/react";
import MobileMenu from "./MobileMenu";
import SearchSkeleton from "./SearchSkeleton";
import NotificationDropdown from "./NotificationDropdown";

interface HeaderProps {
    categories: any[];
    countries: any[];
}

function formatSearchMeta(movie: any) {
    const year = Number(movie?.year);
    const quality = String(movie?.quality || "").trim().toUpperCase();
    const parts: string[] = [];

    if (year > 1900) parts.push(String(year));
    if (quality && quality !== "0" && quality !== "FULLHD") {
        parts.push(quality);
    } else if (quality === "FULLHD") {
        parts.push("FHD");
    }

    return parts.join(" • ");
}

export default function Header({ categories, countries }: HeaderProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session, status } = useSession();
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
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [stableSession, setStableSession] = useState<any>(null);

    const prefetchPath = (path: string) => {
        if (!path) return;
        router.prefetch(path);
    };

    const navRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const activeSearchRequestRef = useRef(0);
    const searchCacheRef = useRef<Map<string, any>>(new Map());

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

    useEffect(() => {
        ["/", "/phim-han", "/phim-trung", "/danh-sach/phim-moi-cap-nhat", "/danh-sach/phim-bo", "/danh-sach/phim-le"]
            .forEach((path) => router.prefetch(path));
    }, [router]);

    useEffect(() => {
        if (session) {
            setStableSession(session);
            return;
        }

        if (status === "unauthenticated") {
            setStableSession(null);
        }
    }, [session, status]);

    // Perform real-time search
    useEffect(() => {
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            const cleanQuery = searchQuery.trim();

            if (cleanQuery.length < 2) {
                activeSearchRequestRef.current += 1;
                setIsSearching(false);
                setSearchResults(null);
                return;
            }

            const requestId = activeSearchRequestRef.current + 1;
            activeSearchRequestRef.current = requestId;
            const cacheKey = cleanQuery.toLowerCase();
            const cached = searchCacheRef.current.get(cacheKey);

            if (cached) {
                setSearchResults(cached);
                setIsSearching(false);
                return;
            }

            setIsSearching(true);

            try {
                const response = await fetch(`/api/search/realtime?q=${encodeURIComponent(cleanQuery)}`, {
                    method: "GET",
                    cache: "force-cache",
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error(`Realtime search failed: ${response.status}`);
                }

                const results = await response.json();
                if (searchCacheRef.current.size >= 100) {
                    searchCacheRef.current.delete(searchCacheRef.current.keys().next().value);
                }
                searchCacheRef.current.set(cacheKey, results || { movies: [], actors: [] });

                if (activeSearchRequestRef.current === requestId) {
                    setSearchResults(results || { movies: [], actors: [] });
                }
            } catch (error: any) {
                if (error?.name !== "AbortError") {
                    console.error("Search error:", error);
                }
                if (activeSearchRequestRef.current === requestId) {
                    setSearchResults({ movies: [], actors: [] });
                }
            } finally {
                if (activeSearchRequestRef.current === requestId) {
                    setIsSearching(false);
                }
            }
        }, 300);

        return () => {
            controller.abort();
            clearTimeout(timer);
        };
    }, [searchQuery]);

    // Reset selection when results change
    useEffect(() => {
        setSelectedIndex(-1);
    }, [searchResults, searchQuery]);

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
        } else {
            setSelectedIndex(-1);
        }
    }, [isSearchOpen]);

    useEffect(() => {
        setIsSearchOpen(false);
        setShowHistory(false);
        setSearchQuery("");
        setSearchResults(null);
        setIsSearching(false);
        setIsSearchNavigating(false);
    }, [pathname]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        const results = searchResults?.movies?.slice(0, 7) || [];
        const maxIndex = results.length - 1;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex(prev => (prev < maxIndex ? prev + 1 : prev));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex(prev => (prev > -1 ? prev - 1 : -1));
        } else if (e.key === "Enter") {
            if (selectedIndex >= 0 && results[selectedIndex]) {
                e.preventDefault();
                const movie = results[selectedIndex];
                setIsSearchOpen(false);
                setSearchQuery("");
                router.push(`/phim/${movie.slug}`);
            }
        } else if (e.key === "Escape") {
            setIsSearchOpen(false);
        }
    };

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

    const trimmedSearchQuery = searchQuery.trim();
    const hasTypedQuery = trimmedSearchQuery.length > 0;
    const movieResults = searchResults?.movies?.slice(0, 7) || [];
    const actorResults = searchResults?.actors?.slice(0, 3) || [];
    const hasSearchResults = movieResults.length > 0 || actorResults.length > 0;
    const authSession = session || (status === "loading" ? stableSession : null);
    const isAuthLoading = !mounted || (status === "loading" && !stableSession);

    return (
        <>
            <header
                className={cn(
                    "fixed top-0 left-0 right-0 z-[100] transition-all duration-500",
                    !mounted 
                        ? "h-[64px] lg:h-[84px] bg-gradient-to-b from-black/80 to-transparent"
                        : isScrolled
                            ? "h-[54px] lg:h-[64px] bg-[#0a0a0a]/90 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
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
                            aria-label="Mở menu"
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
                        <Link
                            href="/"
                            onMouseEnter={() => prefetchPath("/")}
                            onFocus={() => prefetchPath("/")}
                            className="flex items-center shrink-0 -ml-1 group"
                        >
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
                                    <div className="absolute top-full left-0 mt-3 w-[min(560px,calc(100vw-3rem))] bg-[#0d0f14]/98 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="grid grid-cols-3 gap-x-4 gap-y-1">
                                            {displayCategories.map((cat) => (
                                                <Link
                                                    key={cat.slug}
                                                    href={`/the-loai/${cat.slug}`}
                                                    onMouseEnter={() => prefetchPath(`/the-loai/${cat.slug}`)}
                                                    onFocus={() => prefetchPath(`/the-loai/${cat.slug}`)}
                                                    onClick={closeDropdown}
                                                    className="px-3 py-2 rounded-xl text-[13px] font-semibold text-white/50 hover:text-white hover:bg-white/5 transition-all whitespace-nowrap truncate"
                                                >
                                                    {cat.name}
                                                </Link>
                                            ))}
                                        </div>
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
                                    <div className="absolute top-full left-0 mt-3 w-[min(640px,calc(100vw-3rem))] bg-[#0d0f14]/98 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="grid grid-cols-4 gap-x-4 gap-y-1 max-h-[450px] overflow-y-auto custom-scrollbar pr-2">
                                            {displayCountries.map((c) => (
                                                <Link
                                                    key={c.slug}
                                                    href={`/quoc-gia/${c.slug}`}
                                                    onMouseEnter={() => prefetchPath(`/quoc-gia/${c.slug}`)}
                                                    onFocus={() => prefetchPath(`/quoc-gia/${c.slug}`)}
                                                    onClick={closeDropdown}
                                                    className="px-3 py-2 rounded-xl text-[13px] font-semibold text-white/50 hover:text-white hover:bg-white/5 transition-all whitespace-nowrap truncate"
                                                >
                                                    {c.name}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Link
                                href="/danh-sach/phim-moi-cap-nhat"
                                onMouseEnter={() => prefetchPath("/danh-sach/phim-moi-cap-nhat")}
                                onFocus={() => prefetchPath("/danh-sach/phim-moi-cap-nhat")}
                                className="hidden xl:block px-3 py-1.5 rounded-full text-[13px] font-medium text-white/70 hover:text-white"
                            >
                                Phim mới
                            </Link>
                            <Link
                                href="/danh-sach/phim-bo"
                                onMouseEnter={() => prefetchPath("/danh-sach/phim-bo")}
                                onFocus={() => prefetchPath("/danh-sach/phim-bo")}
                                className="hidden 2xl:block px-3 py-1.5 rounded-full text-[13px] font-medium text-white/70 hover:text-white"
                            >
                                Phim Bộ
                            </Link>
                            <Link
                                href="/danh-sach/phim-le"
                                onMouseEnter={() => prefetchPath("/danh-sach/phim-le")}
                                onFocus={() => prefetchPath("/danh-sach/phim-le")}
                                className="hidden 2xl:block px-3 py-1.5 rounded-full text-[13px] font-medium text-white/70 hover:text-white"
                            >
                                Phim Lẻ
                            </Link>
                        </nav>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-2 lg:gap-3 xl:gap-6 shrink-0">
                        <div className="flex items-center justify-end">
                            <form
                                onSubmit={handleSearch}
                                className={cn(
                                    "flex relative items-center transition-all duration-500 linear h-10",
                                    isSearchOpen ? "w-[min(calc(100vw-2rem),560px)] sm:w-[420px] lg:w-[520px] absolute right-0 lg:relative z-[60]" : "w-10"
                                )}
                            >
                                <button
                                    type="button"
                                    aria-label="Tìm kiếm"
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
                                        onKeyDown={handleKeyDown}
                                        placeholder="Tìm kiếm..."
                                        className="w-full h-10 bg-[#0B0B10]/95 border border-white/[0.10] rounded-full pl-4 pr-10 text-sm text-white outline-none focus:border-primary/40 shadow-2xl backdrop-blur-md"
                                    />
                                    {isSearchOpen && (
                                        <button
                                            type={hasTypedQuery ? "submit" : "button"}
                                            onClick={(e) => {
                                                if (!hasTypedQuery) {
                                                    setIsSearchOpen(false);
                                                    setShowHistory(false);
                                                    e.preventDefault();
                                                }
                                            }}
                                            className="absolute right-0 top-0 w-10 h-10 flex items-center justify-center z-30 text-white/50 hover:text-white"
                                        >
                                            {isSearchNavigating ? <Loader2 className="w-4 h-4 animate-spin" /> : hasTypedQuery ? <Search className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                        </button>
                                    )}

                                    {/* Real-time Search Dropdown */}
                                    {isSearchOpen && (hasTypedQuery || (showHistory && movieSearchHistory.length > 0)) && (
                                        <div className="absolute top-full left-0 right-0 mt-3 bg-[#0c0c14] border border-white/[0.08] rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 max-w-[100vw]">
                                            <div className="flex flex-col max-h-[60vh] lg:max-h-[500px] overflow-y-auto no-scrollbar p-4">
                                                {hasTypedQuery ? (
                                                    <>
                                                        <div className="flex items-center justify-between mb-3 px-1">
                                                            <span className="text-[11px] font-bold text-white/30 uppercase tracking-widest">Kết quả</span>
                                                            {isSearching && <Loader2 className="w-3 h-3 text-primary animate-spin" />}
                                                        </div>
                                                        <div className="space-y-1">
                                                            {isSearching && !hasSearchResults ? <SearchSkeleton /> : (
                                                                <>
                                                                    {movieResults.map((movie: any, idx: number) => (
                                                                        <Link
                                                                            href={`/phim/${movie.slug}`}
                                                                            key={movie._id}
                                                                            onClick={() => {
                                                                                saveHistoryItem("movies", movie.name || trimmedSearchQuery);
                                                                                setIsSearchOpen(false);
                                                                                setSearchQuery("");
                                                                            }}
                                                                            onMouseEnter={() => {
                                                                                router.prefetch(`/phim/${movie.slug}`);
                                                                                setSelectedIndex(idx);
                                                                            }}
                                                                            className={cn(
                                                                                "flex items-center gap-3 px-2 py-2.5 rounded-xl transition-all group",
                                                                                selectedIndex === idx ? "bg-white/10 ring-1 ring-white/10" : "hover:bg-white/[0.06]"
                                                                            )}
                                                                        >
                                                                            {/* Poster lớn hơn: w-12 h-[68px] (~2:3 ratio) */}
                                                                            <div className="w-12 h-[68px] relative rounded-lg overflow-hidden shrink-0 shadow-md">
                                                                                <Image src={getPosterImageUrl(movie) || "/placeholder.svg"} alt="" fill className="object-cover" sizes="48px" unoptimized />
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className={cn("text-[13px] font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors", selectedIndex === idx ? "text-primary" : "text-white")}>{movie.name}</div>
                                                                                {formatSearchMeta(movie) ? (
                                                                                    <div className="text-[11px] text-white/40 mt-1">{formatSearchMeta(movie)}</div>
                                                                                ) : null}
                                                                            </div>
                                                                        </Link>
                                                                    ))}
                                                                    {actorResults.length > 0 && (
                                                                        <div className="pt-2 mt-2 border-t border-white/5">
                                                                            <div className="px-2 pb-2 text-[10px] font-bold text-white/25 uppercase tracking-[0.2em]">Diễn viên</div>
                                                                            <div className="flex flex-wrap gap-2 px-1">
                                                                                {actorResults.map((actor: any) => (
                                                                                    <Link
                                                                                        key={actor.id || actor.name}
                                                                                        href={`/tim-kiem?keyword=${encodeURIComponent(actor.name || "")}`}
                                                                                        onClick={() => {
                                                                                            saveHistoryItem("movies", actor.name || trimmedSearchQuery);
                                                                                            setIsSearchOpen(false);
                                                                                            setSearchQuery("");
                                                                                        }}
                                                                                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full text-[12px] text-white/70 transition-all"
                                                                                    >
                                                                                        {actor.name}
                                                                                    </Link>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    {!isSearching && !hasSearchResults && (
                                                                        <div className="px-2 py-8 text-center">
                                                                            <div className="text-sm font-semibold text-white/70">Không tìm thấy phim phù hợp</div>
                                                                            <div className="text-xs text-white/35 mt-1">Hệ thống đã kiểm tra DB và nguồn ngoài cho "{trimmedSearchQuery}".</div>
                                                                        </div>
                                                                    )}
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
                                            {hasTypedQuery && (
                                                <Link 
                                                    href={`/tim-kiem?keyword=${encodeURIComponent(trimmedSearchQuery)}`}
                                                    onClick={() => {
                                                        saveHistoryItem("movies", trimmedSearchQuery);
                                                        setIsSearchOpen(false);
                                                        setSearchQuery("");
                                                    }}
                                                    className="w-full mt-2 py-4 px-4 flex items-center justify-between group/action transition-all hover:bg-white/5 active:bg-white/10 border-t border-white/5"
                                                >
                                                    <span className="text-[11px] font-black text-white/40 group-hover/action:text-primary uppercase tracking-[2px] transition-colors">Xem tất cả kết quả</span>
                                                    <div className="w-8 h-8 rounded-full bg-white/5 group-hover/action:bg-primary group-hover/action:scale-110 flex items-center justify-center transition-all">
                                                        <Search className="w-3.5 h-3.5 text-white group-hover/action:text-black" />
                                                    </div>
                                                </Link>
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
                            <NotificationDropdown />

                            {isAuthLoading ? (
                                <div className="w-9 h-9 rounded-full bg-white/5 animate-pulse" />
                            ) : authSession ? (
                                <div className="relative group">
                                    <button aria-label="Tài khoản của tôi" className="flex items-center gap-2 py-1 px-1 rounded-full hover:bg-white/5 group">
                                        <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 ring-2 ring-transparent group-hover:ring-primary/40 transition-all">
                                            {authSession.user?.image ? (
                                                <Image src={authSession.user.image} alt="" width={36} height={36} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-xs font-bold text-white uppercase">
                                                    {authSession.user?.name?.[0]}
                                                </div>
                                            )}
                                        </div>
                                        <ChevronDown className="hidden xl:block w-4 h-4 text-white/40 group-hover:rotate-180 transition-transform" />
                                    </button>
                                    <div className="absolute right-0 top-full mt-2 w-52 bg-[#0a0a0c]/98 border border-white/10 rounded-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-2xl z-50">
                                        <Link href="/thong-tin-tai-khoan" className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg">
                                            <User className="w-4 h-4" /> <span>Hồ sơ</span>
                                        </Link>
                                        {(authSession.user as any)?.role === "admin" && (
                                            <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg">
                                                <Shield className="w-4 h-4" /> <span>Quản trị</span>
                                            </Link>
                                        )}
                                        <div className="h-px bg-white/5 my-1" />
                                        <button onClick={() => signOut({ callbackUrl: "/login" })} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/5 rounded-lg text-left">
                                            <LogOut className="w-4 h-4" /> <span>Đăng xuất</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <Link
                                    href="/login"
                                    className="px-5 py-2 rounded-full text-sm font-bold bg-white text-black hover:bg-white/90 transition-all active:scale-95"
                                >
                                    Đăng nhập
                                </Link>
                            )}
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

