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
import { Star, List, Info, Users, Clock, Globe } from "lucide-react";
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

    // Fetch extra data in parallel
    const [session, cast] = await Promise.all([
        getServerSession(authOptions),
        getMovieCast(movie.origin_name || movie.name, movie.year, movie.type === 'series' ? 'tv' : 'movie')
    ]);

    // History logic
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
        <div className="min-h-screen bg-[#0a0a0a] pt-16 md:pt-24 pb-12">
            <div className="container mx-auto px-0 md:px-8">
                {/* Breadcrumb - desktop only */}
                <div className="hidden md:flex items-center gap-2 text-sm text-gray-400 mb-6 px-4 md:px-0 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
                    <Link href="/" className="hover:text-[#fbbf24] transition-colors">Trang chủ</Link>
                    <span>/</span>
                    <Link href={`/phim/${movie.slug}`} className="hover:text-[#fbbf24] transition-colors">{movie.name}</Link>
                    <span>/</span>
                    <span className="text-white">{displayEpisodeName(currentEpisode?.name || episode)}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Main Content - RoPhim style layout */}
                    <div className="lg:col-span-3">
                        {/* Video Player - edge-to-edge on mobile */}
                        <div className="bg-black md:rounded-xl overflow-hidden shadow-2xl shadow-black/50 md:border md:border-white/5 aspect-video relative group z-20 mx-0 md:mx-0">
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
                                <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-white">
                                    <p>Tập phim không tồn tại hoặc đã bị xóa.</p>
                                </div>
                            )}
                        </div>

                        {/* Engagement Bar - RoPhim style */}
                        {currentEpisode && (
                            <WatchEngagementBar movie={movie} />
                        )}

                        {/* Episode Section - RoPhim style */}
                        {servers.length > 0 && (
                            <WatchEpisodeSection
                                movieSlug={movie.slug}
                                movieName={movie.name}
                                servers={servers}
                                currentEpisodeSlug={episode}
                            />
                        )}

                        {/* Title & Meta */}
                        <div className="px-4 md:px-0 mt-6">
                            <h1 className="text-lg md:text-xl font-bold text-white mb-1.5 leading-tight uppercase">
                                {movie.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mb-3">
                                <span>{movie.origin_name}</span>
                                <span>({movie.year})</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-[9px] font-bold tracking-wider uppercase">
                                <span className="bg-[#fbbf24] text-black px-1.5 py-0.5 rounded-[2px] flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-black" /> {movie.vote_average?.toFixed(1) || "N/A"}
                                </span>
                                <span className="bg-white/10 text-gray-300 px-1.5 py-0.5 rounded-[2px] border border-white/10">
                                    {movie.quality}
                                </span>
                                <span className="bg-white/10 text-gray-300 px-1.5 py-0.5 rounded-[2px] border border-white/10">
                                    {movie.country?.[0]?.name}
                                </span>
                                <span className="bg-white/10 text-gray-300 px-1.5 py-0.5 rounded-[2px] border border-white/10">
                                    {movie.time}
                                </span>
                                {currentEpisode && (
                                    <span className="bg-[#fbbf24]/10 text-[#fbbf24] px-1.5 py-0.5 rounded-[2px] border border-[#fbbf24]/20">
                                        {displayEpisodeName(currentEpisode.name || episode)}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Comments */}
                        <div className="mt-8 px-4 md:px-0">
                            <CommentSection movieId={movie._id} movieSlug={movie.slug} />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Info Card */}
                        <div className="bg-[#121212] rounded border border-white/5 overflow-hidden p-4">
                            <div className="relative aspect-[2/3] rounded overflow-hidden mb-3 shadow-lg">
                                <Image
                                    src={getImageUrl(movie.poster_url || movie.thumb_url)}
                                    alt={movie.name}
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute top-1.5 left-1.5 bg-[#fbbf24] text-black text-[9px] font-bold px-1.5 py-0.5 rounded-[2px] shadow-sm uppercase">
                                    {movie.quality}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2 text-[10px]">
                                    <div className="bg-[#1a1a1a] p-1.5 rounded text-center border border-white/5">
                                        <div className="flex items-center justify-center gap-1 text-[#fbbf24] font-bold text-xs mb-0.5">
                                            <Star className="w-2.5 h-2.5 fill-[#fbbf24]" /> {movie.vote_average?.toFixed(1) || 9.7}
                                        </div>
                                        <div className="text-gray-500 text-[9px] uppercase">Đánh giá</div>
                                    </div>
                                    <div className="bg-[#1a1a1a] p-1.5 rounded text-center border border-white/5">
                                        <div className="text-white font-bold text-xs mb-0.5">{movie.year}</div>
                                        <div className="text-gray-500 text-[9px] uppercase">Năm</div>
                                    </div>
                                </div>

                                <div className="space-y-1 text-[10px] pt-1">
                                    <div className="flex justify-between border-b border-white/5 pb-1">
                                        <span className="text-gray-500 flex items-center gap-1.5"><Clock className="w-2.5 h-2.5" /> Thời lượng</span>
                                        <span className="text-white">{movie.time}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 pb-1">
                                        <span className="text-gray-500 flex items-center gap-1.5"><Globe className="w-2.5 h-2.5" /> Quốc gia</span>
                                        <span className="text-white">{movie.country?.[0]?.name}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Cast Section */}
                        {cast.length > 0 && (
                            <div className="bg-[#121212] rounded border border-white/5 overflow-hidden">
                                <div className="px-3 py-2 border-b border-white/5">
                                    <h4 className="text-white font-bold text-[10px] flex items-center gap-1.5 uppercase tracking-wide">
                                        <Users className="w-3 h-3 text-[#fbbf24]" /> Diễn viên
                                    </h4>
                                </div>
                                <div className="p-2 grid grid-cols-4 gap-1.5">
                                    {cast.map((actor: any) => (
                                        <div key={actor.id} className="flex flex-col items-center text-center group cursor-pointer">
                                            <div className="w-8 h-8 relative rounded-full overflow-hidden mb-1 border border-transparent group-hover:border-[#fbbf24] transition-colors bg-[#1a1a1a]">
                                                {actor.profile_path ? (
                                                    <Image
                                                        src={actor.profile_path}
                                                        alt={actor.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-[8px]">IMG</div>
                                                )}
                                            </div>
                                            <div className="text-[9px] text-white group-hover:text-[#fbbf24] transition-colors line-clamp-1 w-full">{actor.name}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Synopsis */}
                        <div className="bg-[#121212] rounded border border-white/5 overflow-hidden">
                            <div className="px-3 py-2 border-b border-white/5">
                                <h4 className="text-white font-bold text-[10px] flex items-center gap-1.5 uppercase tracking-wide">
                                    <Info className="w-3 h-3 text-[#fbbf24]" /> Nội dung
                                </h4>
                            </div>
                            <div className="p-2.5 text-[10px] text-gray-400 leading-relaxed max-h-40 overflow-y-auto custom-scrollbar">
                                {(movie.content || "").replace(/<[^>]*>/g, '')}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
