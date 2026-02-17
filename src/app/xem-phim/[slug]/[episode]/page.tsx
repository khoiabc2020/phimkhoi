import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getMovieDetail, Movie } from "@/services/api";
import { getImageUrl, cn } from "@/lib/utils";
import VideoPlayer from "@/components/VideoPlayer";
import CommentSection from "@/components/CommentSection";
import WatchEngagementBar from "@/components/WatchEngagementBar";
import WatchContainer from "@/components/WatchContainer";
import WatchEpisodeSection from "@/components/WatchEpisodeSection";
import { Star, Clock, Globe, Info, Users, PlayCircle, Calendar, List as ListIcon } from "lucide-react";
import { getWatchHistoryForEpisode } from "@/app/actions/watchHistory";
import { getMovieCast } from "@/app/actions/tmdb";
import RelatedMovies from "@/components/RelatedMovies";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

interface PageProps {
    params: Promise<{
        slug: string;
        episode: string;
    }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug, episode } = await params;
    const data = await getMovieDetail(slug);
    const movie = data?.movie;
    const currentEpisode = data?.episodes?.[0]?.server_data?.find(
        (ep: any) => ep.slug === episode
    );

    if (!movie) return { title: "Không tìm thấy phim" };

    return {
        title: `Xem phim ${movie.name} - Tập ${currentEpisode?.name || episode} | Khôi Phim`,
        description: `Xem phim ${movie.name} tập ${currentEpisode?.name || episode} vietsub thuyết minh mới nhất. ${movie.content?.substring(0, 150)}...`,
        openGraph: {
            images: [getImageUrl(movie.poster_url || movie.thumb_url)],
        },
    };
}

export default async function WatchPage({ params }: PageProps) {
    const { slug, episode } = await params;
    const data = await getMovieDetail(slug);

    if (!data?.movie) return notFound();

    const movie = data.movie as Movie;
    const servers = data.episodes || [];
    const episodes = servers[0]?.server_data || [];
    const currentEpisode = episodes.find((ep: any) => ep.slug === episode);

    const [session, cast] = await Promise.all([
        getServerSession(authOptions),
        getMovieCast(movie.origin_name || movie.name, movie.year, movie.type === 'series' ? 'tv' : 'movie')
    ]);

    let initialProgress = 0;
    if (session?.user?.id) {
        const historyResult = await getWatchHistoryForEpisode(movie._id, episode);
        if (historyResult.success && historyResult.data) {
            initialProgress = historyResult.data.progress || 0;
        }
    }

    const displayEpisodeName = (name: string) => name?.startsWith('Tập') ? name : `Tập ${name}`;

    const movieData = {
        movieId: movie._id,
        movieSlug: movie.slug,
        movieName: movie.name,
        movieOriginName: movie.origin_name || "",
        moviePoster: movie.poster_url || movie.thumb_url,
        episodeSlug: episode,
        episodeName: displayEpisodeName(currentEpisode?.name || episode),
    };

    return (
        <div className="min-h-screen bg-[#0f0f0f] text-gray-300 font-sans">
            {/* Darker Header Background for contrast */}
            <div className="bg-[#050505] pb-8 pt-20 md:pt-24 border-b border-white/5">
                <div className="container mx-auto px-4 lg:px-8">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500 mb-6 font-medium">
                        <Link href="/" className="hover:text-yellow-500 transition-colors uppercase tracking-wider">Trang chủ</Link>
                        <span>/</span>
                        <Link href={`/phim/${movie.slug}`} className="hover:text-yellow-500 transition-colors uppercase tracking-wider line-clamp-1">{movie.name}</Link>
                        <span>/</span>
                        <span className="text-white uppercase tracking-wider">{displayEpisodeName(currentEpisode?.name || episode)}</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Main Player Column (Left - 9 cols) */}
                        <div className="lg:col-span-9 space-y-6">

                            {/* Player & Engagement & Info */}
                            <WatchContainer
                                movie={movie}
                                currentEpisode={currentEpisode}
                                episodes={episodes}
                                initialProgress={initialProgress}
                                movieData={movieData}
                            />


                            {/* Episodes List - Priority */}
                            {servers.length > 0 && (
                                <div className="bg-[#1a1a1a] rounded-xl p-6 border border-white/5">
                                    <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2 uppercase tracking-wide border-b border-white/5 pb-2">
                                        <ListIcon className="w-4 h-4 text-yellow-500" /> Danh sách tập
                                    </h3>
                                    <WatchEpisodeSection
                                        movieSlug={movie.slug}
                                        movieName={movie.name}
                                        servers={servers}
                                        currentEpisodeSlug={episode}
                                    />
                                </div>
                            )}

                            {/* Movie Content / Info (Moved from Sidebar) */}
                            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-white/5">
                                <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2 uppercase tracking-wide border-b border-white/5 pb-2">
                                    <Info className="w-4 h-4 text-yellow-500" /> Nội dung phim
                                </h3>
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="shrink-0 w-32 md:w-40 aspect-[2/3] relative rounded-lg overflow-hidden shadow-lg hidden md:block">
                                        <Image
                                            src={getImageUrl(movie.poster_url || movie.thumb_url)}
                                            alt={movie.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-line mb-4">
                                            {(movie.content || "").replace(/<[^>]*>/g, '')}
                                        </div>

                                        {cast.length > 0 && (
                                            <div>
                                                <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-2 text-gray-400">Diễn viên</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {cast.slice(0, 10).map((actor: any) => (
                                                        <span key={actor.id} className="text-xs bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-gray-300 transition-colors cursor-default">
                                                            {actor.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Comments */}
                            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-white/5">
                                <h3 className="text-white font-bold text-base mb-6 flex items-center gap-2 uppercase tracking-wide border-b border-white/5 pb-2">
                                    <Users className="w-4 h-4 text-yellow-500" /> Bình luận
                                </h3>
                                <CommentSection movieId={movie._id} movieSlug={movie.slug} />
                            </div>
                        </div>

                        {/* Sidebar Column (Right - 3 cols) */}
                        <div className="lg:col-span-3 space-y-6">
                            {/* Related Movies (Moved Here) */}
                            {movie.category?.[0]?.slug && (
                                <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5">
                                    <h3 className="text-white font-bold text-base mb-4 px-2 border-l-4 border-yellow-500 uppercase">
                                        Có thể bạn thích
                                    </h3>
                                    <RelatedMovies categorySlug={movie.category[0].slug} currentMovieId={movie._id} mode="vertical" />
                                </div>
                            )}

                            {/* Trending Placeholder */}
                            <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5">
                                <h3 className="text-white font-bold text-base mb-4 px-2 border-l-4 border-red-500 uppercase">
                                    Top Thịnh Hành
                                </h3>
                                <div className="text-center text-gray-500 py-8 text-sm">
                                    Đang cập nhật...
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

