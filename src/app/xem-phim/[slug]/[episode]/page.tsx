import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getMovieDetail, Movie } from "@/services/api";
import { getMovieDetailFromCache, saveMovieToCache } from "@/lib/movie-cache";
import { getImageUrl, cn } from "@/lib/utils";
import CommentSection from "@/components/CommentSection";
import WatchEngagementBar from "@/components/WatchEngagementBar";
import WatchContainer from "@/components/WatchContainer";
import { Info } from "lucide-react";
import { getMovieCast, getTMDBDataForCard, getTMDBEpisodeImages, TMDBEpisodeMeta } from "@/app/actions/tmdb";
import RelatedMovies from "@/components/RelatedMovies";
import { getThemeBySlug } from "@/lib/theme";
import MovieCastSection from "@/components/MovieCastSection";

export const revalidate = 300;

interface PageProps {
    params: Promise<{ slug: string; episode: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug, episode } = await params;
    // [Elite Performance] Try cache first
    const cached = await getMovieDetailFromCache(slug);
    const data = cached || await getMovieDetail(slug);
    const movie = data?.movie as any;
    const servers = data?.episodes || [];
    let currentEpisode = null;
    for (const srv of servers) {
        const found = srv.server_data?.find((ep: { slug: string }) => ep.slug === episode);
        if (found) {
            currentEpisode = found;
            break;
        }
    }
    if (!movie) return { title: "Không tìm thấy phim" };
    return {
        title: `Xem phim ${movie.name} - Tập ${currentEpisode?.name || episode} | KHOIPHIM`,
        description: `Xem phim ${movie.name} tập ${currentEpisode?.name || episode} vietsub.`,
        alternates: {
            canonical: `https://khoiphim.org/phim/${slug}`,
        },
        robots: {
            index: false,
            follow: true,
        },
        openGraph: { images: [getImageUrl(movie.poster_url || movie.thumb_url)] },
    };
}

export default async function WatchPage({ params }: PageProps) {
    const { slug, episode } = await params;
    // [Elite Performance] Optimistic detail load for player
    const cached = await getMovieDetailFromCache(slug);
    const data = cached || await getMovieDetail(slug);
    if (!data?.movie) return notFound();

    // Background optimization: Cache full details if this was an external hit
    if (!cached && data.movie) {
        saveMovieToCache(slug, data).catch(() => {});
    }

    const movie = data.movie as Movie;
    const servers = data.episodes || [];
    let currentEpisode: any = null;
    let usedServerName = "";
    let usedEpisodes: any[] = [];
    
    // [Elite Matching] 1. Exact slug match
    for (const srv of servers) {
        const found = srv.server_data?.find((ep: { slug: string }) => ep.slug === episode);
        if (found) {
            currentEpisode = found;
            usedServerName = srv.server_name;
            usedEpisodes = srv.server_data || [];
            break;
        }
    }

    // [Elite Matching] 2. Fallback for common mismatches like 'full' vs 'tap-1'
    if (!currentEpisode && servers.length > 0) {
        const firstServer = servers?.[0];
        const firstEp = firstServer?.server_data?.[0];
        if (firstEp) {
            // Use it as fallback but keep requested slug for URL consistency
            currentEpisode = firstEp;
            usedServerName = firstServer.server_name;
            usedEpisodes = firstServer.server_data;
        }
    }

    // [Elite Performance] Moving heavy TMDB/Cast lookups to their own components or async blocks
    // This allows the shell and core player to render immediately.
    const firstCategory = movie.category?.[0]?.slug || 'all';
    const theme = getThemeBySlug(firstCategory);
    const displayEpisodeName = (name: string) => name?.startsWith("Tập") ? name : `Tập ${name}`;

    // [Elite Performance] placeholders for now (non-blocking)
    const movieData = {
        movieId: movie._id,
        movieSlug: movie.slug,
        movieName: movie.name,
        movieOriginName: movie.origin_name || "",
        moviePoster: movie.poster_url || movie.thumb_url,
        movieThumb: movie.thumb_url || movie.poster_url,
        episodeSlug: episode,
        episodeName: displayEpisodeName(currentEpisode?.name || episode),
        duration: movie.time ? parseInt(movie.time) || 90 : 90,
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-300 relative overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className={cn("absolute top-0 left-0 right-0 h-[800px] via-black/80 to-transparent blur-[150px] opacity-40", theme.glow)} />
                <div className="absolute inset-0 bg-gradient-radial from-[#101014]/22 via-[#0a0a0a] to-[#0a0a0a]" />
            </div>

            <div className="relative z-10 pt-10 md:pt-24 pb-16">
                {/* ── CONTENT GRID (9+3) ── */}
                <div className="relative z-20 w-full max-w-[1920px] mx-auto px-2 sm:px-4 md:px-8 lg:pl-24 lg:pr-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8">

                        {/* Left (9 cols) */}
                        <div className="lg:col-span-9 space-y-6">

                            {/* Player */}
                            <WatchContainer
                                movie={movie}
                                currentEpisode={currentEpisode}
                                episodes={usedEpisodes.length > 0 ? usedEpisodes : servers[0]?.server_data || []}
                                servers={servers}
                                episodeThumbnails={{}} // Will be enriched
                                episodeMetadata={{}} // Will be enriched
                                movieData={movieData}
                                initialServerName={usedServerName || servers[0]?.server_name || ""}
                            />

                            {/* Movie description */}
                            <div className="relative z-30 rounded-[10px] border border-white/[0.06] overflow-hidden bg-[#07070b]/82 shadow-[0_10px_24px_#00000066] mx-3 sm:mx-0">
                                <div className="px-5 sm:px-6 pt-4 pb-3 border-b border-white/[0.06] bg-[#09090d]">
                                    <h3 className="text-white font-outfit font-extrabold text-[14px] sm:text-[15px] flex items-center gap-2 tracking-wider uppercase">
                                        <Info className="w-4 h-4" style={{ color: theme.primary }} /> Nội dung
                                    </h3>
                                </div>
                                <div className="p-5 sm:p-6">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="shrink-0 w-24 md:w-32 aspect-[2/3] relative rounded-lg overflow-hidden shadow-xl ring-1 ring-white/10 hidden md:block">
                                            <Image src={getImageUrl(movieData.moviePoster)} alt={movie.name} fill className="object-cover" />
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

                                            <Suspense fallback={<div className="h-10 w-full animate-pulse bg-white/5 rounded-full mt-4" />}>
                                                <MovieCastSection 
                                                    movieName={movie.name} 
                                                    movieYear={movie.year} 
                                                    originalName={movie.origin_name} 
                                                    localName={movie.name} 
                                                    countrySlug={(movie.country?.[0] as any)?.slug} 
                                                    localizedActors={movie.actor}
                                                />
                                            </Suspense>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Comments */}
                            <div className="mx-3 sm:mx-0">
                                <CommentSection movieId={movie._id} movieSlug={movie.slug} episodeName={movieData.episodeName} />
                            </div>
                        </div>

                        {/* Right Sidebar (3 cols) */}
                        <div className="lg:col-span-3 space-y-5">
                            {/* Genre pills */}
                            {movie.category && movie.category.length > 0 && (
                                <div className="relative z-30 rounded-[10px] border border-white/[0.06] overflow-hidden bg-[#07070b]/82 shadow-[0_10px_24px_#00000066]">
                                    <div className="px-5 pt-5 pb-4 border-b border-white/[0.06] bg-[#09090d]">
                                        <h3 className="text-white font-outfit font-extrabold text-[15px] tracking-wider uppercase">Thể loại</h3>
                                    </div>
                                    <div className="p-5 flex flex-wrap gap-2">
                                        {movie.category.map((c: { id: React.Key | null | undefined; slug: string; name: string }) => (
                                            <Link key={c.id} href={`/the-loai/${c.slug}`}
                                                className="text-xs px-3 py-1.5 rounded-full text-gray-200 border border-white/[0.10] hover:border-[#8FA7C5]/40 hover:text-[#8FA7C5] transition-colors"
                                                style={{ background: "rgba(255,255,255,0.06)" }}>
                                                {c.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Related movies */}
                            {movie.category?.[0]?.slug && (
                                <div className="relative z-30 rounded-[10px] border border-white/[0.06] overflow-hidden bg-[#07070b]/82 shadow-[0_10px_24px_#00000066]">
                                    <div className="px-5 pt-5 pb-4 border-b border-white/[0.06] flex items-center gap-2 bg-[#09090d]">
                                        <div className="w-1.5 h-4 rounded-full" style={{ backgroundColor: theme.primary }} />
                                        <h3 className="text-white font-outfit font-extrabold text-[15px] tracking-wider uppercase">Phim đề xuất</h3>
                                    </div>
                                    <div className="p-4">
                                        <RelatedMovies
                                            categorySlug={movie.category[0].slug}
                                            currentMovieId={movie._id}
                                            currentMovieSlug={movie.slug}
                                            countrySlug={(movie.country?.[0] as any)?.slug}
                                            mode="vertical"
                                        />
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
