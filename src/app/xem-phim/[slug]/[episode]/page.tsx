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
import WatchEpisodeSection from "@/components/WatchEpisodeSection";
import { Star, Clock, Globe, Info, Users, PlayCircle, Calendar, List as ListIcon } from "lucide-react";
import { getWatchHistoryForEpisode } from "@/app/actions/watchHistory";
import { getMovieCast } from "@/app/actions/tmdb";
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
                            {/* Video Player Container */}
                            <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 group">
                                {currentEpisode ? (
                                    <VideoPlayer
                                        url={currentEpisode.link_embed}
                                        m3u8={currentEpisode.link_m3u8}
                                        slug={movie.slug}
                                        episode={displayEpisodeName(currentEpisode.name || episode)}
                                        movieData={movieData}
                                        initialProgress={initialProgress}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-white flex-col gap-2">
                                        <Info className="w-8 h-8 text-gray-500" />
                                        <p className="text-gray-400">Tập phim không khả dụng.</p>
                                    </div>
                                )}
                            </div>

                            {/* Mobile Info (Visible only on small screens) */}
                            <div className="lg:hidden">
                                <h1 className="text-xl font-bold text-white mb-1">{movie.name}</h1>
                                <p className="text-sm text-gray-500 mb-3">{movie.origin_name}</p>
                            </div>

                            {/* Engagement & Controls */}
                            <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5">
                                {currentEpisode && (
                                    <WatchEngagementBar movie={movie} />
                                )}
                            </div>

                            {/* Episodes List */}
                            {servers.length > 0 && (
                                <div className="bg-[#1a1a1a] rounded-xl p-6 border border-white/5">
                                    <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2 uppercase tracking-wide">
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

                            {/* Comments */}
                            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-white/5 mt-8">
                                <h3 className="text-white font-bold text-base mb-6 flex items-center gap-2 uppercase tracking-wide">
                                    <Users className="w-4 h-4 text-yellow-500" /> Bình luận
                                </h3>
                                <CommentSection movieId={movie._id} movieSlug={movie.slug} />
                            </div>
                        </div>

                        {/* Sidebar Column (Right - 3 cols) */}
                        <div className="lg:col-span-3 space-y-6">
                            {/* Movie Info Card */}
                            <div className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-white/5 sticky top-24">
                                <div className="relative aspect-[2/3] w-full">
                                    <Image
                                        src={getImageUrl(movie.poster_url || movie.thumb_url)}
                                        alt={movie.name}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, 300px"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

                                    <div className="absolute bottom-0 left-0 right-0 p-4">
                                        <h2 className="text-white font-bold text-lg leading-tight mb-1">{movie.name}</h2>
                                        <p className="text-gray-400 text-xs mb-3 line-clamp-1">{movie.origin_name}</p>

                                        <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                                            <span className="bg-yellow-500 text-black px-2 py-0.5 rounded-sm">
                                                IMDb {movie.vote_average?.toFixed(1) || 8.5}
                                            </span>
                                            <span className="bg-white/20 text-white px-2 py-0.5 rounded-sm backdrop-blur-sm">
                                                {movie.quality}
                                            </span>
                                            <span className="bg-white/20 text-white px-2 py-0.5 rounded-sm backdrop-blur-sm">
                                                {movie.year}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 space-y-4">
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-gray-500 flex items-center gap-1.5"><Clock className="w-3 h-3 text-yellow-500" /> Thời lượng</span>
                                            <span className="text-gray-300 font-medium">{movie.time}</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-gray-500 flex items-center gap-1.5"><Globe className="w-3 h-3 text-yellow-500" /> Quốc gia</span>
                                            <span className="text-gray-300 font-medium">{movie.country?.[0]?.name}</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-gray-500 flex items-center gap-1.5"><Calendar className="w-3 h-3 text-yellow-500" /> Năm phát hành</span>
                                            <span className="text-gray-300 font-medium">{movie.year}</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-gray-500 flex items-center gap-1.5"><PlayCircle className="w-3 h-3 text-yellow-500" /> Trạng thái</span>
                                            <span className="text-green-500 font-medium">{movie.status === 'completed' ? 'Hoàn thành' : 'Đang chiếu'}</span>
                                        </div>
                                    </div>

                                    <div className="border-t border-white/5 pt-4">
                                        <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                                            <Info className="w-3 h-3 text-yellow-500" /> Nội dung
                                        </h4>
                                        <p className="text-xs text-gray-400 leading-relaxed line-clamp-[8] hover:line-clamp-none transition-all cursor-pointer">
                                            {(movie.content || "").replace(/<[^>]*>/g, '')}
                                        </p>
                                    </div>

                                    {cast.length > 0 && (
                                        <div className="border-t border-white/5 pt-4">
                                            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <Users className="w-3 h-3 text-yellow-500" /> Diễn viên
                                            </h4>
                                            <div className="grid grid-cols-4 gap-2">
                                                {cast.slice(0, 8).map((actor: any) => (
                                                    <div key={actor.id} className="text-center group" title={actor.name}>
                                                        <div className="relative aspect-square rounded-full overflow-hidden border border-white/10 group-hover:border-yellow-500 transition-colors">
                                                            {actor.profile_path ? (
                                                                <Image src={actor.profile_path} alt={actor.name} fill className="object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-[8px] text-gray-500">N/A</div>
                                                            )}
                                                        </div>
                                                        <p className="text-[9px] text-gray-400 mt-1 line-clamp-1 group-hover:text-yellow-500 transition-colors">{actor.name}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
