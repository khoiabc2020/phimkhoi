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

// Revalidate every 5 minutes (was 60s). ISR means first visitor triggers refresh, others get cache.
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const data = await getMovieDetail(slug);
    const movie: any = data?.movie;
    if (!movie) return { title: "Không tìm thấy phim - Khôi Phim" };

    // Giới hạn description để SEO tốt hơn
    const desc = movie.content ? movie.content.replace(/<[^>]+>/g, '').substring(0, 160) + '...' : "";

    return {
        title: `${movie.name || "Phim"} - Xem phim tại Khôi Phim`,
        description: desc,
        openGraph: {
            title: `${movie.name} | ${movie.origin_name}`,
            description: desc,
            images: [
                {
                    url: movie.poster_url || movie.thumb_url || "",
                    width: 800,
                    height: 1200,
                    alt: movie.name,
                }
            ],
            type: "video.movie",
        },
        alternates: {
            canonical: `https://khoiphim.com/phim/${slug}`
        }
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
    const [tmdbSearch, relatedMoviesRaw, isFavResult, isWatchlistResult] = await Promise.allSettled([
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
    ]);

    const tmdbSearchResult = tmdbSearch.status === 'fulfilled' ? tmdbSearch.value : null;
    const tmdbDetails = tmdbSearchResult ? await getTMDBDetails(tmdbSearchResult.id, type) : null;
    const relatedMovies = relatedMoviesRaw.status === 'fulfilled' && relatedMoviesRaw.value?.items
        ? relatedMoviesRaw.value.items.filter((m: { slug?: string }) => m.slug !== movie?.slug).slice(0, 8)
        : [];
    const { isFavorite: isFav } = isFavResult.status === 'fulfilled' ? isFavResult.value : { isFavorite: false };
    const inWatchlist = isWatchlistResult.status === 'fulfilled' ? isWatchlistResult.value.isInWatchlist : false;

    // Always use source images (Ophim/KKPhim) for poster & backdrop — TMDB images may be wrong when the search fails
    const sourceImage = getImageUrl(movie?.poster_url || movie?.thumb_url);
    const posterUrl = sourceImage;
    const backdropUrl = getImageUrl(movie?.thumb_url || movie?.poster_url);
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
            {/* Hero Section (Backdrop + Info Overlay) */}
            <div className="relative w-full pt-20 sm:pt-28 md:pt-32 pb-8 px-4 md:px-8 xl:px-16 flex items-end min-h-[420px] sm:min-h-[500px]">
                {/* Backdrop ảnh — dùng Next/Image với priority=true để load sớm nhất + blur placeholder */}
                {backdropUrl && (
                    <Image
                        src={backdropUrl}
                        alt={movie?.name || ""}
                        fill
                        priority
                        unoptimized
                        className="absolute inset-0 object-cover object-top"
                        placeholder="blur"
                        blurDataURL="data:image/webp;base64,UklGRmIAAABXRUJQVlA4IFYAAAAwAQCdASoIAAUAAUAmJaQAA3AA/vx5nAAA/uX3L5B5mR5s3h9n189o9D0Nnv/qJ/93sAf//1kP/+cIIf//2I//97kf///eP///zGf//42gAA=="
                    />
                )}
                {/* Overlay đồng tông #020617 để hòa với nền toàn site, không chia cắt màu */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/85 to-[#020617]/30" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-[#020617]/60 to-transparent" />

                {/* Hero Info Content aligned left/bottom */}
                <div className="relative z-10 w-full max-w-[1600px] mx-auto space-y-2 sm:space-y-4">
                    <span className="inline-block bg-[#F4C84A] text-black px-2 py-0.5 text-[10px] font-bold rounded shadow-sm mb-1 uppercase">{movie?.quality || "FHD"} {movie?.year}</span>
                    <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-white leading-tight drop-shadow-2xl">{movie?.name}</h1>
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
            <div className="max-w-[1600px] mx-auto px-4 md:px-8 xl:px-16 mt-6 sm:mt-10 lg:mt-12 relative z-10">
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
                    <div className="w-full lg:col-span-4 xl:col-span-3 order-2 lg:order-1 space-y-6 sm:space-y-8 lg:pr-4 lg:border-r lg:border-white/[0.04]">
                        {/* Nội dung */}
                        <div>
                            <div className="flex items-center gap-2 mb-3 sm:mb-4 border-l-2 border-[#F4C84A] pl-3">
                                <h3 className="text-[14px] sm:text-[15px] font-bold text-white uppercase tracking-widest">Nội dung</h3>
                            </div>
                            <div className="text-[13px] text-gray-400 leading-relaxed font-light text-justify line-clamp-6 sm:line-clamp-[12]" dangerouslySetInnerHTML={{ __html: movie?.content }} />
                        </div>

                        {/* Đạo diễn */}
                        <div>
                            <div className="text-[11px] font-medium text-gray-500 uppercase tracking-widest mb-2">Đạo diễn</div>
                            <div className="text-[13px] font-bold text-white">{movie?.director?.join(", ") || "Đang cập nhật"}</div>
                        </div>

                        {/* Diễn viên */}
                        <div>
                            <div className="text-[11px] font-medium text-gray-500 uppercase tracking-widest mb-3">Diễn viên</div>
                            <MovieCast movie={movie} slug={movie.slug} isCompact={true} />
                        </div>

                        {/* Thể loại */}
                        <div>
                            <div className="text-[11px] font-medium text-gray-500 uppercase tracking-widest mb-3">Thể loại</div>
                            <div className="flex flex-wrap gap-2">
                                {movie?.category?.map((c: { slug?: string; name?: string; id?: string }) => (
                                    <Link key={c.id} href={`/the-loai/${c.slug}`} className="text-[11px] font-medium text-gray-400 bg-white/5 border border-white/5 py-1.5 px-3 rounded-full hover:text-white hover:border-[#F4C84A]/50 transition-colors uppercase tracking-wider">{c.name}</Link>
                                ))}
                            </div>
                        </div>

                        {/* Thông tin thêm */}
                        <div>
                            <div className="text-[11px] font-medium text-gray-500 uppercase tracking-widest mb-3">Thông tin thêm</div>
                            <div className="space-y-2 text-[13px]">
                                <div className="flex justify-between border-b border-white/[0.04] pb-2"><span className="text-gray-500">Quốc gia:</span><span className="text-gray-300 font-medium">{movie?.country?.[0]?.name || "Đang cập nhật"}</span></div>
                                <div className="flex justify-between border-b border-white/[0.04] pb-2"><span className="text-gray-500">Năm:</span><span className="text-gray-300 font-medium">{movie?.year || "Đang cập nhật"}</span></div>
                                <div className="flex justify-between border-b border-white/[0.04] pb-2"><span className="text-gray-500">Chất lượng:</span><span className="text-gray-300 font-medium">{movie?.quality || "HD"}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Ngôn ngữ:</span><span className="text-gray-300 font-medium">{movie?.lang || "Đang cập nhật"}</span></div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </main >
    );
}
