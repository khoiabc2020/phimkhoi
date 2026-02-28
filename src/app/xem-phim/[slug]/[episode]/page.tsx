import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getMovieDetail, Movie } from "@/services/api";
import { getImageUrl, cn } from "@/lib/utils";
import CommentSection from "@/components/CommentSection";
import WatchEngagementBar from "@/components/WatchEngagementBar";
import WatchContainer from "@/components/WatchContainer";
import { Info, Users } from "lucide-react";
import { getWatchHistoryForEpisode } from "@/app/actions/watchHistory";
import { getMovieCast, getTMDBDataForCard } from "@/app/actions/tmdb";
import RelatedMovies from "@/components/RelatedMovies";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

interface PageProps {
    params: Promise<{ slug: string; episode: string }>;
    searchParams?: Promise<{ server?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
    const { slug, episode } = await params;
    const { server } = (await (searchParams || Promise.resolve({}))) as { server?: string };
    const data = await getMovieDetail(slug);
    const movie = data?.movie;
    const servers = data?.episodes || [];
    const serverIndex = server ? Number(server) || 0 : 0;
    const usedIndex = servers[serverIndex] ? serverIndex : 0;
    const episodes = servers[usedIndex]?.server_data || [];
    const currentEpisode = episodes.find((ep: any) => ep.slug === episode);
    if (!movie) return { title: "Không tìm thấy phim" };
    return {
        title: `Xem phim ${movie.name} - Tập ${currentEpisode?.name || episode} | MovieBox`,
        description: `Xem phim ${movie.name} tập ${currentEpisode?.name || episode} vietsub.`,
        openGraph: { images: [getImageUrl(movie.poster_url || movie.thumb_url)] },
    };
}

export default async function WatchPage({ params, searchParams }: PageProps) {
    const { slug, episode } = await params;
    const { server } = (await (searchParams || Promise.resolve({}))) as { server?: string };
    const data = await getMovieDetail(slug);
    if (!data?.movie) return notFound();

    const movie = data.movie as Movie;
    const servers = data.episodes || [];
    const serverIndex = server ? Number(server) || 0 : 0;
    const usedIndex = servers[serverIndex] ? serverIndex : 0;
    const episodes = servers[usedIndex]?.server_data || [];
    const currentEpisode = episodes.find((ep: any) => ep.slug === episode);

    let session = null;
    let cast: any[] = [];

    try {
        const [sessionRes, castRes, tmdbRes] = await Promise.all([
            getServerSession(authOptions).catch(() => null),
            getMovieCast(movie.origin_name || movie.name, movie.year, movie.type === "series" ? "tv" : "movie").catch(() => []),
            getTMDBDataForCard(movie.origin_name || movie.name, movie.year, movie.type === "series" ? "tv" : "movie").catch(() => null),
        ]);
        session = sessionRes;
        cast = castRes || [];
        if (tmdbRes?.vote_average) (movie as any).vote_average = tmdbRes.vote_average;
    } catch { }

    let initialProgress = 0;
    if (session?.user?.id) {
        const historyResult = await getWatchHistoryForEpisode(movie._id, episode);
        if (historyResult.success && historyResult.data) {
            initialProgress = historyResult.data.progress || 0;
        }
    }

    const displayEpisodeName = (name: string) => name?.startsWith("Tập") ? name : `Tập ${name}`;

    const movieData = {
        movieId: movie._id,
        movieSlug: movie.slug,
        movieName: movie.name,
        movieOriginName: movie.origin_name || "",
        moviePoster: movie.poster_url || movie.thumb_url,
        episodeSlug: episode,
        episodeName: displayEpisodeName(currentEpisode?.name || episode),
        duration: movie.time ? parseInt(movie.time) || 90 : 90,
    };

    return (
        <div className="min-h-screen bg-[#080b12] text-gray-300" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-gradient-radial from-[#1a1f35]/30 via-[#080b12] to-[#080b12]" />
            </div>

            <div className="relative z-10 pt-20 md:pt-24 pb-16">



                {/* ── CONTENT GRID (9+3) ── */}
                <div className="container mx-auto px-4 lg:px-8 max-w-[1600px]">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8">

                        {/* Left (9 cols) */}
                        <div className="lg:col-span-9 space-y-5">

                            {/* Breadcrumb */}
                            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium px-1">
                                <Link href="/" className="hover:text-yellow-400 transition-colors">Trang chủ</Link>
                                <span className="text-gray-700">/</span>
                                <Link href={`/phim/${movie.slug}`} className="hover:text-yellow-400 transition-colors truncate max-w-[180px]">{movie.name}</Link>
                                <span className="text-gray-700">/</span>
                                <span className="text-yellow-400">{displayEpisodeName(currentEpisode?.name || episode)}</span>
                            </div>

                            {/* Player */}
                            <WatchContainer
                                movie={movie}
                                currentEpisode={currentEpisode}
                                episodes={episodes}
                                servers={servers}
                                initialProgress={initialProgress}
                                movieData={movieData}
                                initialServerName={servers[usedIndex]?.server_name || servers[0]?.server_name || ""}
                            />


                            {/* Movie description */}
                            <div className="rounded-2xl border border-white/[0.06] overflow-hidden"
                                style={{ background: "rgba(15,18,26,0.8)", backdropFilter: "blur(20px)" }}>
                                <div className="px-5 pt-4 pb-3 border-b border-white/[0.06]">
                                    <h3 className="text-white font-semibold text-sm flex items-center gap-2 uppercase tracking-wide">
                                        <Info className="w-4 h-4 text-yellow-400" /> Nội dung phim
                                    </h3>
                                </div>
                                <div className="p-5">
                                    <div className="flex flex-col md:flex-row gap-5">
                                        <div className="shrink-0 w-24 md:w-28 aspect-[2/3] relative rounded-xl overflow-hidden shadow-xl ring-1 ring-white/10 hidden md:block">
                                            <Image src={getImageUrl(movie.poster_url || movie.thumb_url)} alt={movie.name} fill className="object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-gray-400 text-sm leading-relaxed mb-4" style={{ lineHeight: 1.75 }}>
                                                {(movie.content || "").replace(/<[^>]*>/g, "")}
                                            </p>
                                            {/* Metadata pills */}
                                            <div className="flex flex-wrap gap-2 mb-3 text-xs">
                                                {[
                                                    { label: "Năm", value: movie.year },
                                                    { label: "Chất lượng", value: movie.quality },
                                                    { label: "Thời lượng", value: movie.time },
                                                    { label: "Ngôn ngữ", value: movie.lang || "Vietsub" },
                                                ].filter((i) => i.value).map((item) => (
                                                    <span key={item.label} className="px-2.5 py-1 rounded-full text-gray-300 border border-white/[0.08]"
                                                        style={{ background: "rgba(255,255,255,0.05)" }}>
                                                        <span className="text-gray-500">{item.label}: </span>{item.value}
                                                    </span>
                                                ))}
                                            </div>
                                            {cast.length > 0 && (
                                                <div>
                                                    <h4 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Diễn viên</h4>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {cast.slice(0, 10).map((actor: any) => (
                                                            <span key={actor.id}
                                                                className="text-xs px-2.5 py-1 rounded-full text-gray-300 border border-white/[0.08]"
                                                                style={{ background: "rgba(255,255,255,0.05)" }}>
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

                            {/* Comments */}
                            <div className="rounded-2xl border border-white/[0.06] overflow-hidden"
                                style={{ background: "rgba(15,18,26,0.8)", backdropFilter: "blur(20px)" }}>
                                <div className="px-5 pt-4 pb-3 border-b border-white/[0.06]">
                                    <h3 className="text-white font-semibold text-sm flex items-center gap-2 uppercase tracking-wide">
                                        <Users className="w-4 h-4 text-yellow-400" /> Bình luận
                                    </h3>
                                </div>
                                <div className="p-5">
                                    <CommentSection movieId={movie._id} movieSlug={movie.slug} />
                                </div>
                            </div>
                        </div>

                        {/* Right Sidebar (3 cols) */}
                        <div className="lg:col-span-3 space-y-5">
                            {/* Genre pills */}
                            {movie.category && movie.category.length > 0 && (
                                <div className="rounded-2xl border border-white/[0.06] overflow-hidden"
                                    style={{ background: "rgba(15,18,26,0.85)", backdropFilter: "blur(28px)" }}>
                                    <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
                                        <h3 className="text-white font-semibold text-xs uppercase tracking-wider">Thể loại</h3>
                                    </div>
                                    <div className="p-4 flex flex-wrap gap-2">
                                        {movie.category.map((c: any) => (
                                            <Link key={c.id} href={`/the-loai/${c.slug}`}
                                                className="text-xs px-3 py-1.5 rounded-full text-gray-300 border border-white/[0.08] hover:border-yellow-400/40 hover:text-yellow-300 transition-colors"
                                                style={{ background: "rgba(255,255,255,0.05)" }}>
                                                {c.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Related movies */}
                            {movie.category?.[0]?.slug && (
                                <div className="rounded-2xl border border-white/[0.06] overflow-hidden"
                                    style={{ background: "rgba(15,18,26,0.85)", backdropFilter: "blur(28px)" }}>
                                    <div className="px-4 pt-4 pb-3 border-b border-white/[0.06] flex items-center gap-2">
                                        <div className="w-1 h-4 rounded-full bg-yellow-400" />
                                        <h3 className="text-white font-semibold text-xs uppercase tracking-wider">Phim Hot</h3>
                                    </div>
                                    <div className="p-3">
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
