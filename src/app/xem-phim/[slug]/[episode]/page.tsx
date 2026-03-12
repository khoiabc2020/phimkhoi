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
import { getMovieCast, getTMDBDataForCard, getTMDBEpisodeImages, TMDBEpisodeMeta } from "@/app/actions/tmdb";
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
    const movie = data?.movie as any;
    const servers = data?.episodes || [];
    const serverIndex = server ? Number(server) || 0 : 0;
    const usedIndex = servers[serverIndex] ? serverIndex : 0;
    const episodes = servers[usedIndex]?.server_data || [];
    const currentEpisode = episodes.find((ep: { slug: string }) => ep.slug === episode);
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
    const currentEpisode = episodes.find((ep: { slug: string }) => ep.slug === episode);

    let session = null;
    let cast: Record<string, unknown>[] = [];
    let episodeThumbnails: Record<string, string> = {};
    let episodeMetadata: Record<string, TMDBEpisodeMeta> = {};

    try {
        const [sessionRes, castRes, tmdbRes, tmdbEpisodeImages] = await Promise.all([
            getServerSession(authOptions).catch((): any => null),
            getMovieCast(movie.origin_name || movie.name, movie.year, movie.type === "series" ? "tv" : "movie").catch((): any[] => []),
            getTMDBDataForCard(movie.origin_name || movie.name, movie.year, movie.type === "series" ? "tv" : "movie").catch((): any => null),
            getTMDBEpisodeImages(movie.origin_name || movie.name, movie.year, { originalName: movie.origin_name, countrySlug: movie.country?.[0]?.slug }).catch((): any => ({})),
        ]);
        session = sessionRes;
        cast = castRes || [];
        if (tmdbRes?.vote_average) (movie as any).vote_average = tmdbRes.vote_average;
        const episodeImageMap: Record<string, TMDBEpisodeMeta> = tmdbEpisodeImages || {};

        // Map image by episode number to each source episode slug.
        // Some providers use "01" while TMDB returns "1", so normalize both forms.
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

            // Fallback by index for sources with non-standard labels
            const byIndex = indexInServer + 1;
            pushKey(String(byIndex));
            pushKey(String(byIndex).padStart(2, "0"));

            return Array.from(seen);
        };
        episodeThumbnails = {};
        (servers || []).forEach((serverItem: any) => {
            (serverItem?.server_data || []).forEach((ep: any, indexInServer: number) => {
                const candidates = buildEpisodeKeyCandidates(ep, indexInServer);
                const matchedData = candidates
                    .map((key) => episodeImageMap[key])
                    .find(Boolean);

                if (matchedData?.image && ep?.slug) {
                    episodeThumbnails[ep.slug] = matchedData.image;
                }
                if (matchedData && ep?.slug) {
                    episodeMetadata[ep.slug] = matchedData;
                }
            });
        });
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

            <div className="relative z-10 pt-14 md:pt-16 pb-16">



                {/* ── CONTENT GRID (9+3) ── */}
                <div className="w-full max-w-[1920px] mx-auto px-4 lg:px-8 max-w-[1920px]">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8">

                        {/* Left (9 cols) */}
                        <div className="lg:col-span-9 space-y-5">

                            {/* Player */}
                            <WatchContainer
                                movie={movie}
                                currentEpisode={currentEpisode}
                                episodes={episodes}
                                servers={servers}
                                episodeThumbnails={episodeThumbnails}
                                episodeMetadata={episodeMetadata}
                                initialProgress={initialProgress}
                                movieData={movieData}
                                initialServerName={servers[usedIndex]?.server_name || servers[0]?.server_name || ""}
                            />


                            {/* Movie description */}
                            <div className="rounded-lg border border-white/[0.08] overflow-hidden bg-[#11131A]">
                                <div className="px-6 pt-5 pb-4 border-b border-white/[0.04]">
                                    <h3 className="text-white font-bold text-[15px] flex items-center gap-2 tracking-wide">
                                        <Info className="w-4 h-4 text-[#F4C84A]" /> Thông tin mở rộng
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="shrink-0 w-24 md:w-32 aspect-[2/3] relative rounded-lg overflow-hidden shadow-xl ring-1 ring-white/10 hidden md:block">
                                            <Image src={getImageUrl(movie.poster_url || movie.thumb_url)} alt={movie.name} fill className="object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-gray-300 text-sm leading-relaxed mb-4" style={{ lineHeight: 1.75 }}>
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
                                                    <span key={item.label} className="px-2.5 py-1 rounded-full text-gray-200 border border-white/[0.10]"
                                                        style={{ background: "rgba(255,255,255,0.06)" }}>
                                                        <span className="text-gray-400">{item.label}: </span>{item.value}
                                                    </span>
                                                ))}
                                            </div>
                                            {cast.length > 0 && (
                                                <div>
                                                    <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Diễn viên</h4>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {cast.slice(0, 10).map((actor: any) => (
                                                            <span key={actor.id}
                                                                className="text-xs px-2.5 py-1 rounded-full text-gray-200 border border-white/[0.10]"
                                                                style={{ background: "rgba(255,255,255,0.06)" }}>
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
                            <div className="rounded-lg border border-white/[0.08] overflow-hidden bg-[#11131A]">
                                <div className="px-6 pt-5 pb-4 border-b border-white/[0.04]">
                                    <h3 className="text-white font-bold text-[15px] flex items-center gap-2 tracking-wide">
                                        <Users className="w-4 h-4 text-[#F4C84A]" /> Bình luận
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <CommentSection movieId={movie._id} movieSlug={movie.slug} episodeName={movieData.episodeName} />
                                </div>
                            </div>
                        </div>

                        {/* Right Sidebar (3 cols) */}
                        <div className="lg:col-span-3 space-y-5">
                            {/* Genre pills */}
                            {movie.category && movie.category.length > 0 && (
                                <div className="rounded-lg border border-white/[0.08] overflow-hidden bg-[#11131A]">
                                    <div className="px-5 pt-5 pb-4 border-b border-white/[0.04]">
                                        <h3 className="text-white font-bold text-[15px] tracking-wide">Thể loại</h3>
                                    </div>
                                    <div className="p-5 flex flex-wrap gap-2">
                                        {movie.category.map((c: { id: React.Key | null | undefined; slug: string; name: string }) => (
                                            <Link key={c.id} href={`/the-loai/${c.slug}`}
                                                className="text-xs px-3 py-1.5 rounded-full text-gray-200 border border-white/[0.10] hover:border-yellow-400/40 hover:text-yellow-300 transition-colors"
                                                style={{ background: "rgba(255,255,255,0.06)" }}>
                                                {c.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Related movies */}
                            {movie.category?.[0]?.slug && (
                                <div className="rounded-lg border border-white/[0.08] overflow-hidden bg-[#11131A]">
                                    <div className="px-5 pt-5 pb-4 border-b border-white/[0.04] flex items-center gap-2">
                                        <div className="w-1.5 h-4 rounded-full bg-[#F4C84A]" />
                                        <h3 className="text-white font-bold text-[15px] tracking-wide">Phim đề xuất</h3>
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
