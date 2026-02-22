import MovieCard from "@/components/MovieCard";
import { getMovieDetail, getMoviesList } from "@/services/api";
import { Metadata } from "next";
import Link from "next/link";
import { Play, Heart, Share2, Star, Clock, Film } from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import { getImageUrl } from "@/lib/utils";
import CommentSection from "@/components/CommentSection";
import Image from "next/image";
import MovieTabs from "@/components/MovieTabs";
import MovieCast from "@/components/MovieCast";
import { searchTMDBMovie, getTMDBDetails, getTMDBImage } from "@/services/tmdb";
import { isFavorite } from "@/app/actions/favorites";
import { isInWatchlist } from "@/app/actions/watchlist";
import WatchlistButton from "@/components/WatchlistButton";
import AddToPlaylistButton from "@/components/AddToPlaylistButton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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



    // ... inside MovieDetailPage ...

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
            {/* Hero Backdrop - Blur Effect */}
            <div className="relative h-[60vh] w-full overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center scale-105 blur-sm opacity-50 transition-opacity duration-700"
                    style={{ backgroundImage: `url(${backdropUrl})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-[#0a0a0a]/40" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 md:px-8 -mt-80 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
                    {/* Left: Poster (Sticky) */}
                    <div className="block">
                        <div className="relative -mt-20 lg:mt-0 lg:sticky lg:top-24 mx-auto w-48 md:w-56 lg:w-full max-w-[260px] mb-6 lg:mb-0 z-20">
                            <div className="rounded-xl overflow-hidden shadow-2xl border border-white/10 aspect-[2/3] bg-black/50 relative group">
                                <Image
                                    src={posterUrl!}
                                    alt={movie?.name || "Movie Poster"}
                                    width={260}
                                    height={390}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    priority
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>
                        </div>
                    </div>

                    {/* Right: Info & Tabs */}
                    <div className="space-y-6">
                        {/* Header Info */}
                        <div className="space-y-3">
                            <h1 className="text-2xl md:text-4xl font-black text-white leading-tight drop-shadow-2xl">
                                {movie?.name}
                            </h1>
                            <h2 className="text-base md:text-xl text-yellow-500 font-medium tracking-wide drop-shadow-md">
                                {movie?.origin_name} ({movie?.year})
                            </h2>

                            {/* Metadata Tags */}
                            <div className="flex flex-wrap items-center gap-2 pt-2">
                                <span className="flex items-center gap-1 bg-yellow-500 text-black px-2.5 py-1 rounded font-bold text-xs shadow-lg shadow-yellow-500/20">
                                    <Star className="w-3 h-3 fill-black" /> {rating}
                                </span>
                                <span className="px-2.5 py-1 border border-white/10 rounded bg-white/5 backdrop-blur-md text-gray-200 text-xs font-medium">
                                    {movie?.quality || "HD"}
                                </span>
                                <span className="px-2.5 py-1 border border-white/10 rounded bg-white/5 backdrop-blur-md text-gray-200 text-xs font-medium flex items-center gap-1.5">
                                    <Clock className="w-3 h-3" />
                                    {movie?.time || "N/A"}
                                </span>
                                <span className="px-2.5 py-1 border border-white/10 rounded bg-white/5 backdrop-blur-md text-gray-200 text-xs font-medium flex items-center gap-1.5">
                                    <Film className="w-3 h-3" />
                                    {movie?.country?.[0]?.name || "N/A"}
                                </span>
                            </div>

                            {/* Categories */}
                            <div className="flex flex-wrap gap-2 pt-1">
                                {movie?.category?.map((c: any) => (
                                    <Link
                                        key={c.id}
                                        href={`/the-loai/${c.slug}`}
                                        className="text-[10px] uppercase font-bold text-gray-400 hover:text-white border border-white/10 hover:border-yellow-500 bg-white/5 px-3 py-1 rounded-full transition-all"
                                    >
                                        {c.name}
                                    </Link>
                                ))}
                            </div>

                            {/* Action Buttons (Compact) */}
                            <div className="flex flex-wrap items-center gap-3 pt-4">
                                {serverData.length > 0 && (
                                    <Link
                                        href={`/xem-phim/${movie?.slug}/${serverData[0].slug}`}
                                        className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-6 py-3 rounded-full font-bold text-base hover:brightness-110 hover:scale-105 transition-all shadow-[0_0_20px_rgba(234,179,8,0.4)]"
                                    >
                                        <Play className="w-4 h-4 fill-current" />
                                        Xem Ngay
                                    </Link>
                                )}
                                <div className="flex gap-2">
                                    {movie && (
                                        <>
                                            <FavoriteButton
                                                movieData={{
                                                    movieId: movie._id,
                                                    movieSlug: movie.slug,
                                                    movieName: movie.name,
                                                    movieOriginName: movie.origin_name || "",
                                                    moviePoster: movie.poster_url || movie.thumb_url,
                                                    movieYear: Number(movie.year) || new Date().getFullYear(),
                                                    movieQuality: movie.quality || "HD",
                                                    movieCategories: movie.category?.map((c: any) => c.name) || [],
                                                }}
                                                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10"
                                            />
                                            <WatchlistButton
                                                slug={movie.slug}
                                                initialInWatchlist={(await isInWatchlist(movie.slug)).isInWatchlist}
                                                className="w-10 h-10 rounded-full bg-white/5 hover:bg-only border border-white/10"
                                            />
                                            <AddToPlaylistButton
                                                movieData={{
                                                    movieId: movie._id,
                                                    movieSlug: movie.slug,
                                                    movieName: movie.name,
                                                    movieOriginName: movie.origin_name || "",
                                                    moviePoster: movie.poster_url || movie.thumb_url,
                                                    movieYear: Number(movie.year) || new Date().getFullYear(),
                                                    movieQuality: movie.quality || "HD",
                                                }}
                                                variant="icon"
                                                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 border border-white/10"
                                            />
                                        </>
                                    )}
                                    <button className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all group" title="Chia sẻ">
                                        <Share2 className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* TABS - Compact Margin */}
                        {/* TABS - Dynamic Content */}
                        <MovieTabs
                            movie={movie}
                            relatedMovies={relatedMovies}
                            episodes={episodes}
                            slug={slug}
                        />

                        {/* TMDB Cast */}
                        <MovieCast movieName={movie.name} originName={movie.origin_name} year={movie.year} />

                        {/* Comment Section */}
                        <div className="mt-8">
                            <CommentSection movieId={movie._id} movieSlug={movie.slug} />
                        </div>
                    </div>
                </div>
            </div>
        </main >
    );
}
