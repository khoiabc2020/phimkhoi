import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { getMovieDetail, getMoviesList } from "@/services/api";
import { getRelatedMoviesForMovie } from "@/services/server-movies";
import { getMovieDetailFromCache, saveMovieToCache } from "@/lib/movie-cache";
import { Metadata } from "next";
import Link from "next/link";
import { Play, PlayCircle, Share2, Star, Clock, Film } from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import { decodeHtml, getImageUrl, getPosterImageUrl, getBackdropImageUrl, detectOrientation, cn, buildEpisodeKeyCandidates } from "@/lib/utils";
import { shouldUseTmdbMedia } from "@/lib/movie-list";
import { resolveMovieImages } from "@/lib/movie-media";
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
import { getTMDBEpisodeImages, getMovieTrailer } from "@/app/actions/tmdb";
import { getTmdbCacheEntry, saveTmdbCacheEntry } from "@/lib/tmdb-cache";
import TrailerButton from "@/components/TrailerButton";
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

    const plainContent = movie.content ? movie.content.replace(/<[^>]+>/g, '').trim() : "";
    const poster = getPosterImageUrl(movie) || getBackdropImageUrl(movie) || "";
    const url = `https://khoiphim.org/phim/${slug}`;
    const year = movie.year ? ` (${movie.year})` : "";
    const categoryNames = Array.isArray(movie.category) ? movie.category.map((c: any) => c.name) : [];
    const catStr = categoryNames.slice(0, 3).join(", ");
    const isTv = movie.type === "series" || movie.type === "hoathinh";
    const epInfo = movie.episode_current && movie.episode_current !== "0" ? ` - ${movie.episode_current}` : "";

    // Title: khớp đúng intent tìm kiếm "xem [tên phim] vietsub"
    const title = `Xem ${movie.name || "Phim"}${year} Vietsub HD${epInfo} | KHOIPHIM`;

    // Description: 155-160 ký tự, chứa từ khóa quan trọng ở đầu
    const descBase = plainContent.slice(0, 120);
    const desc = descBase
        ? `Xem phim ${movie.name}${year} vietsub miễn phí HD. ${descBase}...`
        : `Xem phim ${movie.name}${year} vietsub, thuyết minh, lồng tiếng chất lượng cao${catStr ? ` - ${catStr}` : ""} tại KHOIPHIM. Hoàn toàn miễn phí.`;

    const keywords = [
        movie.name, movie.origin_name,
        `xem phim ${movie.name}`, `${movie.name} vietsub`, `${movie.name} thuyết minh`,
        "xem phim online", "phim vietsub HD", catStr,
    ].filter(Boolean).join(", ");

    return {
        title,
        description: desc.slice(0, 160),
        keywords,
        alternates: { canonical: url },
        robots: { index: true, follow: true, "max-image-preview": "large" },
        openGraph: {
            title: `${movie.name}${year} | ${movie.origin_name || ""} | Xem Vietsub HD | KHOIPHIM`,
            description: desc.slice(0, 160),
            url,
            images: [{ url: poster, width: 800, height: 1200, alt: movie.name }],
            type: isTv ? "video.tv_show" : "video.movie",
            siteName: "KHOIPHIM",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description: desc.slice(0, 160),
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

    if (!data) return notFound();

    const { movie, episodes } = data as any;
    const serverData = episodes?.[0]?.server_data || [];

    // --- DATA NORMALIZATION TO PREVENT SERVER COMPONENT RENDER CRASHES ---
    if (movie) {
        if (typeof movie.actor === 'string') {
            movie.actor = movie.actor.split(',').map((s: string) => decodeHtml(s.trim())).filter(Boolean);
        } else if (!Array.isArray(movie.actor)) {
            movie.actor = [];
        } else {
            movie.actor = movie.actor.map((s: string) => decodeHtml(String(s || "").trim())).filter(Boolean);
        }
        
        if (typeof movie.director === 'string') {
            movie.director = movie.director.split(',').map((s: string) => decodeHtml(s.trim())).filter(Boolean);
        } else if (!Array.isArray(movie.director)) {
            movie.director = [];
        } else {
            movie.director = movie.director.map((s: string) => decodeHtml(String(s || "").trim())).filter(Boolean);
        }
        
        if (!Array.isArray(movie.category)) movie.category = [];
        if (!Array.isArray(movie.country)) movie.country = [];
        if (typeof movie.content !== 'string') movie.content = String(movie.content || "");
        movie.name = decodeHtml(String(movie.name || ""));
        movie.origin_name = decodeHtml(String(movie.origin_name || ""));
        movie.content = decodeHtml(movie.content);
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

    // [Elite Performance] TMDB Enrichment — MongoDB cache first, API fallback
    let tmdbDetails: any = null;
    let episodeThumbnails: Record<string, string> = {};
    let episodeMetadata: Record<string, any> = {};
    let resolvedTrailerKey: string | null = null;

    try {
        // 1. Try MongoDB TMDB cache (< 10ms, same server)
        const cached = await getTmdbCacheEntry(slug);

        let rawEpImages: any = null;
        let trailerKey: string | null = null;

        if (cached) {
            // Cache HIT — skip all external TMDB calls
            tmdbDetails = cached.data;
            rawEpImages  = cached.epImages;
            trailerKey   = cached.trailerKey;
        } else {
            // Cache MISS — fetch from TMDB and persist (fire-and-forget)
            const tmdbSearch = await searchTMDBMovie(
                movie.origin_name || movie.name,
                movie.year,
                type,
                { originalName: movie.origin_name, localName: movie.name, countrySlug: movie.country?.[0]?.slug }
            );

            if (tmdbSearch?.id && shouldUseTmdbMedia(movie, tmdbSearch)) {
                const tmdbId = tmdbSearch.id;
                const [details, epImages, trailer] = await Promise.all([
                    getTMDBDetails(tmdbId, type),
                    type === 'tv' ? getTMDBEpisodeImages(tmdbId) : Promise.resolve(null),
                    getMovieTrailer(
                        movie.origin_name || movie.name,
                        Number(movie.year),
                        type,
                        { originalName: movie.origin_name, localName: movie.name, countrySlug: movie.country?.[0]?.slug }
                    ).catch((): null => null),
                ]);

                tmdbDetails = details;
                rawEpImages  = epImages;
                trailerKey   = trailer ?? null;

                // Persist to MongoDB cache — non-blocking
                saveTmdbCacheEntry(slug, { data: details, epImages, trailerKey }).catch(() => {});
            }
        }

        // Map episode thumbnail/metadata using the Elite Mapping Engine
        if (type === 'tv' && rawEpImages && serverData.length > 0) {
            serverData.forEach((ep: any, index: number) => {
                const candidates = buildEpisodeKeyCandidates(ep.name, ep.slug, index);
                for (const key of candidates) {
                    const match = (rawEpImages as any)[key];
                    if (match) {
                        episodeThumbnails[ep.slug] = match.image || "";
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

        // Propagate trailerKey to outer scope
        resolvedTrailerKey = trailerKey;
    } catch (e) {
        console.error("TMDB Enrichment Error:", e);
    }

    // --- VISUAL ENGINE SELECTION ---
    const normalizedMedia = resolveMovieImages(movie);
    const rawThumb = String(normalizedMedia.thumb_url || movie?.thumb_url || "").trim();
    const rawPoster = String(normalizedMedia.poster_url || movie?.poster_url || "").trim();
    // Chấp nhận cả "unknown" — nhất quán với getBackdropImageUrl/resolveMovieImages
    const sourceThumb =
        rawThumb && detectOrientation(rawThumb) !== "portrait"
            ? getImageUrl(rawThumb)
            : "";
    const sourcePoster =
        rawPoster && detectOrientation(rawPoster) !== "landscape"
            ? getImageUrl(rawPoster)
            : "";
    const trustedTmdbDetails = shouldUseTmdbMedia(movie, tmdbDetails) ? tmdbDetails : null;

    // Trailer key was resolved inside TMDB enrichment block (cache hit or API fetch)
    const trailerKey: string | null = resolvedTrailerKey;

    const tmdbBackdrop = trustedTmdbDetails?.backdrop_path ? getTMDBImage(trustedTmdbDetails.backdrop_path, "original") : "";
    const tmdbPoster = trustedTmdbDetails?.poster_path ? getTMDBImage(trustedTmdbDetails.poster_path, "original") : "";

    const isNguonC = movie?.episodes?.[0]?.server_name?.toLowerCase().includes('nguonc');
    
    // Ambient Background: Priority = TMDB Backdrop > Source Thumb
    const ambientBgUrl = tmdbBackdrop || sourceThumb || "";
    
    // Subject Content: Priority = Source Thumb (Authentic) > TMDB Poster
    let contentSubjectUrl = sourcePoster || tmdbPoster || sourceThumb || tmdbBackdrop || "/fallback.png";
    if (isNguonC && (tmdbPoster || tmdbBackdrop)) {
        contentSubjectUrl = tmdbPoster || tmdbBackdrop || sourceThumb || sourcePoster || "/fallback.png";
    }

    const subjectOrientation = detectOrientation(contentSubjectUrl);
    // Force object-contain if we fall back to a low-res cropped thumb from NguonC
    const isSubjectPortrait = subjectOrientation === "portrait" || contentSubjectUrl === sourceThumb;
    const rating = trustedTmdbDetails?.vote_average ? Number(trustedTmdbDetails.vote_average).toFixed(1) : "9.7";
    const languageMap: Record<string, string> = {
        en: "Tiếng Anh",
        ko: "Tiếng Hàn",
        zh: "Tiếng Trung",
        ja: "Tiếng Nhật",
        th: "Tiếng Thái",
        vi: "Tiếng Việt",
    };
    const countryMap: Record<string, string> = {
        KR: "Hàn Quốc",
        CN: "Trung Quốc",
        TW: "Đài Loan",
        HK: "Hồng Kông",
        JP: "Nhật Bản",
        US: "Âu Mỹ",
        GB: "Anh",
        TH: "Thái Lan",
        VN: "Việt Nam",
    };
    const normalizedCountries = Array.isArray(movie?.country)
        ? movie.country
              .map((item: any) => {
                  if (!item) return "";
                  if (typeof item === "string") return decodeHtml(item.trim());
                  return decodeHtml(String(item.name || item.slug || "").trim());
              })
              .filter(Boolean)
        : [];
    const movieYearValue = Number(String(movie?.year || "").replace(/[^\d]/g, "").slice(0, 4));
    const tmdbYearValue = Number(String(trustedTmdbDetails?.release_date || trustedTmdbDetails?.first_air_date || "").slice(0, 4));
    const runtimeLabel = decodeHtml(String(movie?.time || "").trim());
    const normalizedLanguage = decodeHtml(String(movie?.lang || "").trim());
    const episodeTotalValue =
        Number(String(movie?.episode_total || "").replace(/[^\d]/g, "")) ||
        (Array.isArray(serverData) ? serverData.length : 0);
    const displayDirector =
        movie?.director?.join(", ") ||
        trustedTmdbDetails?.credits?.crew?.find((c: any) => c.job === "Director")?.name ||
        "Đang cập nhật";
    const displayActors =
        (Array.isArray(movie?.actor) ? movie.actor.filter(Boolean) : []).join(", ") ||
        trustedTmdbDetails?.credits?.cast?.slice(0, 8).map((c: { name?: string }) => decodeHtml(String(c.name || ""))).join(", ") ||
        "Đang cập nhật";
    const displayCountry =
        normalizedCountries.join(", ") ||
        trustedTmdbDetails?.origin_country?.map((code: string) => countryMap[code] || code).filter(Boolean).join(", ") ||
        "Đang cập nhật";
    const displayYear =
        (Number.isFinite(movieYearValue) && movieYearValue > 1900 ? movieYearValue : "") ||
        (Number.isFinite(tmdbYearValue) && tmdbYearValue > 1900 ? tmdbYearValue : "") ||
        "Đang cập nhật";
    const displayLanguage =
        normalizedLanguage ||
        languageMap[String(trustedTmdbDetails?.original_language || "").toLowerCase()] ||
        "Đang cập nhật";
    const displayDuration =
        runtimeLabel && !runtimeLabel.includes("?")
            ? runtimeLabel
            : trustedTmdbDetails?.runtime
                ? `${trustedTmdbDetails.runtime} phút`
                : type === "tv" && trustedTmdbDetails?.episode_run_time?.[0]
                    ? `${trustedTmdbDetails.episode_run_time[0]} phút/tập`
                    : "Đang cập nhật";
    const displayEpisodeTotal = episodeTotalValue > 0 ? episodeTotalValue : "?";

    const movieImageUrl = sourcePoster || sourceThumb || tmdbBackdrop;
    const watchUrl = `https://khoiphim.org/xem-phim/${movie?.slug}/${serverData?.[0]?.slug || 'tap-1'}`;
    const ratingCount = trustedTmdbDetails?.vote_count || 100;
    const firstCategoryObj = movie?.category?.[0];

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": type === 'tv' ? "TVSeries" : "Movie",
        "name": movie?.name,
        "alternateName": movie?.origin_name,
        "image": movieImageUrl,
        "description": movie?.content?.replace(/<[^>]+>/g, ''),
        "dateCreated": movie?.year?.toString(),
        "genre": movie?.category?.map((c: any) => c.name) || [],
        "contentRating": "TV-MA",
        "inLanguage": "vi",
        "actor": movie?.actor?.slice(0, 10).map((a: string) => ({ "@type": "Person", "name": a })) || [],
        "director": {
            "@type": "Person",
            "name": movie?.director?.[0] || trustedTmdbDetails?.credits?.crew?.find((c: any) => c.job === "Director")?.name || "Đang cập nhật"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": rating,
            "bestRating": "10",
            "ratingCount": ratingCount,
        },
        "potentialAction": {
            "@type": "WatchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": watchUrl,
                "actionPlatform": [
                    "http://schema.org/DesktopWebPlatform",
                    "http://schema.org/MobileWebPlatform",
                    "http://schema.org/IOSPlatform"
                ]
            },
            "expectsAcceptanceOf": { "@type": "Offer", "category": "free" }
        }
    };

    // VideoObject schema — giúp xuất hiện trong Google Video carousel
    const videoLd = {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        "name": `Xem phim ${movie?.name} Vietsub HD`,
        "description": movie?.content?.replace(/<[^>]+>/g, '').slice(0, 300) || `Xem phim ${movie?.name} vietsub miễn phí tại KHOIPHIM.`,
        "thumbnailUrl": movieImageUrl,
        "uploadDate": movie?.year ? `${movie.year}-01-01` : new Date().toISOString().split('T')[0],
        "contentUrl": watchUrl,
        "embedUrl": watchUrl,
        "inLanguage": "vi",
        "isAccessibleForFree": true,
        "regionsAllowed": "VN",
    };

    // BreadcrumbList — Google hiện breadcrumb trong kết quả tìm kiếm
    const breadcrumbLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Trang chủ", "item": "https://khoiphim.org" },
            ...(firstCategoryObj ? [{ "@type": "ListItem", "position": 2, "name": `Phim ${firstCategoryObj.name}`, "item": `https://khoiphim.org/the-loai/${firstCategoryObj.slug}` }] : []),
            { "@type": "ListItem", "position": firstCategoryObj ? 3 : 2, "name": movie?.name, "item": `https://khoiphim.org/phim/${movie?.slug}` },
        ]
    };

    return (
        <main className="min-h-screen pb-20 bg-transparent">
            {/* JSON-LD Structured Data */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
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
                            const normalizedEpisodeCurrent = epCurrent.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                            const isCompleted = normalizedEpisodeCurrent.includes("hoan tat") || normalizedEpisodeCurrent.includes("full");
                            const total = displayEpisodeTotal;
                            const epNum = epCurrent.replace(/hoàn tất/gi, "").replace(/\(.*?\)/g, "").replace(/tập\s*/gi, "").trim() || "1";
                            return (
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 font-bold text-sm mt-3 drop-shadow-md">
                                    {isCompleted ? (
                                        <>
                                            <span className="inline-flex items-center gap-1.5 bg-[#8FA7C5]/15 text-[#8FA7C5] border border-[#8FA7C5]/30 px-3 py-1 rounded-full text-xs font-bold">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#8FA7C5] inline-block" />
                                                Hoàn tất
                                            </span>
                                            <span className="text-gray-300 text-xs font-medium bg-white/5 border border-white/10 px-3 py-1 rounded-full">{total} tập</span>
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
                            {(movie?.director && movie.director.length > 0 && !movie.director.includes("Đang cập nhật")) || trustedTmdbDetails?.credits?.crew?.find((c: { job?: string; name?: string }) => c.job === "Director") ? (
                                <span><span className="text-gray-500">Đạo diễn:</span> {displayDirector}</span>
                            ) : null}
                            <span className="w-1 h-1 bg-gray-600 rounded-full hidden sm:block" />
                            <span><span className="text-gray-500">Thời lượng:</span> {displayDuration}</span>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-300 mb-4 sm:mb-6 line-clamp-2 max-w-3xl drop-shadow-md text-center md:text-left">
                            <span className="text-gray-500">Diễn viên:</span> {displayActors}
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

                            {trailerKey && (
                                <TrailerButton trailerKey={trailerKey} />
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

            {/* Bottom Content: responsive â€” stacked on mobile, 2-col on desktop */}
            <div className="max-w-[1920px] mx-auto px-4 md:px-8 lg:pl-24 lg:pr-12 mt-2 lg:mt-4 relative z-10">
                
                {/* On mobile/tablet: RIGHT column (tabs) first, then sidebar info below */}
                <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-12 items-start [contain-intrinsic-size:0_1000px] [content-visibility:auto]">

                    {/* RIGHT COLUMN (Tabs & Content) */}
                    <div className="w-full lg:col-span-7 xl:col-span-8">
                        <Suspense fallback={<div className="h-96 rounded-xl bg-white/5 animate-pulse flex items-center justify-center text-white/20 font-black uppercase tracking-[4px]">Loading Movie Data...</div>}>
                            <MovieTabs
                                movie={movie}
                                relatedMovies={relatedMovies}
                                episodes={episodes}
                                slug={slug}
                                tmdbDetails={trustedTmdbDetails}
                                episodeThumbnails={episodeThumbnails}
                                episodeMetadata={episodeMetadata}
                                cast={
                                    <div className="mt-4">
                                        <MovieCast movie={movie} slug={movie.slug} tmdbCast={trustedTmdbDetails?.credits?.cast} />
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
                            <div className="text-[14.5px] font-black text-white/90 drop-shadow-md">{displayDirector}</div>
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
                                <div className="flex justify-between border-b border-white/[0.08] pb-2"><span className="text-gray-400">Quốc gia:</span><span className="text-gray-200 font-medium">{displayCountry}</span></div>
                                <div className="flex justify-between border-b border-white/[0.08] pb-2"><span className="text-gray-400">Năm:</span><span className="text-gray-200 font-medium">{displayYear}</span></div>
                                <div className="flex justify-between border-b border-white/[0.08] pb-2"><span className="text-gray-400">Chất lượng:</span><span className="text-gray-200 font-medium">{movie?.quality || "HD"}</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">Ngôn ngữ:</span><span className="text-gray-200 font-medium">{displayLanguage}</span></div>
                            </div>
                        </div>
                        </div>

                    </div>

                </div>
            </div>
        </main >
    );
}

