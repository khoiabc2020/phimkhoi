import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { SearchX, User } from "lucide-react";

import MovieCard from "@/components/MovieCard";
import FilterBar from "@/components/FilterBar";
import { getThemeBySlug } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { getMenuData, searchMovies } from "@/services/api";
import { searchTMDBPerson } from "@/services/tmdb";

export const metadata: Metadata = {
    title: "Tìm kiếm phim",
    description: "Tìm kiếm phim, diễn viên và nội dung tại KHOIPHIM.",
    robots: {
        index: false,
        follow: true,
    },
};

async function SearchResultsStream({
    keyword,
    category,
    country,
    year,
    type,
    limit,
}: {
    keyword: string;
    category?: string;
    country?: string;
    year?: string;
    type?: string;
    limit: number;
}) {
    const moviesCount = limit || 49;
    const [movies, actors] = await Promise.all([
        searchMovies(keyword, { enrichTMDB: false, limit: moviesCount * 2 }),
        keyword.length >= 3 ? searchTMDBPerson(keyword) : Promise.resolve([]),
    ]);

    const normalizeText = (value: string | undefined | null) =>
        String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, " ")
            .trim();

    const qualityRank = (quality: string | undefined | null) => {
        const q = normalizeText(quality);
        if (!q) return 0;
        if (q.includes("4k") || q.includes("uhd")) return 5;
        if (q.includes("full hd") || q.includes("fullhd") || q.includes("fhd")) return 4;
        if (q.includes("hd")) return 3;
        if (q.includes("sd")) return 2;
        if (q.includes("cam")) return 1;
        return 0;
    };

    const metadataScore = (movie: any) => {
        let score = 0;
        if (movie?.name) score += 2;
        if (movie?.origin_name) score += 2;
        if (movie?.thumb_url) score += 2;
        if (movie?.poster_url) score += 2;
        if (movie?.episode_current) score += 2;
        score += qualityRank(movie?.quality) * 2;
        return score;
    };

    const mergeArraysBySlug = (a: any[] = [], b: any[] = []) => {
        const merged = [...a, ...b];
        return Array.from(
            new Map(
                merged.map((item: any) => [normalizeText(item?.slug || item?.name || item?.id), item])
            ).values()
        ).filter(Boolean);
    };

    const mergeMovieData = (preferred: any, other: any) => ({
        ...other,
        ...preferred,
        category: mergeArraysBySlug(preferred?.category, other?.category),
        country: mergeArraysBySlug(preferred?.country, other?.country),
    });

    const dedupedMap = (movies || []).reduce((acc: Map<string, any>, movie: any) => {
        const titleYearKey = `${normalizeText(movie.name)}|${normalizeText(movie.origin_name)}|${movie.year || ""}`.replace(/\|+/g, "|");
        const current = acc.get(titleYearKey);
        if (!current) {
            acc.set(titleYearKey, movie);
            return acc;
        }

        const currentScore = metadataScore(current);
        const candidateScore = metadataScore(movie);
        acc.set(
            titleYearKey,
            mergeMovieData(
                candidateScore >= currentScore ? movie : current,
                candidateScore >= currentScore ? current : movie
            )
        );
        return acc;
    }, new Map<string, any>());

    const uniqueMovies = Array.from(dedupedMap.values());
    const filteredMovies = uniqueMovies.filter((movie: any) => {
        if (category && category !== "all" && !movie.category?.some((c: { slug: string }) => c.slug === category)) {
            return false;
        }
        if (country && country !== "all" && !movie.country?.some((c: { slug: string }) => c.slug === country)) {
            return false;
        }
        if (year && year !== "all" && Number(movie.year) !== parseInt(year, 10)) {
            return false;
        }
        if (type && type !== "all") {
            // "type" parameter mappings: "phim-le" -> "single", "phim-bo" -> "series", "hoat-hinh" -> hoathoanh/anime
            const movieType = String(movie.type || "").toLowerCase();
            if (type === "phim-le" && movieType !== "single") return false;
            if (type === "phim-bo" && movieType !== "series") return false;
            if (type === "hoat-hinh" && !movieType.includes("hoathoanh") && !movie.category?.some((c: any) => c.slug === "hoat-hinh")) return false;
            if (type === "tv-shows" && !movieType.includes("tvshows") && !movie.category?.some((c: any) => c.slug === "tv-shows")) return false;
        }
        return true;
    });

    const visibleActors = (actors || []).slice(0, 8);
    const visibleMovies = filteredMovies.slice(0, moviesCount);
    const hasActors = visibleActors.length > 0;
    const hasMovies = visibleMovies.length > 0;

    return (
        <div className="animate-in fade-in duration-500">
            <div className="mb-6">
                <p className="text-gray-400 text-sm">
                    Tìm thấy {filteredMovies.length} phim {hasActors && `và ${visibleActors.length} diễn viên`}
                </p>
                <div className="mt-3 flex items-center gap-2">
                    <span className="inline-flex items-center h-8 px-3 rounded-full bg-white/[0.08] border border-white/[0.10] text-white text-xs font-bold">
                        Phim ({filteredMovies.length})
                    </span>
                    {hasActors && (
                        <span className="inline-flex items-center h-8 px-3 rounded-full bg-[#0B0B10] border border-white/[0.08] text-gray-300 text-xs font-semibold">
                            Diễn viên ({visibleActors.length})
                        </span>
                    )}
                </div>
            </div>

            {hasActors && (
                <div className="mb-10">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="w-1 h-5 bg-[#8FA7C5] rounded-full" />
                        <h2 className="text-base font-bold text-white">Diễn viên / Đạo diễn</h2>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none">
                        {visibleActors.map((actor: any) => (
                            <Link
                                key={actor.id}
                                href={`/dien-vien/${actor.name.toLowerCase().replace(/ /g, "-")}`}
                                className="flex-shrink-0 flex flex-col items-center gap-2 group"
                            >
                                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-[#8FA7C5] transition-colors bg-white/5">
                                    {actor.profile_path ? (
                                        <img
                                            src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                                            alt={actor.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <User className="w-8 h-8 text-gray-500" />
                                        </div>
                                    )}
                                </div>
                                <div className="text-center max-w-[88px]">
                                    <p className="text-xs font-semibold text-white group-hover:text-[#c7d7ea] transition-colors truncate">
                                        {actor.name}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {hasMovies ? (
                <>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="w-1 h-5 bg-[#8FA7C5] rounded-full" />
                        <h2 className="text-base font-bold text-white">Phim kết quả</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4 [contain-intrinsic-size:0_500px] [content-visibility:auto]">
                        {visibleMovies.map((movie: any, idx: number) => (
                            <MovieCard
                                key={movie._id || movie.slug}
                                movie={movie}
                                priority={idx < 7}
                                loading={idx < 14 ? "eager" : "lazy"}
                            />
                        ))}
                    </div>
                </>
            ) : !hasActors ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                        <SearchX className="w-10 h-10 text-gray-500" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Không tìm thấy kết quả nào</h2>
                    <p className="text-gray-400 max-w-md mx-auto">
                        Hãy thử với từ khóa khác hoặc điều chỉnh bộ lọc.
                    </p>
                </div>
            ) : null}
        </div>
    );
}

const SearchSkeleton = ({ limit = 49 }: { limit?: number }) => (
    <div className="mt-8">
        <div className="h-4 w-48 bg-white/5 rounded animate-pulse mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4">
            {Array.from({ length: limit }).map((_, i) => (
                <div key={i} className="aspect-[2/3] rounded-lg bg-white/5 animate-pulse" />
            ))}
        </div>
    </div>
);

export default async function SearchPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; keyword?: string; category?: string; country?: string; year?: string; type?: string }>;
}) {
    const userAgent = (await headers()).get("user-agent") || "";
    const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
    const limit = isMobile ? 28 : 49;
    const theme = getThemeBySlug("tim-kiem");

    const sParams = await searchParams;
    const { q, keyword: k, category, country, year, type } = sParams;
    const keyword = (k || q || "").trim();

    const { categories, countries } = await getMenuData();
    const currentYear = new Date().getFullYear();
    const years = [
        ...Array.from({ length: 30 }, (_, i) => ({
            name: `${currentYear - i}`,
            slug: `${currentYear - i}`,
        })),
        { name: "2010s", slug: "2010" },
        { name: "2000s", slug: "2000" },
        { name: "1990s", slug: "1990" },
    ];
    
    const types = [
        { name: "Phim lẻ", slug: "phim-le" },
        { name: "Phim bộ", slug: "phim-bo" },
        { name: "Hoạt hình", slug: "hoat-hinh" },
        { name: "TV Shows", slug: "tv-shows" },
    ];

    return (
        <main className="min-h-screen pb-20 bg-[#0a0a0a] relative overflow-x-hidden overflow-y-visible">
            <div
                className={cn(
                    "absolute top-0 left-0 right-0 h-[600px] via-transparent to-transparent pointer-events-none -z-10 blur-[150px] opacity-50",
                    theme.glow
                )}
            />

            <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 md:px-8 lg:pl-24 lg:pr-12 pt-24">
                <div className="mb-6 rounded-[12px] border border-white/[0.06] bg-[#07070b]/78 backdrop-blur-md p-4 md:p-5 shadow-xl transition-all flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-[26px] md:text-[32px] font-outfit font-extrabold text-white tracking-tight leading-tight">
                            {keyword ? (
                                <>
                                    <span className="text-white/60 font-medium mr-2">Kết quả:</span>
                                    <span className="text-[#c7d7ea] truncate max-w-[200px] md:max-w-md">
                                        "{keyword}"
                                    </span>
                                </>
                            ) : (
                                "Tìm kiếm"
                            )}
                        </h1>
                        {!keyword && (
                            <p className="text-gray-400 text-sm">Nhập từ khóa để bắt đầu tìm phim.</p>
                        )}
                    </div>

                    <div className="w-full md:w-auto overflow-visible relative z-20">
                        <FilterBar categories={categories} countries={countries} years={years} types={types} hideType={false} />
                    </div>
                </div>

                {!keyword ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center opacity-40">
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                            <User className="w-10 h-10 text-gray-500" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Khám phá kho phim khổng lồ</h2>
                        <p className="text-gray-500 mt-2">Tìm theo tên phim, diễn viên hoặc đạo diễn</p>
                    </div>
                ) : (
                    <Suspense
                        key={`${keyword}-${category}-${country}-${year}-${type}`}
                        fallback={<SearchSkeleton limit={limit} />}
                    >
                        <SearchResultsStream
                            keyword={keyword}
                            category={category}
                            country={country}
                            year={year}
                            type={type}
                            limit={limit}
                        />
                    </Suspense>
                )}
            </div>
        </main>
    );
}
