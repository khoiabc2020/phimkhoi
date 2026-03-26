import dynamic from "next/dynamic";
import { getMovieDetail, getMoviesList } from "@/services/api";
import { getRelatedMoviesForMovie } from "@/services/server-movies";
import { getMovieDetailFromCache, saveMovieToCache } from "@/lib/movie-cache";
import { Metadata } from "next";
import Link from "next/link";
import { Play, PlayCircle, Share2, Star, Clock, Film } from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import { getImageUrl, getPosterImageUrl, getBackdropImageUrl, detectOrientation, cn, buildEpisodeKeyCandidates } from "@/lib/utils";
import Image from "next/image";
import { getThemeBySlug } from "@/lib/theme";
import WatchlistButton from "@/components/WatchlistButton";
import ShareButton from "@/components/ShareButton";

const CommentSection = dynamic(() => import("@/components/CommentSection"), {
    ssr: true,
    loading: () => <div className="h-32 rounded-lg bg-white/5 animate-pulse" />,
});
import MovieTabs from "@/components/MovieTabs";
import MovieCast from "@/components/MovieCast";
import { searchTMDBMovie, getTMDBDetails, getTMDBImage } from "@/services/tmdb";
import { getTMDBEpisodeImages, TMDBEpisodeMeta } from "@/app/actions/tmdb";
import MovieDetailTMDBInfo from "@/components/MovieDetailTMDBInfo";
import { cache, Suspense } from "react";


// Revalidate every 5 minutes (was 60s). ISR means first visitor triggers refresh, others get cache.
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    // [Elite Performance] Try cache first for metadata
    const cached = await getMovieDetailFromCache(slug);
    const data = cached || await getMovieDetail(slug);

    // [Elite JIT] If fetched from external API (not in cache), save to MongoDB
    if (!cached && data) {
        saveMovieToCache(slug, data).catch(() => {});
    }
    const movie: any = data?.movie;
    if (!movie) return { title: "Không tìm thấy phim - KHOIPHIM" };

    // Giới hạn description để SEO tốt hơn
    const plainContent = movie.content ? movie.content.replace(/<[^>]+>/g, '').trim() : "";
    const desc = plainContent ? plainContent.substring(0, 160) + '...' : `Xem phim ${movie.name} chất lượng cao tại KHOIPHIM.`;
    const poster = getPosterImageUrl(movie) || getBackdropImageUrl(movie) || "";
    const url = `https://khoiphim.org/phim/${slug}`;
    
    // Tạo keywords từ thể loại và tên phim
    const categories = Array.isArray(movie.category) ? movie.category.map((c: any) => c.name).join(", ") : "";
    const keywords = [movie.name, movie.origin_name, "xem phim", "phim online", "vietsub", categories].filter(Boolean).join(", ");

    return {
        title: `${movie.name || "Phim"} - Xem phim tại KHOIPHIM`,
        description: desc,
        keywords: keywords,
        alternates: {
            canonical: url,
        },
        robots: {
            index: true,
            follow: true,
            "max-image-preview": "large",
        },
        openGraph: {
            title: `${movie.name} | ${movie.origin_name} | KHOIPHIM`,
            description: desc,
            url,
            images: [
                {
                    url: poster,
                    width: 800,
                    height: 1200,
                    alt: movie.name,
                }
            ],
            type: "video.movie",
            siteName: "KHOIPHIM",
        },
        twitter: {
            card: "summary_large_image",
            title: `${movie.name} | KHOIPHIM`,
            description: desc,
            images: [poster],
        },
    };
}

export default async function MovieDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    // [Elite Performance] Optimistic detail load
    const cached = await getMovieDetailFromCache(slug);
    const data = cached || await getMovieDetail(slug);

    // [Elite JIT] If fetched from external API (not in cache), save to MongoDB for future optimization
    if (!cached && data) {
        // Fire and forget (don't block page render)
        saveMovieToCache(slug, data).catch(() => {});
    }

    if (!data) {
        return <div className="text-center py-20 text-white">Không tìm thấy phim</div>;
    }

    const { movie, episodes } = data as any;
    const serverData = episodes?.[0]?.server_data || [];

    // --- DATA NORMALIZATION TO PREVENT SERVER COMPONENT RENDER CRASHES ---
    if (movie) {
        if (typeof movie.actor === 'string') {
            movie.actor = movie.actor.split(',').map((s: string) => s.trim()).filter(Boolean);
        } else if (!Array.isArray(movie.actor)) {
            movie.actor = [];
        }
        
        if (typeof movie.director === 'string') {
            movie.director = movie.director.split(',').map((s: string) => s.trim()).filter(Boolean);
        } else if (!Array.isArray(movie.director)) {
            movie.director = [];
        }
        
        if (!Array.isArray(movie.category)) movie.category = [];
        if (!Array.isArray(movie.country)) movie.country = [];
        if (typeof movie.content !== 'string') movie.content = String(movie.content || "");
    }

    // Determine type for TMDB
    let type: 'movie' | 'tv' = (movie?.type === 'phim-bo' || movie?.type === 'tv-shows' || movie?.type === 'hoat-hinh' || movie?.slug?.includes('tap')) ? 'tv' : 'movie';
    const firstCategory = movie?.category?.[0]?.slug || 'all';
    const theme = getThemeBySlug(firstCategory);
    const relatedMovies = await getRelatedMoviesForMovie({
        categorySlug: firstCategory !== 'all' ? firstCategory : undefined,
        currentMovieSlug: movie?.slug || slug,
        countrySlug: movie?.country?.[0]?.slug,
        limit: 10,
    });

    // [Elite Performance] Fetch TMDB data for enrichment
    let tmdbDetails: any = null;
    let episodeThumbnails: Record<string, string> = {};
    let episodeMetadata: Record<string, any> = {};

    try {
        const tmdbSearch = await searchTMDBMovie(
            movie.origin_name || movie.name,
            movie.year,
            type,
            { originalName: movie.origin_name, localName: movie.name, countrySlug: movie.country?.[0]?.slug }
        );
        
        if (tmdbSearch?.id) {
            const tmdbId = tmdbSearch.id;
            const [details, epImages] = await Promise.all([
                getTMDBDetails(tmdbId, type),
                type === 'tv' ? getTMDBEpisodeImages(tmdbId) : Promise.resolve(null)
            ]);
            
            tmdbDetails = details;

            // Map episode images using the Elite Mapping Engine
            if (type === 'tv' && epImages && serverData.length > 0) {
                serverData.forEach((ep: any, index: number) => {
                    const candidates = buildEpisodeKeyCandidates(ep.name, ep.slug, index);
                    for (const key of candidates) {
                        const match = (epImages as any)[key];
                        if (match) {
                            episodeThumbnails[ep.slug] = match.still_path ? `https://image.tmdb.org/t/p/w500${match.still_path}` : "";
                            episodeMetadata[ep.slug] = {
                                title: match.name,
                                overview: match.overview,
                                airDate: match.air_date,
                                runtime: match.runtime,
                                voteAverage: match.vote_average
                            };
                            break;
                        }
                    }
                });
            }
        }
    } catch (e) {
        console.error("TMDB Enrichment Error:", e);
    }

    // --- VISUAL ENGINE SELECTION ---
    const sourceThumb = getBackdropImageUrl(movie);
    const sourcePoster = getPosterImageUrl(movie);
    const tmdbBackdrop = tmdbDetails?.backdrop_path ? getTMDBImage(tmdbDetails.backdrop_path, "original") : "";
    const tmdbPoster = tmdbDetails?.poster_path ? getTMDBImage(tmdbDetails.poster_path, "original") : "";

    const isNguonC = movie?.episodes?.[0]?.server_name?.toLowerCase().includes('nguonc');
    
    // Ambient Background: Priority = TMDB Backdrop > Source Thumb
    const ambientBgUrl = tmdbBackdrop || sourceThumb || tmdbPoster || sourcePoster || "/fallback.png";
    
    // Subject Content: Priority = Source Thumb (Authentic) > TMDB Poster
    let contentSubjectUrl = sourceThumb || sourcePoster || tmdbBackdrop || tmdbPoster || "/fallback.png";
    if (isNguonC && (tmdbPoster || tmdbBackdrop)) {
        contentSubjectUrl = tmdbPoster || tmdbBackdrop || sourceThumb || sourcePoster || "/fallback.png";
    }

    const subjectOrientation = detectOrientation(contentSubjectUrl);
    const isSubjectPortrait = subjectOrientation === "portrait";
    const rating = tmdbDetails?.vote_average ? Number(tmdbDetails.vote_average).toFixed(1) : "9.7";

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": type === 'tv' ? "TVSeries" : "Movie",
        "name": movie?.name,
        "alternativeHeadline": movie?.origin_name,
        "image": sourcePoster || sourceThumb || tmdbBackdrop,
        "description": movie?.content?.replace(/<[^>]+>/g, ''),
        "dateCreated": movie?.year?.toString(),
        "genre": movie?.category?.map((c: any) => c.name) || [],
        "contentRating": "TV-MA",
        "actor": movie?.actor?.map((a: string) => ({
            "@type": "Person",
            "name": a
        })) || [],
        "director": {
            "@type": "Person",
            "name": movie?.director?.[0] || tmdbDetails?.credits?.crew?.find((c: any) => c.job === "Director")?.name || "Đang cập nhật"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": rating,
            "bestRating": "10",
            "ratingCount": "100"
        },
        "potentialAction": {
            "@type": "WatchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": `https://khoiphim.org/xem-phim/${movie?.slug}/${serverData?.[0]?.slug || 'tap-1'}`,
                "actionPlatform": [
                    "http://schema.org/DesktopWebPlatform",
                    "http://schema.org/MobileWebPlatform",
                    "http://schema.org/AndroidPlatform",
                    "http://schema.org/IOSPlatform"
                ]
            },
            "expectsAcceptanceOf": {
                "@type": "Offer",
                "category": "free"
            }
        }
    };

    return (
        <main className="min-h-screen pb-20 bg-transparent">
            {/* JSON-LD for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {/* Hero Section (Onflix-like: backdrop 16:9 on right, left side darker) */}
            <div className="relative w-full pt-20 sm:pt-28 md:pt-32 pb-8 px-4 md:px-8 lg:pl-24 lg:pr-12 flex items-end min-h-[500px] sm:min-h-[560px] overflow-hidden">
                {/* Base dark layer */}
                <div className="absolute inset-0 bg-[#0a0a0a]" />

                {/* Backdrop layer: Cinematic Image Palette Glow */}
                {(ambientBgUrl || contentSubjectUrl) && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {/* Layer 1: Ambient Palette (Deep Blur) - Uses TMDB for colors if possible */}
                        <Image
                            src={ambientBgUrl || "/fallback.png"}
                            alt=""
                            fill
                            priority
                            className="object-cover opacity-[0.3] scale-125 blur-[100px] saturate-[2.5]"
                            sizes="100vw"
                            quality={10}
                        />
                        
                        {/* Layer 1.5: Theme Specific Glow */}
                        <div className={cn("absolute inset-0 opacity-40 blur-[120px] -z-10", theme.glow)} />
                        
                        {/* Layer 2: Atmospheric Texture (Mid Blur) */}
                        <Image
                            src={ambientBgUrl || "/fallback.png"}
                            alt=""
                            fill
                            priority
                            className="object-cover opacity-[0.2] blur-[20px] brightness-[0.5]"
                            sizes="100vw"
                            quality={40}
                        />

                        {/* Layer 3: THE SUBJECT (Authentic Source Thumbnail) */}
                        {/* If it's landscape, we use it as a Cinematic background strip on the right */}
                        <Image
                            src={contentSubjectUrl}
                            alt=""
                            fill
                            priority
                            fetchPriority="high"
                            loading="eager"
                            decoding="sync"
                            className={cn(
                                "opacity-90 brightness-[1.1] transition-opacity duration-700",
                                isSubjectPortrait 
                                    ? "object-contain object-right-top sm:object-right opacity-70" 
                                    : "object-cover object-[70%_30%] sm:object-right"
                            )}
                            sizes="100vw"
                            quality={72}
                        />
                    </div>
                )}

                {/* Cinematic Vignette & Edge Blending */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/92 via-[40%] to-transparent z-[1]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/65 to-transparent z-[1]" />

                {/* Hero Info Content aligned left/bottom on desktop, center on mobile */}
                <div className="relative z-10 w-full max-w-[1920px] mx-auto flex flex-col md:flex-row items-center md:items-end justify-center md:justify-between gap-6 md:gap-12 text-center md:text-left mt-0 sm:mt-2">
                    
                    {/* Poster on Mobile (Centered) */}
                    <div className="w-[140px] sm:w-[180px] md:hidden shrink-0 rounded-xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.8)] border border-white/15 relative aspect-[2/3] z-20">
                        <Image 
                            src={sourcePoster || sourceThumb || tmdbPoster || "/fallback.png"} 
                            alt={movie?.name || "Poster"} 
                            fill 
                            className="object-cover" 
                            sizes="180px"
                            priority
                            unoptimized
                        />
                    </div>

                    {/* Left side: Movie Info */}
                    <div className="space-y-3 sm:space-y-4 max-w-[760px] flex-1 flex flex-col items-center md:items-start w-full">
                        <Suspense fallback={<div className="h-6 w-24 bg-white/5 animate-pulse rounded mb-2" />}>
                            <MovieDetailTMDBInfo 
                                movieName={movie.name}
                                movieYear={movie.year}
                                movieOriginName={movie.origin_name}
                                type={type}
                                countrySlug={(movie.country?.[0] as any)?.slug}
                                theme={theme}
                            />
                        </Suspense>
                        <h1 
                            className="font-outfit text-3xl sm:text-4xl lg:text-[48px] font-black text-white leading-tight tracking-tighter pt-1 drop-shadow-2xl capitalize w-full"
                        >
                            {movie?.name}
                        </h1>
                        <h2 className="hidden sm:block text-base md:text-xl text-gray-300 font-medium tracking-wide drop-shadow-md capitalize opacity-80">
                            {movie?.origin_name?.toLowerCase()}
                        </h2>

                        {(() => {
                            const epCurrent = movie?.episode_current || "";
                            const isCompleted = epCurrent.toLowerCase().includes("hoàn tất") || epCurrent.toLowerCase().includes("full");
                            const total = movie?.episode_total || "?";
                            // Extract episode number, removing "Tập " strings to avoid duplication
                            const epNum = epCurrent.replace(/hoàn tất/gi, "").replace(/\(.*?\)/g, "").replace(/tập\s*/gi, "").trim() || "1";
                            return (
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 font-bold text-sm mt-3 drop-shadow-md">
                                    {isCompleted ? (
                                        <>
                                            <span className="inline-flex items-center gap-1.5 bg-[#8FA7C5]/15 text-[#8FA7C5] border border-[#8FA7C5]/30 px-3 py-1 rounded-full text-xs font-bold">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#8FA7C5] inline-block" />
                                                Hoàn Tất
                                            </span>
                                            <span className="text-gray-300 text-xs font-medium bg-white/5 border border-white/10 px-3 py-1 rounded-full">{total} Tập</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="inline-flex items-center gap-1.5 bg-[#8FA7C5]/15 text-[#8FA7C5] border border-[#8FA7C5]/30 px-3 py-1 rounded-full text-xs font-bold">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#8FA7C5] animate-pulse inline-block" />
                                                Đang chiếu
                                            </span>
                                            <span className="text-gray-300 text-xs font-medium bg-white/5 border border-white/10 px-3 py-1 rounded-full">Tập {epNum} / {total}</span>
                                        </>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Metadata Row for Mobile/Tablet - Promoting to reduce scroll */}
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-2 mt-2 lg:hidden">
                            {movie.category?.slice(0, 3).map((cat: any) => (
                                <Link 
                                    href={`/the-loai/${cat.slug}`} 
                                    key={cat.id}
                                    className="text-[10px] font-black text-[#8FA7C5] bg-[#8FA7C5]/10 px-2.5 py-1 rounded-full uppercase tracking-wider hover:bg-[#8FA7C5]/20 transition-colors"
                                >
                                    {cat.name}
                                </Link>
                            ))}
                            {movie.country?.map((c: any) => (
                                <Link 
                                    href={`/quoc-gia/${c.slug}`} 
                                    key={c.id}
                                    className="text-[10px] font-black text-white/40 uppercase tracking-wider hover:text-white transition-colors border border-white/5 px-2 py-0.5 rounded-md"
                                >
                                    {c.name}
                                </Link>
                            ))}
                        </div>

                        <div className="text-xs sm:text-sm text-gray-300 flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-4 py-2 drop-shadow-md">
                            {(movie?.director && movie.director.length > 0 && !movie.director.includes("Đang cập nhật")) || tmdbDetails?.credits?.crew?.find((c: { job?: string; name?: string }) => c.job === "Director") ? (
                                <span><span className="text-gray-500">Đạo diễn:</span> {movie?.director?.join(", ") || tmdbDetails?.credits?.crew?.find((c: { job?: string; name?: string }) => c.job === "Director")?.name}</span>
                            ) : null}
                            <span className="w-1 h-1 bg-gray-600 rounded-full hidden sm:block" />
                            <span><span className="text-gray-500">Thời lượng:</span> {movie?.time || "N/A"}</span>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-300 mb-4 sm:mb-6 line-clamp-2 max-w-3xl drop-shadow-md text-center md:text-left">
                            <span className="text-gray-500">Diễn viên:</span> {movie?.actor?.join(", ") || tmdbDetails?.credits?.cast?.slice(0, 5).map((c: { name?: string }) => c.name).join(", ") || "Đang cập nhật"}
                        </div>

                        {/* Action Buttons -- bigger touch targets on mobile, 2x2 grid */}
                        <div className="grid grid-cols-2 md:flex md:flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-4 pt-4 pb-2 w-full max-w-[500px] md:max-w-none">
                            {serverData.length > 0 && (
                                <Link
                                    href={`/xem-phim/${slug}/${serverData[0].slug}`}
                                    className="flex items-center justify-center gap-2 px-5 sm:px-10 py-3.5 rounded-full font-black text-[14px] sm:text-[15px] hover:scale-105 transition-all duration-300 shadow-xl w-full md:w-auto"
                                    style={{ backgroundColor: theme.primary, color: '#0a0a0a', boxShadow: `0 4px 20px ${theme.primary}4d` }}
                                >
                                    <Play className="w-5 h-5 fill-current shrink-0" />
                                    Xem Phim
                                </Link>
                            )}

                            {movie && (
                                <>
                                    <FavoriteButton
                                        movieData={{
                                            movieId: String(movie._id || movie.id || ""),
                                            movieSlug: String(movie.slug || ""),
                                            movieName: String(movie.name || ""),
                                            movieOriginName: String(movie.origin_name || ""),
                                            moviePoster: sourcePoster || sourceThumb || tmdbPoster || "/fallback.png",
                                            movieYear: Number(movie.year) || new Date().getFullYear(),
                                            movieQuality: String(movie.quality || "HD"),
                                            movieCategories: Array.isArray(movie.category) ? movie.category.map((c: any) => String(c.name || "")) : [],
                                            lastEpisode: String(movie?.episode_current || ""),
                                        }}
                                        className="!bg-white/5 hover:!bg-white/10 text-gray-300 hover:text-white border border-white/10 py-3.5 px-5 sm:px-6 rounded-full font-medium shadow-sm transition-all w-full md:w-auto"
                                        showLabel={true}
                                    />
                                    <WatchlistButton
                                        slug={movie.slug}
                                        movieName={movie.name}
                                        poster={sourcePoster || sourceThumb || tmdbPoster || "/fallback.png"}
                                        className="!bg-white/5 hover:!bg-white/10 text-gray-300 hover:text-white border border-white/10 py-3.5 px-5 sm:px-6 rounded-full font-medium shadow-sm transition-all w-full md:w-auto"
                                        showLabel={true}
                                    />
                                    <ShareButton title={`Xem phim ${movie.name} trên KHOIPHIM`} className="py-3.5 px-5 sm:px-6 rounded-full !bg-white/5 hover:!bg-white/10 border-white/10 font-medium w-full md:w-auto" />
                                </>
                            )}
                        </div>

                    </div>

                </div>
            </div>

            {/* Bottom Content: responsive — stacked on mobile, 2-col on desktop */}
            <div className="max-w-[1920px] mx-auto px-4 md:px-8 lg:pl-24 lg:pr-12 mt-2 lg:mt-4 relative z-10">
                
                {/* On mobile/tablet: RIGHT column (tabs) first, then sidebar info below */}
                <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-12 items-start [contain-intrinsic-size:0_1000px] [content-visibility:auto]">

                    {/* RIGHT COLUMN (Tabs & Content) */}
                    <div className="w-full lg:col-span-7 xl:col-span-8">
                        <Suspense fallback={<div className="h-96 rounded-2xl bg-white/5 animate-pulse flex items-center justify-center text-white/20 font-black uppercase tracking-[4px]">Loading Movie Data...</div>}>
                            <MovieTabs
                                movie={movie}
                                relatedMovies={relatedMovies}
                                episodes={episodes}
                                slug={slug}
                                tmdbDetails={tmdbDetails}
                                episodeThumbnails={episodeThumbnails}
                                episodeMetadata={episodeMetadata}
                                cast={
                                    <div className="mt-4">
                                        <MovieCast movie={movie} slug={movie.slug} tmdbCast={tmdbDetails?.credits?.cast} />
                                    </div>
                                }
                            />
                        </Suspense>
                        {/* Comment Section below tabs */}
                        <div className="mt-8 sm:mt-12">
                            <div className="flex items-center gap-2 mb-6 border-l-2 border-[#8FA7C5] pl-3">
                                <h3 className="text-[17px] sm:text-[19px] font-black text-white uppercase tracking-widest">Bình luận</h3>
                            </div>
                            <Suspense fallback={<div className="h-32 rounded-lg bg-white/5 animate-pulse" />}>
                                <CommentSection movieId={String(movie._id || movie.id || "")} movieSlug={String(movie.slug || "")} />
                            </Suspense>
                        </div>
                    </div>

                    {/* LEFT SIDEBAR (shown after tabs on mobile, beside on desktop) */}
                    {/* LEFT SIDEBAR (shown after tabs on mobile, beside on desktop) */}
                    <div className="w-full lg:col-span-5 xl:col-span-4 order-2 lg:order-1 space-y-6 sm:space-y-8">
                        <div className="rounded-[10px] border border-white/[0.06] bg-[#07070b]/78 p-4 sm:p-5 space-y-6 sm:space-y-8 shadow-[0_10px_24px_#00000066]">

                        {/* Đạo diễn */}
                        <div className="pt-2">
                            <div className="text-[12px] font-black text-[#8FA7C5]/40 uppercase tracking-[2px] mb-2.5">Đạo diễn</div>
                            <div className="text-[14.5px] font-black text-white/90 drop-shadow-md">{movie?.director?.join(", ") || "Đang cập nhật"}</div>
                        </div>

                        {/* Description Section */}
                        {movie?.content && (
                            <div className="pt-4 border-t border-white/5 space-y-4">
                                <div className="text-[12px] font-black text-[#8FA7C5]/40 uppercase tracking-[2px]">Nội dung</div>
                                <div 
                                    className="text-[14.5px] sm:text-[15.5px] text-gray-300/80 leading-relaxed text-justify font-medium" 
                                    dangerouslySetInnerHTML={{ __html: movie?.content }} 
                                />
                            </div>
                        )}

                        {/* Thể loại */}
                        <div>
                            <div className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-3">Thể loại</div>
                            <div className="flex flex-wrap gap-2 text-left">
                                {movie?.category?.map((c: { slug?: string; name?: string; id?: string }) => (
                                    <Link key={c.id} href={`/the-loai/${c.slug}`} className="text-[11.5px] font-bold text-gray-300 bg-white/[0.05] border border-white/[0.1] py-1.5 px-3 rounded-md hover:text-white hover:border-[#8FA7C5]/50 hover:bg-white/[0.08] transition-all uppercase tracking-wider">{c.name}</Link>
                                ))}
                            </div>
                        </div>

                        {/* Thông tin thêm */}
                        <div>
                            <div className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-3">Thông tin thêm</div>
                            <div className="space-y-2 text-[13px]">
                                <div className="flex justify-between border-b border-white/[0.08] pb-2"><span className="text-gray-400">Quốc gia:</span><span className="text-gray-200 font-medium">{movie?.country?.[0]?.name || "Đang cập nhật"}</span></div>
                                <div className="flex justify-between border-b border-white/[0.08] pb-2"><span className="text-gray-400">Năm:</span><span className="text-gray-200 font-medium">{movie?.year || "Đang cập nhật"}</span></div>
                                <div className="flex justify-between border-b border-white/[0.08] pb-2"><span className="text-gray-400">Chất lượng:</span><span className="text-gray-200 font-medium">{movie?.quality || "HD"}</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">Ngôn ngữ:</span><span className="text-gray-200 font-medium">{movie?.lang || "Đang cập nhật"}</span></div>
                            </div>
                        </div>
                        </div>

                    </div>

                </div>
            </div>
        </main >
    );
}
