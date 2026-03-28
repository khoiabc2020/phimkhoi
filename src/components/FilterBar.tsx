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
    hideType = true,
    years = [],
    types = [],
}: {
    categories?: FilterOption[];
    countries?: FilterOption[];
    years?: FilterOption[];
    types?: FilterOption[];
    hideCategory?: boolean;
    hideCountry?: boolean;
    hideType?: boolean;
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
    const displayTypes = [{ name: "Loại phim", slug: "all" }, ...types];

    return (
        <div>
            <div className="no-scrollbar flex flex-nowrap items-center gap-2 overflow-x-auto py-2 sm:gap-3">
                {!hideType && displayTypes.length > 1 && (
                    <EliteSelect
                        options={displayTypes}
                        value={searchParams.get("type") || "all"}
                        onChange={(value) => handleFilterChange("type", value)}
                        placeholder="Định dạng"
                        disabled={isPending}
                    />
                )}
                
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
                <div className="grid grid-cols-3 gap-2 pt-1 sm:grid-cols-4 sm:gap-2.5 md:grid-cols-5 md:gap-3 lg:grid-cols-6 [contain:layout_paint]">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div
                            key={i}
                            className="aspect-[2/3] animate-pulse rounded-lg border border-white/[0.06] bg-white/[0.06]"
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
