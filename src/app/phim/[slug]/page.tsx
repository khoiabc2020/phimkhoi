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
    loading: () => <div className="h-32 rounded-xl bg-white/5 animate-pulse" />,
});
import MovieTabs from "@/components/MovieTabs";
import MovieCast from "@/components/MovieCast";
import { searchTMDBMovie, getTMDBDetails, getTMDBImage } from "@/services/tmdb";
import { isFavorite } from "@/app/actions/favorites";
import { isInWatchlist } from "@/app/actions/watchlist";
import WatchlistButton from "@/components/WatchlistButton";

// Revalidate every 60 seconds for real-time TMDB rating updates
export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const data = await getMovieDetail(slug);
    if (!data || !data.movie) return { title: "Không tìm thấy phim - Khôi Phim" };
    return {
        title: `${data.movie?.name || "Phim"} - Xem phim tại Khôi Phim`,
        description: data.movie?.content || "",
        openGraph: {
            images: [data.movie?.poster_url || ""],
        },
    };
}

export default async function MovieDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const data = await getMovieDetail(slug);

    if (!data) {
        return <div className="text-center py-20 text-white">Không tìm thấy phim</div>;
    }

    const { movie, episodes } = data;
    const serverData = episodes?.[0]?.server_data || [];

    // Fetch related movies
    let relatedMovies: any[] = [];
    if (movie?.category?.[0]?.slug) {
        try {
            const res = await getMoviesList('phim-moi-cap-nhat', { category: movie.category[0].slug, limit: 12 });
            relatedMovies = res?.items?.filter((m: any) => m.slug !== movie.slug).slice(0, 8) || [];
        } catch (e) {
            console.error("Error fetching related movies:", e);
        }
    }

    // Fetch TMDB Data
    let type: 'movie' | 'tv' = 'movie';
    if (movie.type === 'phim-bo' || movie.type === 'tv-shows' || movie.type === 'hoat-hinh') {
        type = 'tv';
    }

    const tmdbSearch = await searchTMDBMovie(movie.origin_name || movie.name, movie.year, type);
    const tmdbDetails = tmdbSearch ? await getTMDBDetails(tmdbSearch.id, type) : null;
    const { isFavorite: isFav } = await isFavorite(movie._id);

    // Fallback images and rating
    const posterUrl = tmdbDetails?.poster_path ? getTMDBImage(tmdbDetails.poster_path, "original") : getImageUrl(movie?.poster_url || movie?.thumb_url);
    const backdropUrl = tmdbDetails?.backdrop_path ? getTMDBImage(tmdbDetails.backdrop_path, "original") : getImageUrl(movie?.poster_url || movie?.thumb_url);
    const rating = tmdbDetails?.vote_average ? tmdbDetails.vote_average.toFixed(1) : "9.7";

    return (
        <main className="min-h-screen pb-20 bg-[#0a0a0a]">
            {/* Hero Section (Backdrop + Info Overlay) */}
            <div className="relative w-full pt-20 sm:pt-28 md:pt-32 pb-8 px-4 md:px-8 xl:px-16 flex items-end min-h-[420px] sm:min-h-[500px]">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-top"
                    style={{ backgroundImage: `url(${backdropUrl})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-[#0a0a0a]/20" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent" />

                {/* Hero Info Content aligned left/bottom */}
                <div className="relative z-10 w-full max-w-[1600px] mx-auto space-y-2 sm:space-y-4">
                    <span className="inline-block bg-[#F4C84A] text-black px-2 py-0.5 text-[10px] font-bold rounded shadow-sm mb-1 uppercase">{movie?.quality || "FHD"} {movie?.year}</span>
                    <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-white leading-tight drop-shadow-2xl">{movie?.name}</h1>
                    <h2 className="hidden sm:block text-base md:text-2xl text-gray-300 font-medium tracking-wide drop-shadow-md">{movie?.origin_name}</h2>

                    <div className="flex items-center gap-2 text-yellow-500 font-bold text-sm mt-2 drop-shadow-md">
                        <PlayCircle className="w-4 h-4 fill-current" />
                        Đang chiếu tập {movie?.episode_current || "1"} / {movie?.episode_total || "?"}
                    </div>

                    <div className="text-xs sm:text-sm text-gray-300 flex flex-wrap items-center gap-2 sm:gap-4 py-1 sm:py-2 drop-shadow-md">
                        <span><span className="text-gray-500">Đạo diễn:</span> {movie?.director?.join(", ") || "Đang cập nhật"}</span>
                        <span className="w-1 h-1 bg-gray-600 rounded-full hidden sm:block" />
                        <span><span className="text-gray-500">Thời lượng:</span> {movie?.time || "N/A"}</span>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-300 mb-3 sm:mb-6 line-clamp-2 max-w-3xl drop-shadow-md">
                        <span className="text-gray-500">Diễn viên:</span> {movie?.actor?.join(", ") || "Đang cập nhật"}
                    </div>

                    {/* Action Buttons -- bigger touch targets on mobile */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2 sm:pt-4">
                        {serverData.length > 0 && (
                            <Link
                                href={`/xem-phim/${movie?.slug}/${serverData[0].slug}`}
                                className="flex items-center gap-2 bg-[#F4C84A] text-black px-5 sm:px-6 py-2.5 rounded-full font-bold text-sm hover:brightness-110 hover:scale-105 transition-all shadow-[0_4px_14px_0_rgba(244,200,74,0.39)]"
                            >
                                <Play className="w-4 h-4 fill-current" />
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
                                        movieCategories: movie.category?.map((c: any) => c.name) || [],
                                    }}
                                    className="!bg-white/5 hover:!bg-white/10 text-gray-300 hover:text-white border border-white/5 rounded-full"
                                    showLabel={true}
                                />
                                <WatchlistButton
                                    slug={movie.slug}
                                    initialInWatchlist={(await isInWatchlist(movie.slug)).isInWatchlist}
                                    className="!bg-white/5 hover:!bg-white/10 text-gray-300 hover:text-white border border-white/5 rounded-full"
                                    showLabel={true}
                                />
                                <button className="hidden sm:flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-medium text-sm transition-all border border-white/5 group">
                                    <Share2 className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors shrink-0" />
                                    <span>Chia sẻ</span>
                                </button>
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
                            <MovieCast movieName={movie.name} originName={movie.origin_name} year={movie.year} isCompact={true} />
                        </div>

                        {/* Thể loại */}
                        <div>
                            <div className="text-[11px] font-medium text-gray-500 uppercase tracking-widest mb-3">Thể loại</div>
                            <div className="flex flex-wrap gap-2">
                                {movie?.category?.map((c: any) => (
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
