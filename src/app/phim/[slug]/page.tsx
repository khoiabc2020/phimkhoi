import dynamic from "next/dynamic";
import { getMovieDetail, getMoviesList } from "@/services/api";
import { Metadata } from "next";
import Link from "next/link";
import { Play, PlayCircle, Share2, Star, Clock, Film } from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import { getImageUrl } from "@/lib/utils";
import Image from "next/image";

const CommentSection = dynamic(() => import("@/components/CommentSection"), {
    ssr: true,
    loading: () => <div className="h-32 rounded-lg bg-white/5 animate-pulse" />,
});
import MovieTabs from "@/components/MovieTabs";
import MovieCast from "@/components/MovieCast";
import { searchTMDBMovie, getTMDBDetails, getTMDBImage } from "@/services/tmdb";
import { isFavorite } from "@/app/actions/favorites";
import { isInWatchlist } from "@/app/actions/watchlist";
import WatchlistButton from "@/components/WatchlistButton";
import ShareButton from "@/components/ShareButton";
import { getTMDBEpisodeImages, TMDBEpisodeMeta } from "@/app/actions/tmdb";

// Revalidate every 5 minutes (was 60s). ISR means first visitor triggers refresh, others get cache.
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const data = await getMovieDetail(slug);
    const movie: any = data?.movie;
    if (!movie) return { title: "Không tìm thấy phim - Khôi Phim" };

    // Giới hạn description để SEO tốt hơn
    const desc = movie.content ? movie.content.replace(/<[^>]+>/g, '').substring(0, 160) + '...' : `Xem phim ${movie.name} chất lượng cao tại MovieBox.`;
    const poster = getImageUrl(movie.poster_url || movie.thumb_url || "");
    const url = `https://khoiphim.io.vn/phim/${slug}`;

    return {
        title: `${movie.name || "Phim"} - Xem phim tại Khôi Phim`,
        description: desc,
        alternates: {
            canonical: url,
        },
        robots: {
            index: true,
            follow: true,
        },
        openGraph: {
            title: `${movie.name} | ${movie.origin_name}`,
            description: desc,
            url,
            images: [
                {
                    url: poster,
                    width: 800,
                    height: 1200,
                    alt: movie.name,
                }
            ],
            type: "video.movie",
        },
        twitter: {
            card: "summary_large_image",
            title: `${movie.name} | MovieBox`,
            description: desc,
            images: [poster],
        },
    };
}

export default async function MovieDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const data = await getMovieDetail(slug);

    if (!data) {
        return <div className="text-center py-20 text-white">Không tìm thấy phim</div>;
    }

    const { movie, episodes } = data as any;
    const serverData = episodes?.[0]?.server_data || [];

    // Xác định loại phim cho TMDB
    let type: 'movie' | 'tv' = 'movie';
    if (movie?.type === 'phim-bo' || movie?.type === 'tv-shows' || movie?.type === 'hoat-hinh') {
        type = 'tv';
    }

    // ==> TỐI ƯU: Fetch song song tất cả dữ liệu phụ (TMDB + Related + isFavorite + isInWatchlist)
    const [tmdbSearch, relatedMoviesRaw, isFavResult, isWatchlistResult, tmdbEpisodeImagesRes] = await Promise.allSettled([
        searchTMDBMovie(
            movie?.origin_name || movie?.name,
            movie?.year ? parseInt(movie.year.toString().split("-")[0]) : undefined,
            type,
            { originalName: movie?.origin_name, countrySlug: movie?.country?.[0]?.slug }
        ),
        movie?.category?.[0]?.slug
            ? getMoviesList('phim-moi-cap-nhat', { category: movie.category[0].slug, limit: 12 })
            : Promise.resolve(null),
        isFavorite(movie?._id),
        isInWatchlist(movie?.slug),
        getTMDBEpisodeImages(
            movie?.origin_name || movie?.name,
            movie?.year ? parseInt(movie.year.toString().split("-")[0]) : undefined,
            { originalName: movie?.origin_name, countrySlug: movie?.country?.[0]?.slug }
        ),
    ]);

    const tmdbSearchResult = tmdbSearch.status === 'fulfilled' ? tmdbSearch.value : null;
    const tmdbDetails = tmdbSearchResult ? await getTMDBDetails(tmdbSearchResult.id, type) : null;
    const relatedMovies = relatedMoviesRaw.status === 'fulfilled' && relatedMoviesRaw.value?.items
        ? relatedMoviesRaw.value.items.filter((m: { slug?: string }) => m.slug !== movie?.slug).slice(0, 8)
        : [];
    const { isFavorite: isFav } = isFavResult.status === 'fulfilled' ? isFavResult.value : { isFavorite: false };
    const inWatchlist = isWatchlistResult.status === 'fulfilled' ? isWatchlistResult.value.isInWatchlist : false;
    const episodeImageMap: Record<string, TMDBEpisodeMeta> = tmdbEpisodeImagesRes.status === "fulfilled" ? (tmdbEpisodeImagesRes.value || {}) : {};

    const extractEpisodeNumber = (value: string) => {
        const match = String(value || "").match(/(\d+)/);
        return match ? match[1] : null;
    };
    const buildEpisodeKeyCandidates = (ep: any, indexInServer: number): string[] => {
        const seen = new Set<string>();
        const pushKey = (raw: unknown) => {
            const val = String(raw ?? "").trim();
            if (!val || seen.has(val)) return;
            seen.add(val);
        };

        const fromName = extractEpisodeNumber(ep?.name);
        const fromSlug = extractEpisodeNumber(ep?.slug);
        const parsed = Number(fromName || fromSlug);

        if (fromName) pushKey(fromName);
        if (fromSlug) pushKey(fromSlug);
        if (Number.isFinite(parsed) && parsed > 0) {
            pushKey(String(parsed));
            pushKey(String(parsed).padStart(2, "0"));
            pushKey(String(parsed).padStart(3, "0"));
        }

        const byIndex = indexInServer + 1;
        pushKey(String(byIndex));
        pushKey(String(byIndex).padStart(2, "0"));

        return Array.from(seen);
    };

    const episodeThumbnails: Record<string, string> = {};
    const episodeMetadata: Record<string, TMDBEpisodeMeta> = {};
    (episodes || []).forEach((serverItem: any) => {
        (serverItem?.server_data || []).forEach((ep: any, indexInServer: number) => {
            if (!ep?.slug) return;
            const candidates = buildEpisodeKeyCandidates(ep, indexInServer);
            const matchedData = candidates
                .map((key) => episodeImageMap[key])
                .find(Boolean);

            if (matchedData?.image) {
                episodeThumbnails[ep.slug] = matchedData.image;
            }
            if (matchedData) {
                episodeMetadata[ep.slug] = matchedData;
            }
        });
    });

    // Prefer source poster (dọc). For backdrop hero, ưu tiên TMDB backdrop để tránh watermark từ nguồn phim.
    const sourceImage = getImageUrl(movie?.poster_url || movie?.thumb_url);
    const posterUrl = sourceImage;
    const tmdbBackdrop = tmdbDetails?.backdrop_path ? getTMDBImage(tmdbDetails.backdrop_path, "original") : "";
    const sourceBackdrop = movie?.thumb_url ? getImageUrl(movie.thumb_url) : "";
    const backdropUrl = tmdbBackdrop || sourceBackdrop || getImageUrl(movie?.poster_url || "");
    const rating = tmdbDetails?.vote_average ? tmdbDetails.vote_average.toFixed(1) : "9.7";

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": type === 'tv' ? "TVSeries" : "Movie",
        "name": movie?.name,
        "alternativeHeadline": movie?.origin_name,
        "image": posterUrl,
        "description": movie?.content?.replace(/<[^>]+>/g, ''),
        "dateCreated": movie?.year?.toString(),
        "director": {
            "@type": "Person",
            "name": movie?.director?.[0] || tmdbDetails?.credits?.crew?.find((c: any) => c.job === "Director")?.name || "Đang cập nhật"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": rating,
            "bestRating": "10",
            "ratingCount": "100"
        }
    };

    return (
        <main className="min-h-screen pb-20 bg-transparent">
            {/* JSON-LD for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {/* Hero Section (Onflix-like: backdrop 16:9 on right, left side darker) */}
            <div className="relative w-full pt-20 sm:pt-28 md:pt-32 pb-8 px-4 md:px-8 xl:px-16 flex items-end min-h-[500px] sm:min-h-[560px] overflow-hidden">
                {/* Base dark layer */}
                <div className="absolute inset-0 bg-[#050507]" />

                {/* Backdrop layer: full canvas, anchored right to keep subject in right half */}
                {backdropUrl && (
                    <div className="absolute inset-0">
                        <Image
                            src={backdropUrl}
                            alt={movie?.name || ""}
                            fill
                            priority
                            unoptimized
                            className="object-cover object-[68%_22%] opacity-[0.32] scale-[1.06] blur-2xl"
                            sizes="100vw"
                            placeholder="blur"
                            blurDataURL="data:image/webp;base64,UklGRmIAAABXRUJQVlA4IFYAAAAwAQCdASoIAAUAAUAmJaQAA3AA/vx5nAAA/uX3L5B5mR5s3h9n189o9D0Nnv/qJ/93sAf//1kP/+cIIf//2I//97kf///eP///zGf//42gAA=="
                        />
                        <Image
                            src={backdropUrl}
                            alt={movie?.name || ""}
                            fill
                            priority
                            unoptimized
                            className="object-cover object-[62%_20%] sm:object-contain sm:object-right opacity-[0.95]"
                            sizes="100vw"
                            placeholder="blur"
                            blurDataURL="data:image/webp;base64,UklGRmIAAABXRUJQVlA4IFYAAAAwAQCdASoIAAUAAUAmJaQAA3AA/vx5nAAA/uX3L5B5mR5s3h9n189o9D0Nnv/qJ/93sAf//1kP/+cIIf//2I//97kf///eP///zGf//42gAA=="
                        />
                    </div>
                )}

                {/* Softer cinematic feather blend: tránh đường chia cứng trái/phải */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#050507] via-[#050507]/94 via-[43%] to-[#050507]/20" />
                <div className="absolute inset-y-0 left-[34%] w-[38%] bg-gradient-to-r from-[#050507]/86 via-[#050507]/28 to-transparent blur-2xl" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050507]/96 via-[#050507]/44 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#050507]/36 via-transparent to-transparent" />

                {/* Hero Info Content aligned left/bottom */}
                <div className="relative z-10 w-full max-w-[1920px] mx-auto space-y-2 sm:space-y-4 max-w-[760px]">
                    <div className="flex items-center gap-2 mb-1">
                        {movie?.year && (
                            <span className="px-2.5 py-0.5 rounded border border-white/15 bg-white/[0.06] text-white/80 text-[11px] font-semibold leading-none">
                                {movie?.year}
                            </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded border border-[#F4C84A]/40 bg-[#F4C84A]/10 text-[#F4C84A] text-[11px] font-bold leading-none uppercase">
                            {movie?.quality || "FHD"}
                        </span>
                    </div>
                    <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-[1.14] tracking-[-0.012em] pt-1 drop-shadow-2xl">{movie?.name}</h1>
                    <h2 className="hidden sm:block text-base md:text-2xl text-gray-300 font-medium tracking-wide drop-shadow-md">{movie?.origin_name}</h2>

                    {(() => {
                        const epCurrent = movie?.episode_current || "";
                        const isCompleted = epCurrent.toLowerCase().includes("hoàn tất") || epCurrent.toLowerCase().includes("full");
                        const total = movie?.episode_total || "?";
                        // Extract episode number, removing "Tập " strings to avoid duplication
                        const epNum = epCurrent.replace(/hoàn tất/gi, "").replace(/\(.*?\)/g, "").replace(/tập\s*/gi, "").trim() || "1";
                        return (
                            <div className="flex items-center gap-2 font-bold text-sm mt-2 drop-shadow-md">
                                {isCompleted ? (
                                    <>
                                        <span className="inline-flex items-center gap-1.5 bg-green-500/20 text-green-400 border border-green-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                                            Hoàn Tất
                                        </span>
                                        <span className="text-gray-400 text-xs font-medium">{total} Tập</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="inline-flex items-center gap-1.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold">
                                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse inline-block" />
                                            Đang chiếu
                                        </span>
                                        <span className="text-gray-300 text-xs font-medium">Tập {epNum} / {total}</span>
                                    </>
                                )}
                            </div>
                        );
                    })()}

                    <div className="text-xs sm:text-sm text-gray-300 flex flex-wrap items-center gap-2 sm:gap-4 py-1 sm:py-2 drop-shadow-md">
                        {(movie?.director && movie.director.length > 0 && !movie.director.includes("Đang cập nhật")) || tmdbDetails?.credits?.crew?.find((c: { job?: string; name?: string }) => c.job === "Director") ? (
                            <span><span className="text-gray-500">Đạo diễn:</span> {movie?.director?.join(", ") || tmdbDetails?.credits?.crew?.find((c: { job?: string; name?: string }) => c.job === "Director")?.name}</span>
                        ) : null}
                        <span className="w-1 h-1 bg-gray-600 rounded-full hidden sm:block" />
                        <span><span className="text-gray-500">Thời lượng:</span> {movie?.time || "N/A"}</span>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-300 mb-3 sm:mb-6 line-clamp-2 max-w-3xl drop-shadow-md">
                        <span className="text-gray-500">Diễn viên:</span> {movie?.actor?.join(", ") || tmdbDetails?.credits?.cast?.slice(0, 5).map((c: { name?: string }) => c.name).join(", ") || "Đang cập nhật"}
                    </div>

                    {/* Action Buttons -- bigger touch targets on mobile */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2 sm:pt-4">
                        {serverData.length > 0 && (
                            <Link
                                href={`/xem-phim/${movie?.slug}/${serverData[0].slug}`}
                                className="flex items-center justify-center bg-[#F4C84A] text-black px-5 sm:px-6 py-2.5 rounded-full font-bold text-sm hover:brightness-110 hover:scale-105 transition-all"
                            >
                                CHIẾU PHÁT
                            </Link>
                        )}

                        {movie && (
                            <>
                                <FavoriteButton
                                    movieData={{
                                        movieId: movie._id,
                                        movieSlug: movie.slug,
                                        movieName: movie.name,
                                        movieOriginName: movie.origin_name || "",
                                        moviePoster: posterUrl || "/fallback.png",
                                        movieYear: Number(movie.year) || new Date().getFullYear(),
                                        movieQuality: movie.quality || "HD",
                                        movieCategories: movie.category?.map((c: { name?: string }) => c.name) || [],
                                    }}
                                    className="!bg-white/5 hover:!bg-white/10 text-gray-300 hover:text-white border border-white/5 rounded-full"
                                    showLabel={true}
                                />
                                <WatchlistButton
                                    slug={movie.slug}
                                    initialInWatchlist={inWatchlist}
                                    className="!bg-white/5 hover:!bg-white/10 text-gray-300 hover:text-white border border-white/5 rounded-full"
                                    showLabel={true}
                                />
                                <ShareButton title={`Xem phim ${movie.name} trên MovieBox`} />
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Content: responsive — stacked on mobile, 2-col on desktop */}
            <div className="max-w-[1920px] mx-auto px-4 md:px-8 xl:px-16 mt-6 sm:mt-10 lg:mt-12 relative z-10">
                {/* On mobile/tablet: RIGHT column (tabs) first, then sidebar info below */}
                <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">

                    {/* RIGHT COLUMN (shown first on mobile) */}
                    <div className="w-full lg:col-span-8 xl:col-span-9 order-1 lg:order-2">
                        <MovieTabs
                            movie={movie}
                            relatedMovies={relatedMovies}
                            episodes={episodes}
                            slug={slug}
                            tmdbDetails={tmdbDetails}
                            episodeThumbnails={episodeThumbnails}
                            episodeMetadata={episodeMetadata}
                        />
                        {/* Comment Section below tabs */}
                        <div className="mt-8 sm:mt-12">
                            <div className="flex items-center gap-2 mb-6 border-l-2 border-[#F4C84A] pl-3">
                                <h3 className="text-[15px] font-bold text-white uppercase tracking-widest">Bình luận</h3>
                            </div>
                            <CommentSection movieId={movie._id} movieSlug={movie.slug} />
                        </div>
                    </div>

                    {/* LEFT SIDEBAR (shown after tabs on mobile, beside on desktop) */}
                    <div className="w-full lg:col-span-4 xl:col-span-3 order-2 lg:order-1 space-y-6 sm:space-y-8 lg:pr-4">
                        <div className="rounded-[10px] border border-white/[0.06] bg-[#07070b]/78 p-4 sm:p-5 space-y-6 sm:space-y-8 shadow-[0_10px_24px_#00000066]">
                        {/* Nội dung */}
                        <div>
                            <div className="flex items-center gap-2 mb-3 sm:mb-4 border-l-2 border-[#F4C84A] pl-3">
                                <h3 className="text-[14px] sm:text-[15px] font-bold text-white uppercase tracking-widest">Nội dung</h3>
                            </div>
                            <div className="text-[13px] text-gray-400 leading-relaxed font-light text-justify line-clamp-6 sm:line-clamp-[12]" dangerouslySetInnerHTML={{ __html: movie?.content }} />
                        </div>

                        {/* Đạo diễn */}
                        <div>
                            <div className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-2">Đạo diễn</div>
                            <div className="text-[13px] font-bold text-white">{movie?.director?.join(", ") || "Đang cập nhật"}</div>
                        </div>

                        {/* Diễn viên */}
                        <div>
                            <div className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-3">Diễn viên</div>
                            <MovieCast movie={movie} slug={movie.slug} isCompact={true} />
                        </div>

                        {/* Thể loại */}
                        <div>
                            <div className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-3">Thể loại</div>
                            <div className="flex flex-wrap gap-2">
                                {movie?.category?.map((c: { slug?: string; name?: string; id?: string }) => (
                                    <Link key={c.id} href={`/the-loai/${c.slug}`} className="text-[11px] font-medium text-gray-300 bg-white/[0.08] border border-white/[0.14] py-1.5 px-3 rounded-full hover:text-white hover:border-[#F4C84A]/50 transition-colors uppercase tracking-wider">{c.name}</Link>
                                ))}
                            </div>
                        </div>

                        {/* Thông tin thêm */}
                        <div>
                            <div className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-3">Thông tin thêm</div>
                            <div className="space-y-2 text-[13px]">
                                <div className="flex justify-between border-b border-white/[0.08] pb-2"><span className="text-gray-400">Quốc gia:</span><span className="text-gray-200 font-medium">{movie?.country?.[0]?.name || "Đang cập nhật"}</span></div>
                                <div className="flex justify-between border-b border-white/[0.08] pb-2"><span className="text-gray-400">Năm:</span><span className="text-gray-200 font-medium">{movie?.year || "Đang cập nhật"}</span></div>
                                <div className="flex justify-between border-b border-white/[0.08] pb-2"><span className="text-gray-400">Chất lượng:</span><span className="text-gray-200 font-medium">{movie?.quality || "HD"}</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">Ngôn ngữ:</span><span className="text-gray-200 font-medium">{movie?.lang || "Đang cập nhật"}</span></div>
                            </div>
                        </div>
                        </div>
                    </div>

                </div>
            </div>
        </main >
    );
}
