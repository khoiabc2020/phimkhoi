"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { ChevronDown } from "lucide-react";

export default function FilterBar({ 
    categories = [], 
    countries = [] 
}: { 
    categories?: { name: string; slug: string }[]; 
    countries?: { name: string; slug: string }[]; 
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value === "all") {
                params.delete(name);
            } else {
                params.set(name, value);
            }
            return params.toString();
        },
        [searchParams]
    );

    const handleFilterChange = (name: string, value: string) => {
        const nextPath = `${pathname}?${createQueryString(name, value)}`;
        router.prefetch(nextPath);
        startTransition(() => {
            router.replace(nextPath);
        });
    };

    const currentYear = new Date().getFullYear();
    const years = [
        { name: "Năm", value: "all" },
        ...Array.from({ length: 25 }, (_, i) => ({
            name: `${currentYear - i}`,
            value: `${currentYear - i}`,
        })),
    ];

    // Ensure we have "All" option if provided list doesn't have it
    const displayCategories = [{ name: "Thể loại", slug: "all" }, ...categories];
    const displayCountries = [{ name: "Quốc gia", slug: "all" }, ...countries];

    return (
        <div>
            <div className="flex flex-nowrap items-center gap-1.5 sm:gap-3 py-2 overflow-x-auto no-scrollbar">
                {/* Category Dropdown */}
                <div className="relative group flex-1 min-w-[100px] sm:min-w-[120px]">
                    <select
                        onChange={(e) => handleFilterChange("category", e.target.value)}
                        className="appearance-none w-full bg-white/[0.05] border border-white/[0.08] text-white/70 py-1.5 px-2 sm:px-3 pr-6 sm:pr-8 rounded-[8px] leading-tight focus:outline-none focus:border-white/20 focus:text-white cursor-pointer text-[11px] sm:text-[13px] font-medium transition-all"
                        value={searchParams.get("category") || "all"}
                        disabled={isPending}
                    >
                        {displayCategories.map((c) => (
                            <option key={c.slug} value={c.slug} className="bg-[#0b0b10] text-white">
                                {c.name}
                            </option>
                        ))}
                    </select>
                    {/* Visual label overlay for mobile - shorter text */}
                    <div className="sm:hidden pointer-events-none absolute inset-y-0 left-2 flex items-center text-white/70 text-[11px] font-medium bg-[#0b0b10]/0 pr-1">
                        {searchParams.get("category") === null || searchParams.get("category") === "all" ? "T.Loại" : ""}
                    </div>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 sm:px-2 text-white/40 group-focus-within:text-white">
                        <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </div>
                </div>

                {/* Country Dropdown */}
                <div className="relative group flex-1 min-w-[100px] sm:min-w-[120px]">
                    <select
                        onChange={(e) => handleFilterChange("country", e.target.value)}
                        className="appearance-none w-full bg-white/[0.05] border border-white/[0.08] text-white/70 py-1.5 px-2 sm:px-3 pr-6 sm:pr-8 rounded-[8px] leading-tight focus:outline-none focus:border-white/20 focus:text-white cursor-pointer text-[11px] sm:text-[13px] font-medium transition-all"
                        value={searchParams.get("country") || "all"}
                        disabled={isPending}
                    >
                        {displayCountries.map((c) => (
                            <option key={c.slug} value={c.slug} className="bg-[#0b0b10] text-white">
                                {c.name}
                            </option>
                        ))}
                    </select>
                    {/* Visual label overlay for mobile - shorter text */}
                    <div className="sm:hidden pointer-events-none absolute inset-y-0 left-2 flex items-center text-white/70 text-[11px] font-medium bg-[#0b0b10]/0 pr-1">
                        {searchParams.get("country") === null || searchParams.get("country") === "all" ? "Q.Gia" : ""}
                    </div>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 sm:px-2 text-white/40 group-focus-within:text-white">
                        <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </div>
                </div>

                {/* Year Dropdown */}
                <div className="relative group flex-1 min-w-[80px] sm:min-w-[110px]">
                    <select
                        onChange={(e) => handleFilterChange("year", e.target.value)}
                        className="appearance-none w-full bg-white/[0.05] border border-white/[0.08] text-white/70 py-1.5 px-2 sm:px-3 pr-6 sm:pr-8 rounded-[8px] leading-tight focus:outline-none focus:border-white/20 focus:text-white cursor-pointer text-[11px] sm:text-[13px] font-medium transition-all"
                        value={searchParams.get("year") || "all"}
                        disabled={isPending}
                    >
                        {years.map((y) => (
                            <option key={y.value} value={y.value} className="bg-[#0b0b10] text-white">
                                {y.name}
                            </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 sm:px-2 text-white/40 group-focus-within:text-white">
                        <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </div>
                </div>
            </div>

            {isPending && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-2.5 md:gap-3 pt-1 [contain:layout_paint]">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="aspect-[2/3] rounded-lg bg-white/[0.06] border border-white/[0.06] animate-pulse" />
                    ))}
                </div>
            )}
        </div>
    );
}
