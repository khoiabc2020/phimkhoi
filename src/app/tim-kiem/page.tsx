import MovieCard from "@/components/MovieCard";
import FilterBar from "@/components/FilterBar";
import { searchMovies } from "@/services/api";
import { searchTMDBPerson } from "@/services/tmdb";
import { SearchX, User } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Tìm kiếm phim",
    description: "Tìm kiếm phim, diễn viên và nội dung tại KHOIPHIM.",
    robots: {
        index: false,
        follow: true,
    },
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q: string; category?: string; country?: string; year?: string }> }) {
    const { q, category, country, year } = await searchParams;
    const keyword = (q || "").trim();

    if (!keyword) {
        return (
            <main className="min-h-screen pb-20">
                <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 md:px-8 pt-24">
                    <div className="mb-6 rounded-[10px] border border-white/[0.05] bg-[#09090c]/55 px-3 sm:px-4 py-3 sm:py-4">
                        <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                            <span className="w-1 h-5 bg-[#8fa7c5] rounded-full"></span>
                            Tìm kiếm
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">
                            Nhập từ khóa để bắt đầu tìm phim.
                        </p>
                        <div className="mt-4">
                            <FilterBar />
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    // Fetch movies + actors concurrently (giới hạn kết quả để nhanh hơn trên mobile)
    const [movies, actors] = await Promise.all([
        searchMovies(keyword, { enrichTMDB: false, limit: 10 }),
        keyword.length >= 3 ? searchTMDBPerson(keyword) : Promise.resolve([])
    ]);

    const normalizeText = (value: string | undefined | null) =>
        String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, " ")
            .trim();

    const imageSignature = (value: string | undefined | null) => {
        const raw = String(value || "").trim().toLowerCase();
        if (!raw) return "";
        const noQuery = raw.split("?")[0];
        const file = noQuery.split("/").pop() || "";
        return file.replace(/\.(jpg|jpeg|png|webp|avif)$/i, "");
    };

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
        if (movie?.episode_total) score += 1;
        if (movie?.year) score += 1;
        if (Array.isArray(movie?.category) && movie.category.length > 0) score += 2;
        if (Array.isArray(movie?.country) && movie.country.length > 0) score += 2;
        if (Array.isArray(movie?.actor) && movie.actor.length > 0) score += 1;
        if (Array.isArray(movie?.director) && movie.director.length > 0) score += 1;
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
        name: preferred?.name || other?.name,
        origin_name: preferred?.origin_name || other?.origin_name,
        slug: preferred?.slug || other?.slug,
        _id: preferred?._id || other?._id,
        poster_url: preferred?.poster_url || other?.poster_url,
        thumb_url: preferred?.thumb_url || other?.thumb_url,
        episode_current: preferred?.episode_current || other?.episode_current,
        episode_total: preferred?.episode_total || other?.episode_total,
        quality: preferred?.quality || other?.quality,
        year: preferred?.year || other?.year,
        category: mergeArraysBySlug(preferred?.category, other?.category),
        country: mergeArraysBySlug(preferred?.country, other?.country),
        actor: Array.from(new Set([...(preferred?.actor || []), ...(other?.actor || [])])),
        director: Array.from(new Set([...(preferred?.director || []), ...(other?.director || [])])),
    });

    // Deduplicate aggressively across mixed providers (same movie can have different slug/_id/quality)
    const dedupedMap = (movies || []).reduce((acc: Map<string, any>, movie: any) => {
        const slugKey = normalizeText(movie.slug);
        const nameKey = normalizeText(movie.name);
        const originKey = normalizeText(movie.origin_name);
        const yearKey = String(movie.year || "");
        const posterKey = imageSignature(movie.poster_url || movie.thumb_url);

        // Prefer identity by title + year; quality/source-specific slug should not create duplicates.
        const titleYearKey = `${nameKey}|${originKey}|${yearKey}`.replace(/\|+/g, "|");
        const dedupeKey = titleYearKey !== "||"
            ? titleYearKey
            : (posterKey ? `${nameKey}|${yearKey}|${posterKey}` : slugKey || `${nameKey}|${yearKey}`);

        const current = acc.get(dedupeKey);
        if (!current) {
            acc.set(dedupeKey, movie);
            return acc;
        }

        // Keep richer, higher-quality metadata when duplicates exist
        const currentScore = metadataScore(current);
        const candidateScore = metadataScore(movie);
        const preferred = candidateScore >= currentScore ? movie : current;
        const secondary = candidateScore >= currentScore ? current : movie;
        acc.set(dedupeKey, mergeMovieData(preferred, secondary));
        return acc;
    }, new Map<string, any>());

    const uniqueMovies = Array.from(dedupedMap.values());

    // Client-side filtering because search API doesn't support complex filters
    const filteredMovies = uniqueMovies.filter((movie: any) => {
        if (category && category !== "all") {
            const hasCategory = movie.category?.some((c: { slug: string }) => c.slug === category);
            if (!hasCategory) return false;
        }
        if (country && country !== "all") {
            const hasCountry = movie.country?.some((c: { slug: string }) => c.slug === country);
            if (!hasCountry) return false;
        }
        if (year && year !== "all") {
            if (Number(movie.year) !== parseInt(year, 10)) return false;
        }
        return true;
    });

    const visibleActors = (actors || []).slice(0, 8);
    const visibleMovies = filteredMovies.slice(0, 54);

    const hasActors = visibleActors.length > 0;
    const hasMovies = visibleMovies.length > 0;

    return (
        <main className="min-h-screen pb-20">
            <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 md:px-8 pt-24">
                <div className="mb-5 rounded-[10px] border border-white/[0.06] bg-[#07070b]/78 px-3 sm:px-4 py-3 sm:py-3.5 shadow-[0_8px_20px_#00000055]">
                    <h1 className="text-[20px] md:text-[26px] font-extrabold text-white flex items-center gap-2 tracking-tight">
                        <span className="w-1 h-5 bg-[#8fa7c5] rounded-full"></span>
                        Kết quả: <span className="text-[#c7d7ea] truncate max-w-[200px] md:max-w-md">"{keyword}"</span>
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Tìm thấy {filteredMovies.length} phim {hasActors && `và ${visibleActors.length} diễn viên`}
                        {uniqueMovies.length !== filteredMovies.length && ` (từ ${uniqueMovies.length} phim gốc)`}
                        {filteredMovies.length > visibleMovies.length && ` · hiển thị ${visibleMovies.length} kết quả đầu để tải nhanh`}
                    </p>

                    <div className="mt-3 flex items-center gap-2">
                        <span className="inline-flex items-center h-8 px-3 rounded-full bg-white/[0.08] border border-white/[0.10] text-white text-xs font-bold">
                            Phim ({filteredMovies.length})
                        </span>
                        <span className="inline-flex items-center h-8 px-3 rounded-full bg-[#0B0B10] border border-white/[0.08] text-gray-300 text-xs font-semibold">
                            Diễn viên ({visibleActors.length})
                        </span>
                    </div>

                    {/* Add Filter Bar */}
                    <div className="mt-2">
                        <FilterBar />
                    </div>
                </div>

                {/* Actor Results Section */}
                {hasActors && (
                    <div className="mb-10">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-1 h-5 bg-[#8fa7c5] rounded-full"></span>
                            <h2 className="text-base font-bold text-white">Diễn viên / Đạo diễn</h2>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none">
                            {visibleActors.map((actor: any) => {
                                const profileImg = actor.profile_path
                                    ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                                    : null;
                                const actorName = actor.name;

                                return (
                                    <Link
                                        key={actor.id}
                                        href={`/dien-vien/${encodeURIComponent(actorName)}`}
                                        className="flex-shrink-0 flex flex-col items-center gap-2 group"
                                    >
                                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-[#8fa7c5] transition-colors bg-white/5">
                                            {profileImg ? (
                                                <img
                                                    src={profileImg}
                                                    alt={actorName}
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
                                                {actorName}
                                            </p>
                                            {actor.known_for_department && (
                                                <p className="text-[10px] text-gray-500 mt-0.5">
                                                    {actor.known_for_department === 'Acting' ? 'Diễn viên' : actor.known_for_department}
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Movie Results */}
                {hasMovies ? (
                    <>
                        {hasActors && (
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-1 h-5 bg-[#8fa7c5] rounded-full"></span>
                                <h2 className="text-base font-bold text-white">Phim</h2>
                            </div>
                        )}
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2 sm:gap-2.5 md:gap-3 [contain:layout_paint]">
                            {visibleMovies.map((movie: any) => (
                                <MovieCard key={movie._id || movie.slug} movie={movie} />
                            ))}
                        </div>
                    </>
                ) : !hasActors ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                            <SearchX className="w-10 h-10 text-gray-500" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Không tìm thấy phim này</h2>
                        <p className="text-gray-400 max-w-md mx-auto">
                            Rất tiếc, chúng tôi không tìm thấy kết quả nào phù hợp với từ khóa <span className="text-[#c7d7ea]">"{keyword}"</span>
                            {(category || country || year) && " và bộ lọc hiện tại"}.
                        </p>
                        <p className="text-gray-500 text-sm mt-4">
                            Hãy thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc.
                        </p>
                    </div>
                ) : null}
            </div>
        </main>
    );
}
