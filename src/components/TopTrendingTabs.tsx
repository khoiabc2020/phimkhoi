"use client";

import { useMemo, useState } from "react";
import { Movie } from "@/services/api";
import TopTrending from "@/components/TopTrending";

interface TopTrendingTabsProps {
    allMovies: Movie[];
    weekMovies: Movie[];
    monthMovies: Movie[];
    tvMovies: Movie[];
    movieMovies: Movie[];
    className?: string;
}

type TabKey = "all" | "week" | "month" | "tv" | "movie";

const TAB_META: Record<TabKey, { label: string; title: string; slug: string }> = {
    all: { label: "Top ngày", title: "Top 10 hôm nay", slug: "/danh-sach/phim-moi" },
    week: { label: "Top tuần", title: "Top tuần nổi bật", slug: "/danh-sach/phim-moi" },
    month: { label: "Top tháng", title: "Top tháng tổng hợp", slug: "/danh-sach/phim-moi" },
    tv: { label: "Top bộ", title: "Top phim bộ", slug: "/danh-sach/phim-bo" },
    movie: { label: "Top lẻ", title: "Top phim lẻ", slug: "/danh-sach/phim-le" },
};

export default function TopTrendingTabs({
    allMovies,
    weekMovies,
    monthMovies,
    tvMovies,
    movieMovies,
    className,
}: TopTrendingTabsProps) {
    const [activeTab, setActiveTab] = useState<TabKey>("all");

    const dataByTab = useMemo(
        () => ({
            all: allMovies || [],
            week: weekMovies || [],
            month: monthMovies || [],
            tv: tvMovies || [],
            movie: movieMovies || [],
        }),
        [allMovies, weekMovies, monthMovies, tvMovies, movieMovies]
    );

    const tabData = dataByTab[activeTab];
    const { title, slug } = TAB_META[activeTab];

    return (
        <div className={className}>
            <div className="mb-3.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
                {(Object.keys(TAB_META) as TabKey[]).map((key) => {
                    const active = key === activeTab;
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setActiveTab(key)}
                            className={[
                                "h-9 px-3.5 rounded-[10px] text-[13px] md:text-sm font-semibold whitespace-nowrap transition-all border",
                                active
                                    ? "bg-[#11161d] text-[#d8e3f2] border-[#263243]"
                                    : "bg-[#0B0B10] text-white/72 border-white/[0.08] hover:text-white hover:border-white/[0.14]",
                            ].join(" ")}
                        >
                            {TAB_META[key].label}
                        </button>
                    );
                })}
            </div>

            <TopTrending title={title} movies={tabData} slug={slug} />
        </div>
    );
}
