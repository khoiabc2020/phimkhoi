"use client";

import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";

interface FilterToolbarProps {
    searchParams: {
        category?: string;
        country?: string;
        year?: string;
        type?: string;
        page?: string;
    };
    categories: { name: string; slug: string }[];
    countries: { name: string; slug: string }[];
    years: string[];
    types: { name: string; slug: string }[];
}

export default function FilterToolbar({ searchParams, categories, countries, years, types }: FilterToolbarProps) {
    const { category, country, year, type } = searchParams;

    const buildUrl = (updates: Record<string, string | null>) => {
        const params = new URLSearchParams();
        
        // Add existing params
        Object.entries(searchParams).forEach(([k, v]) => {
            if (v) params.set(k, v);
        });

        // Apply updates
        Object.entries(updates).forEach(([k, v]) => {
            if (v === null || v === "") params.delete(k);
            else params.set(k, v);
        });

        return `/loc-phim?${params.toString()}`;
    };

    const handleFilterChange = (key: string, value: string) => {
        const url = buildUrl({ [key]: value || null, page: "1" });
        window.location.href = url;
    };

    return (
        <div className="sticky top-20 z-30 bg-[#080b12]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-4 md:p-6 mb-10 shadow-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                
                {/* Type Select */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.1em] pl-1">Định dạng</label>
                    <select 
                        className="w-full bg-white/5 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:bg-white/10 transition-colors appearance-none cursor-pointer"
                        value={type || "phim-moi-cap-nhat"}
                        onChange={(e) => handleFilterChange("type", e.target.value)}
                    >
                        {types.map(t => <option key={t.slug} value={t.slug} className="bg-[#080b12]">{t.name}</option>)}
                    </select>
                </div>

                {/* Category Select */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.1em] pl-1">Thể loại</label>
                    <select 
                        className="w-full bg-white/5 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:bg-white/10 transition-colors appearance-none cursor-pointer"
                        value={category || ""}
                        onChange={(e) => handleFilterChange("category", e.target.value)}
                    >
                        <option value="" className="bg-[#080b12]">Tất cả thể loại</option>
                        {categories.map(c => <option key={c.slug} value={c.slug} className="bg-[#080b12]">{c.name}</option>)}
                    </select>
                </div>

                {/* Country Select */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.1em] pl-1">Quốc gia</label>
                    <select 
                        className="w-full bg-white/5 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:bg-white/10 transition-colors appearance-none cursor-pointer"
                        value={country || ""}
                        onChange={(e) => handleFilterChange("country", e.target.value)}
                    >
                        <option value="" className="bg-[#080b12]">Tất cả quốc gia</option>
                        {countries.map(c => <option key={c.slug} value={c.slug} className="bg-[#080b12]">{c.name}</option>)}
                    </select>
                </div>

                {/* Year Select */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.1em] pl-1">Năm phát hành</label>
                    <select 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
                        value={year || ""}
                        onChange={(e) => handleFilterChange("year", e.target.value)}
                    >
                        <option value="" className="bg-[#080b12]">Tất cả năm</option>
                        {years.map(y => <option key={y} value={y} className="bg-[#080b12]">{y}</option>)}
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
    );
}
