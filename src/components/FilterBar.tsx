"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import EliteSelect from "./EliteSelect";

export default function FilterBar({ 
    categories = [], 
    countries = [],
    hideCategory = false,
    hideCountry = false
}: { 
    categories?: { name: string; slug: string }[]; 
    countries?: { name: string; slug: string }[]; 
    hideCategory?: boolean;
    hideCountry?: boolean;
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
        ...Array.from({ length: 25 }, (_, i) => ({
            name: `${currentYear - i}`,
            slug: `${currentYear - i}`,
        })),
        { name: "2010s", slug: "2010" },
        { name: "2000s", slug: "2000" },
        { name: "1990s", slug: "1990" },
    ];

    // Ensure we have "All" option if provided list doesn't have it
    const displayCategories = [{ name: "Tất cả thể loại", slug: "all" }, ...categories];
    const displayCountries = [{ name: "Tất cả quốc gia", slug: "all" }, ...countries];
    const displayYears = [{ name: "Tất cả năm", slug: "all" }, ...years];

    return (
        <div>
            <div className="flex flex-nowrap items-center gap-2 sm:gap-3 py-2 overflow-x-auto no-scrollbar">
                {/* Category Dropdown */}
                {!hideCategory && (
                    <EliteSelect 
                        options={displayCategories}
                        value={searchParams.get("category") || "all"}
                        onChange={(val) => handleFilterChange("category", val)}
                        placeholder="Thể loại"
                        disabled={isPending}
                    />
                )}

                {/* Country Dropdown */}
                {!hideCountry && (
                    <EliteSelect 
                        options={displayCountries}
                        value={searchParams.get("country") || "all"}
                        onChange={(val) => handleFilterChange("country", val)}
                        placeholder="Quốc gia"
                        disabled={isPending}
                    />
                )}

                {/* Year Dropdown */}
                <EliteSelect 
                    options={displayYears}
                    value={searchParams.get("year") || "all"}
                    onChange={(val) => handleFilterChange("year", val)}
                    placeholder="Năm"
                    disabled={isPending}
                />
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
