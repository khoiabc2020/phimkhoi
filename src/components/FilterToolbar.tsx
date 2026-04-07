"use client";

import Link from "next/link";
import { SlidersHorizontal, ChevronDown, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import EliteSelect from "./EliteSelect";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
    { name: "Mới nhất", slug: "newest" },
    { name: "Cũ nhất", slug: "oldest" },
    { name: "Năm giảm dần", slug: "year-desc" },
    { name: "Năm tăng dần", slug: "year-asc" },
    { name: "Phổ biến nhất", slug: "popular" },
];

const TYPE_TABS = [
    { name: "Tất cả", slug: "" },
    { name: "Phim Lẻ", slug: "phim-le" },
    { name: "Phim Bộ", slug: "phim-bo" },
    { name: "Hoạt hình", slug: "hoat-hinh" },
    { name: "TV Shows", slug: "tv-shows" },
    { name: "Mới cập nhật", slug: "phim-moi-cap-nhat" },
];

interface FilterToolbarProps {
    searchParams: {
        category?: string;
        country?: string;
        year?: string;
        type?: string;
        sort?: string;
        page?: string;
    };
    categories: { name: string; slug: string }[];
    countries: { name: string; slug: string }[];
    years: string[];
    types: { name: string; slug: string }[];
}

export default function FilterToolbar({ searchParams, categories, countries, years, types }: FilterToolbarProps) {
    const router = useRouter();
    const { category, country, year, type, sort } = searchParams;
    const [expanded, setExpanded] = useState(false);

    const buildUrl = (updates: Record<string, string | null>) => {
        const params = new URLSearchParams();
        Object.entries(searchParams).forEach(([k, v]) => { if (v) params.set(k, v); });
        Object.entries(updates).forEach(([k, v]) => {
            if (v === null || v === "" || v === "all") params.delete(k);
            else params.set(k, v);
        });
        return `/loc-phim?${params.toString()}`;
    };

    const handleFilterChange = (key: string, value: string) => {
        router.push(buildUrl({ [key]: value || null, page: "1" }), { scroll: false });
    };

    const categoryOptions = [{ name: "Tất cả thể loại", slug: "all" }, ...categories];
    const countryOptions  = [{ name: "Tất cả quốc gia", slug: "all" }, ...countries];
    const yearOptions     = [{ name: "Tất cả năm", slug: "all" }, ...years.map(y => ({ name: y, slug: y }))];

    // Count active advanced filters (not type)
    const activeAdvanced = [category, country, year, sort && sort !== "newest" ? sort : null].filter(Boolean).length;

    return (
        <div className="mb-6 md:mb-10">

            {/* ── Mobile: horizontal type tabs ───────────────────────────── */}
            <div className="md:hidden">
                {/* Type tab strip */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 mb-3">
                    {TYPE_TABS.map((tab) => {
                        const isActive = (tab.slug === "" && !type) || type === tab.slug;
                        return (
                            <button
                                key={tab.slug}
                                onClick={() => handleFilterChange("type", tab.slug)}
                                className={cn(
                                    "whitespace-nowrap shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-all active:scale-95",
                                    isActive
                                        ? "bg-white text-[#080b12]"
                                        : "bg-white/[0.06] text-white/55 hover:text-white hover:bg-white/10"
                                )}
                            >
                                {tab.name}
                            </button>
                        );
                    })}
                </div>

                {/* Expand filter button */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border",
                        activeAdvanced > 0
                            ? "bg-[#8FA7C5]/10 border-[#8FA7C5]/30 text-[#8FA7C5]"
                            : "bg-white/[0.04] border-white/[0.07] text-white/50 hover:text-white/80"
                    )}
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    Mở rộng bộ lọc
                    {activeAdvanced > 0 && (
                        <span className="w-5 h-5 rounded-full bg-[#8FA7C5] text-[#080b12] text-[10px] font-black flex items-center justify-center">
                            {activeAdvanced}
                        </span>
                    )}
                    <ChevronDown className={cn("w-4 h-4 ml-auto transition-transform", expanded && "rotate-180")} />
                </button>

                {/* Expandable advanced filters */}
                {expanded && (
                    <div className="mt-3 bg-[#0d1119] border border-white/[0.07] rounded-2xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-white/35 uppercase tracking-wider pl-0.5">Thể loại</label>
                                <EliteSelect options={categoryOptions} value={category || "all"} onChange={(v) => handleFilterChange("category", v)} placeholder="Thể loại" className="w-full h-10" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-white/35 uppercase tracking-wider pl-0.5">Quốc gia</label>
                                <EliteSelect options={countryOptions} value={country || "all"} onChange={(v) => handleFilterChange("country", v)} placeholder="Quốc gia" className="w-full h-10" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-white/35 uppercase tracking-wider pl-0.5">Năm phát hành</label>
                                <EliteSelect options={yearOptions} value={year || "all"} onChange={(v) => handleFilterChange("year", v)} placeholder="Năm" className="w-full h-10" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-white/35 uppercase tracking-wider pl-0.5">Sắp xếp</label>
                                <EliteSelect options={SORT_OPTIONS} value={sort || "newest"} onChange={(v) => handleFilterChange("sort", v)} placeholder="Sắp xếp" className="w-full h-10" />
                            </div>
                        </div>
                        {activeAdvanced > 0 && (
                            <Link
                                href="/loc-phim"
                                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/40 text-xs font-semibold hover:text-white hover:bg-white/10 transition-all"
                            >
                                <X className="w-3.5 h-3.5" />
                                Xoá bộ lọc
                            </Link>
                        )}
                    </div>
                )}
            </div>

            {/* ── Desktop: full filter grid (unchanged) ─────────────────── */}
            <div className="hidden md:block">
                <div className="sticky top-20 z-[90] bg-[#0c0c14]/90 backdrop-blur-2xl border border-white/10 rounded-[20px] p-5 md:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                    <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4">
                        <div className="space-y-1.5 flex flex-col justify-end">
                            <label className="text-[10px] sm:text-xs font-bold text-white/50 uppercase tracking-[0.08em] pl-1">Định dạng</label>
                            <EliteSelect
                                options={[{ name: "Tất cả", slug: "all" }, ...types]}
                                value={type || "all"}
                                onChange={(v) => handleFilterChange("type", v)}
                                placeholder="Định dạng"
                                className="w-full h-11"
                            />
                        </div>
                        <div className="space-y-1.5 flex flex-col justify-end">
                            <label className="text-[10px] sm:text-xs font-bold text-white/50 uppercase tracking-[0.08em] pl-1">Thể loại</label>
                            <EliteSelect options={categoryOptions} value={category || "all"} onChange={(v) => handleFilterChange("category", v)} placeholder="Thể loại" className="w-full h-11" />
                        </div>
                        <div className="space-y-1.5 flex flex-col justify-end">
                            <label className="text-[10px] sm:text-xs font-bold text-white/50 uppercase tracking-[0.08em] pl-1">Quốc gia</label>
                            <EliteSelect options={countryOptions} value={country || "all"} onChange={(v) => handleFilterChange("country", v)} placeholder="Quốc gia" className="w-full h-11" />
                        </div>
                        <div className="space-y-1.5 flex flex-col justify-end">
                            <label className="text-[10px] sm:text-xs font-bold text-white/50 uppercase tracking-[0.08em] pl-1">Năm phát hành</label>
                            <EliteSelect options={yearOptions} value={year || "all"} onChange={(v) => handleFilterChange("year", v)} placeholder="Năm" className="w-full h-11" />
                        </div>
                        <div className="space-y-1.5 flex flex-col justify-end">
                            <label className="text-[10px] sm:text-xs font-bold text-white/50 uppercase tracking-[0.08em] pl-1">Sắp xếp</label>
                            <EliteSelect options={SORT_OPTIONS} value={sort || "newest"} onChange={(v) => handleFilterChange("sort", v)} placeholder="Sắp xếp" className="w-full h-11" />
                        </div>
                        <div className="flex items-end col-span-2 lg:col-span-1 pt-2 lg:pt-0">
                            <Link href="/loc-phim" className="w-full flex items-center justify-center gap-2 h-11 bg-white/5 hover:bg-white/15 border border-white/10 rounded-xl px-4 text-[13px] md:text-sm font-bold transition-all active:scale-95 group">
                                <SlidersHorizontal className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                                Đặt lại
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
