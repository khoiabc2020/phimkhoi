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
import { Star, Clock, Globe, Info, Users, PlayCircle, Calendar, List as ListIcon } from "lucide-react";
import { getWatchHistoryForEpisode } from "@/app/actions/watchHistory";
import { getMovieCast, getTMDBDataForCard } from "@/app/actions/tmdb";
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
        title: `Xem phim ${movie.name} - Tập ${currentEpisode?.name || episode} | MovieBox`,
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

    let session = null;
    let cast: any[] = [];

    try {
        const [sessionRes, castRes, tmdbRes] = await Promise.all([
            getServerSession(authOptions).catch(() => null),
            getMovieCast(movie.origin_name || movie.name, movie.year, movie.type === 'series' ? 'tv' : 'movie').catch(() => []),
            getTMDBDataForCard(movie.origin_name || movie.name, movie.year, movie.type === 'series' ? 'tv' : 'movie').catch(() => null)
        ]);
        session = sessionRes;
        cast = castRes || [];
        // Gắn vote_average từ TMDB vào movie object
        if (tmdbRes?.vote_average) {
            (movie as any).vote_average = tmdbRes.vote_average;
        }
    } catch (e) {
        console.error("Error fetching session or cast:", e);
    }

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
        // Duration phim (phút) — dùng để tính progress thực tế
        duration: movie.time ? parseInt(movie.time) || 90 : 90,
    };

    return (
        <div className="min-h-screen bg-[#080b12] text-gray-300" style={{ fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif" }}>

            {/* Cinematic ambient background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-gradient-radial from-[#1a1f35]/40 via-[#080b12] to-[#080b12]" />
            </div>

            {/* Main content */}
            <div className="relative z-10 pt-20 md:pt-24 pb-16">
                <div className="container mx-auto px-4 lg:px-10 max-w-[1600px]">

                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-6 font-medium tracking-wide">
                        <Link href="/" className="hover:text-yellow-400 transition-colors uppercase tracking-wider">Trang chủ</Link>
                        <span className="text-gray-700">/</span>
                        <Link href={`/phim/${movie.slug}`} className="hover:text-yellow-400 transition-colors uppercase tracking-wider line-clamp-1 max-w-[200px]">{movie.name}</Link>
                        <span className="text-gray-700">/</span>
                        <span className="text-yellow-400 uppercase tracking-wider">{displayEpisodeName(currentEpisode?.name || episode)}</span>
                    </div>

                    {/* Grid layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-10">

                        {/* ── Left Column (9 cols) ── */}
                        <div className="lg:col-span-9 space-y-6">

                            {/* Player & Episode List */}
                            <WatchContainer
                                movie={movie}
                                currentEpisode={currentEpisode}
                                episodes={episodes}
                                servers={servers}
                                initialProgress={initialProgress}
                                movieData={movieData}
                            />

                            {/* Movie Content */}
                            <div className="rounded-2xl border border-white/[0.06] overflow-hidden"
                                style={{ background: 'rgba(15,18,26,0.8)', backdropFilter: 'blur(20px)' }}>
                                <div className="px-6 pt-5 pb-4 border-b border-white/[0.06]">
                                    <h3 className="text-white font-semibold text-base flex items-center gap-2 uppercase tracking-wide">
                                        <Info className="w-4 h-4 text-yellow-400" /> Nội dung phim
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="shrink-0 w-28 md:w-36 aspect-[2/3] relative rounded-xl overflow-hidden shadow-xl ring-1 ring-white/10 hidden md:block">
                                            <Image
                                                src={getImageUrl(movie.poster_url || movie.thumb_url)}
                                                alt={movie.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line mb-4" style={{ lineHeight: 1.75 }}>
                                                {(movie.content || "").replace(/<[^>]*>/g, '')}
                                            </p>

                                            {cast.length > 0 && (
                                                <div>
                                                    <h4 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Diễn viên</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {cast.slice(0, 10).map((actor: any) => (
                                                            <span key={actor.id}
                                                                className="text-xs px-3 py-1 rounded-full text-gray-300 transition-colors cursor-default border border-white/[0.08] hover:border-white/20"
                                                                style={{ background: 'rgba(255,255,255,0.05)' }}>
                                                                {actor.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Info card (Moved from right sidebar) */}
                            <div className="rounded-2xl border border-white/[0.06] overflow-hidden"
                                style={{ background: 'rgba(15,18,26,0.8)', backdropFilter: 'blur(20px)' }}>
                                <div className="px-6 pt-5 pb-4 border-b border-white/[0.06]">
                                    <h3 className="text-white font-semibold text-base flex items-center gap-2 uppercase tracking-wide">
                                        <div className="w-1 h-4 rounded-full bg-blue-400" /> Thông tin phim
                                    </h3>
                                </div>
                                <div className="p-6 space-y-4 text-sm">
                                    {[
                                        { label: 'Năm', value: movie.year },
                                        { label: 'Chất lượng', value: movie.quality },
                                        { label: 'Thời lượng', value: movie.time || 'N/A' },
                                        { label: 'Ngôn ngữ', value: movie.lang || 'Vietsub' },
                                        { label: 'Quốc gia', value: movie.country?.[0]?.name },
                                    ].filter(i => i.value).map(item => (
                                        <div key={item.label} className="flex items-center justify-between">
                                            <span className="text-gray-500 text-xs font-medium">{item.label}</span>
                                            <span className="text-gray-200 text-xs font-medium px-3 py-1 rounded" style={{ background: 'rgba(255,255,255,0.06)' }}>{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Comments */}
                            <div className="rounded-2xl border border-white/[0.06] overflow-hidden"
                                style={{ background: 'rgba(15,18,26,0.8)', backdropFilter: 'blur(20px)' }}>
                                <div className="px-6 pt-5 pb-4 border-b border-white/[0.06]">
                                    <h3 className="text-white font-semibold text-base flex items-center gap-2 uppercase tracking-wide">
                                        <Users className="w-4 h-4 text-yellow-400" /> Bình luận
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <CommentSection movieId={movie._id} movieSlug={movie.slug} />
                                </div>
                            </div>
                        </div>

                        {/* ── Right Sidebar (3 cols) ── */}
                        <div className="lg:col-span-3 space-y-6">

                            {/* Related Movies - Glass card */}
                            {movie.category?.[0]?.slug && (
                                <div className="rounded-2xl border border-white/[0.06] overflow-hidden"
                                    style={{ background: 'rgba(15,18,26,0.85)', backdropFilter: 'blur(28px)' }}>
                                    <div className="px-5 pt-5 pb-4 border-b border-white/[0.06] flex items-center gap-2">
                                        <div className="w-1 h-4 rounded-full bg-yellow-400" />
                                        <h3 className="text-white font-semibold text-sm uppercase tracking-wide">Có thể bạn thích</h3>
                                    </div>
                                    <div className="p-4">
                                        <RelatedMovies categorySlug={movie.category[0].slug} currentMovieId={movie._id} mode="vertical" />
                                    </div>
                                </div>
                            )}



                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
