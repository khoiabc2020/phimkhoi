"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import EliteSelect from "./EliteSelect";

type FilterOption = { name: string; slug: string };

export default function FilterBar({
    categories = [],
    countries = [],
    hideCategory = false,
    hideCountry = false,
    years = [],
}: {
    categories?: FilterOption[];
    countries?: FilterOption[];
    years?: FilterOption[];
    hideCategory?: boolean;
    hideCountry?: boolean;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            params.delete("page");

            if (!value || value === "all") {
                params.delete(name);
            } else {
                params.set(name, value);
            }

            return params.toString();
        },
        [searchParams]
    );

    const handleFilterChange = useCallback(
        (name: string, value: string) => {
            const nextQuery = createQueryString(name, value);
            const nextPath = nextQuery ? `${pathname}?${nextQuery}` : pathname;

            router.prefetch(nextPath);
            startTransition(() => {
                router.replace(nextPath, { scroll: false });
            });
        },
        [createQueryString, pathname, router]
    );

    const currentYear = new Date().getFullYear();
    const defaultYears: FilterOption[] = [
        ...Array.from({ length: 25 }, (_, i) => ({
            name: `${currentYear - i}`,
            slug: `${currentYear - i}`,
        })),
        { name: "2010s", slug: "2010" },
        { name: "2000s", slug: "2000" },
        { name: "1990s", slug: "1990" },
    ];

    const displayCategories = [{ name: "Tất cả thể loại", slug: "all" }, ...categories];
    const displayCountries = [{ name: "Tất cả quốc gia", slug: "all" }, ...countries];
    const displayYears = [{ name: "Tất cả năm", slug: "all" }, ...(years.length > 0 ? years : defaultYears)];

    return (
        <div>
            <div className="flex flex-nowrap items-center gap-2 sm:gap-3 py-2 overflow-x-auto no-scrollbar">
                {!hideCategory && (
                    <EliteSelect
                        options={displayCategories}
                        value={searchParams.get("category") || "all"}
                        onChange={(value) => handleFilterChange("category", value)}
                        placeholder="Thể loại"
                        disabled={isPending}
                    />
                )}

                {!hideCountry && (
                    <EliteSelect
                        options={displayCountries}
                        value={searchParams.get("country") || "all"}
                        onChange={(value) => handleFilterChange("country", value)}
                        placeholder="Quốc gia"
                        disabled={isPending}
                    />
                )}

                <EliteSelect
                    options={displayYears}
                    value={searchParams.get("year") || "all"}
                    onChange={(value) => handleFilterChange("year", value)}
                    placeholder="Năm"
                    disabled={isPending}
                />
            </div>

            {isPending && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-2.5 md:gap-3 pt-1 [contain:layout_paint]">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div
                            key={i}
                            className="aspect-[2/3] rounded-lg bg-white/[0.06] border border-white/[0.06] animate-pulse"
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
