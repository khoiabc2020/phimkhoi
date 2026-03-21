import { getMoviesList } from "@/services/api";
import MovieCard from "@/components/MovieCard";
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Filter, SlidersHorizontal, ChevronRight, LayoutGrid, List } from "lucide-react";

interface FilterPageProps {
    searchParams: {
        category?: string;
        country?: string;
        year?: string;
        type?: string;
        page?: string;
    };
}

const YEARS = Array.from({ length: 16 }, (_, i) => (2025 - i).toString());
const TYPES = [
    { name: "Phim mới", slug: "phim-moi-cap-nhat" },
    { name: "Phim lẻ", slug: "phim-le" },
    { name: "Phim bộ", slug: "phim-bo" },
    { name: "Hoạt hình", slug: "hoat-hinh" },
    { name: "TV Shows", slug: "tv-shows" },
];

const CATEGORIES = [
    { name: "Hành động", slug: "hanh-dong" },
    { name: "Tình cảm", slug: "tinh-cam" },
    { name: "Hài hước", slug: "hai-huoc" },
    { name: "Cổ trang", slug: "co-trang" },
    { name: "Kinh dị", slug: "kinh-di" },
    { name: "Viễn tưởng", slug: "vien-tuong" },
    { name: "Hoạt hình", slug: "hoat-hinh" },
];

const COUNTRIES = [
    { name: "Trung Quốc", slug: "trung-quoc" },
    { name: "Hàn Quốc", slug: "han-quoc" },
    { name: "Nhật Bản", slug: "nhat-ban" },
    { name: "Thái Lan", slug: "thai-lan" },
    { name: "Âu Mỹ", slug: "au-my" },
];

async function MovieGrid({ category, country, year, type, page }: any) {
    const data = await getMoviesList(type || "phim-moi-cap-nhat", {
        category,
        country,
        year: year ? parseInt(year) : undefined,
        page: page ? parseInt(page) : 1,
        limit: 30
    });

    const movies = data.items || [];

    if (movies.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <Filter className="w-10 h-10 text-white/20" />
                </div>
                <h3 className="text-xl font-bold mb-2">Không tìm thấy phim</h3>
                <p className="text-white/40 max-w-md">Hãy thử thay đổi bộ lọc để tìm kiếm kết quả khác nhé.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {movies.map((movie: any) => (
                <div key={movie._id || movie.slug} className="animate-in fade-in duration-500">
                    <MovieCard movie={movie} />
                </div>
            ))}
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="space-y-3">
                    <div className="aspect-[2/3] w-full bg-white/5 rounded-xl animate-pulse" />
                    <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-white/5 rounded animate-pulse" />
                </div>
            ))}
        </div>
    );
}

export default function AdvancedFilterPage({ searchParams }: FilterPageProps) {
    const { category, country, year, type, page } = searchParams;

    const buildUrl = (updates: Record<string, string | null>) => {
        const params = new URLSearchParams(Object.entries(searchParams).filter(([_, v]) => v) as [string, string][]);
        Object.entries(updates).forEach(([k, v]) => {
            if (v === null || v === "") params.delete(k);
            else params.set(k, v);
        });
        return `/loc-phim?${params.toString()}`;
    };

    return (
        <main className="min-h-screen bg-[#080b12] text-white">
            <Header />

            <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-32 pb-20">
                
                {/* Header & Breadcrumb */}
                <div className="mb-8 md:mb-12">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-white/30 uppercase tracking-widest mb-4">
                        <Link href="/" className="hover:text-primary transition-colors">Trang chủ</Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-white/60">Lọc phim</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight flex items-center gap-4">
                            Lọc Phim Nâng Cao
                            <SlidersHorizontal className="w-8 h-8 md:w-10 md:h-10 text-primary opacity-50" />
                        </h1>
                    </div>
                </div>

                {/* Filter Toolbar */}
                <div className="sticky top-20 z-30 bg-[#080b12]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-4 md:p-6 mb-10 shadow-2xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        
                        {/* Type Select */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.1em] pl-1">Định dạng</label>
                            <select 
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
                                value={type || "phim-moi-cap-nhat"}
                                onChange={(e) => window.location.href = buildUrl({ type: e.target.value, page: "1" })}
                            >
                                {TYPES.map(t => <option key={t.slug} value={t.slug} className="bg-[#080b12]">{t.name}</option>)}
                            </select>
                        </div>

                        {/* Category Select */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.1em] pl-1">Thể loại</label>
                            <select 
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
                                value={category || ""}
                                onChange={(e) => window.location.href = buildUrl({ category: e.target.value || null, page: "1" })}
                            >
                                <option value="" className="bg-[#080b12]">Tất cả thể loại</option>
                                {CATEGORIES.map(c => <option key={c.slug} value={c.slug} className="bg-[#080b12]">{c.name}</option>)}
                            </select>
                        </div>

                        {/* Country Select */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.1em] pl-1">Quốc gia</label>
                            <select 
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
                                value={country || ""}
                                onChange={(e) => window.location.href = buildUrl({ country: e.target.value || null, page: "1" })}
                            >
                                <option value="" className="bg-[#080b12]">Tất cả quốc gia</option>
                                {COUNTRIES.map(c => <option key={c.slug} value={c.slug} className="bg-[#080b12]">{c.name}</option>)}
                            </select>
                        </div>

                        {/* Year Select */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.1em] pl-1">Năm phát hành</label>
                            <select 
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
                                value={year || ""}
                                onChange={(e) => window.location.href = buildUrl({ year: e.target.value || null, page: "1" })}
                            >
                                <option value="" className="bg-[#080b12]">Tất cả năm</option>
                                {YEARS.map(y => <option key={y} value={y} className="bg-[#080b12]">{y}</option>)}
                            </select>
                        </div>

                        {/* Reset Button */}
                        <div className="flex items-end">
                            <Link 
                                href="/loc-phim"
                                className="w-full bg-white/10 hover:bg-white/20 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-center transition-all active:scale-95"
                            >
                                Đặt lại bộ lọc
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Results Grid */}
                <Suspense key={JSON.stringify(searchParams)} fallback={<LoadingSkeleton />}>
                    <MovieGrid {...searchParams} />
                </Suspense>

                {/* Pagination (Load More / Simple) */}
                <div className="mt-16 flex justify-center gap-4">
                    {parseInt(page || "1") > 1 && (
                        <Link 
                            href={buildUrl({ page: (parseInt(page || "1") - 1).toString() })}
                            className="px-8 py-3 rounded-full bg-white/5 border border-white/10 font-bold hover:bg-primary hover:text-black transition-all"
                        >
                            Trang trước
                        </Link>
                    )}
                    <Link 
                        href={buildUrl({ page: (parseInt(page || "1") + 1).toString() })}
                        className="px-8 py-3 rounded-full bg-primary text-black font-extrabold shadow-[0_4px_20px_rgba(143,167,197,0.3)] hover:scale-105 transition-all"
                    >
                        Trang tiếp theo
                    </Link>
                </div>
            </div>

            <Footer />
        </main>
    );
}
