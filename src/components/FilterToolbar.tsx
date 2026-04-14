"use client";

import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import EliteSelect from "./EliteSelect";

const SORT_OPTIONS = [
    { name: "Mới nhất", slug: "newest" },
    { name: "Cũ nhất", slug: "oldest" },
    { name: "Năm giảm dần", slug: "year-desc" },
    { name: "Năm tăng dần", slug: "year-asc" },
    { name: "Phổ biến nhất", slug: "popular" },
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

    const buildUrl = (updates: Record<string, string | null>) => {
        const params = new URLSearchParams();
        
        // Add existing params
        Object.entries(searchParams).forEach(([k, v]) => {
            if (v) params.set(k, v);
        });

        // Apply updates
        Object.entries(updates).forEach(([k, v]) => {
            if (v === null || v === "" || v === "all") params.delete(k);
            else params.set(k, v);
        });

        return `/loc-phim?${params.toString()}`;
    };

    const handleFilterChange = (key: string, value: string) => {
        const url = buildUrl({ [key]: value || null, page: "1" });
        router.push(url, { scroll: false });
    };

    const typeOptions = [{ name: "Tất cả", slug: "all" }, ...types];
    const categoryOptions = [{ name: "Tất cả thể loại", slug: "all" }, ...categories];
    const countryOptions = [{ name: "Tất cả quốc gia", slug: "all" }, ...countries];
    const yearOptions = [{ name: "Tất cả năm", slug: "all" }, ...years.map(y => ({ name: y, slug: y }))];
    const sortOptions = SORT_OPTIONS;

    return (
        <div className="sticky top-[68px] z-[90] mb-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
                <EliteSelect
                    options={typeOptions}
                    value={type || "all"}
                    onChange={(value) => handleFilterChange("type", value)}
                    placeholder="Định dạng"
                />
                <EliteSelect
                    options={categoryOptions}
                    value={category || "all"}
                    onChange={(value) => handleFilterChange("category", value)}
                    placeholder="Thể loại"
                />
                <EliteSelect
                    options={countryOptions}
                    value={country || "all"}
                    onChange={(value) => handleFilterChange("country", value)}
                    placeholder="Quốc gia"
                />
                <EliteSelect
                    options={yearOptions}
                    value={year || "all"}
                    onChange={(value) => handleFilterChange("year", value)}
                    placeholder="Năm"
                />
                <EliteSelect
                    options={sortOptions}
                    value={sort || "newest"}
                    onChange={(value) => handleFilterChange("sort", value)}
                    placeholder="Sắp xếp"
                />
                <Link
                    href="/loc-phim"
                    className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 h-[42px] bg-white/[0.04] hover:bg-white/8 border border-white/[0.07] rounded-[12px] px-4 text-[13px] font-bold text-white/40 hover:text-white/80 transition-all active:scale-95"
                >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Đặt lại
                </Link>
            </div>
        </div>
    );
}
