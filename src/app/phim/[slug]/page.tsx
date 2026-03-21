import dynamic from "next/dynamic";
import { getMovieDetail, getMoviesList } from "@/services/api";
import { Metadata } from "next";
import Link from "next/link";
import { Play, PlayCircle, Share2, Star, Clock, Film } from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import { getImageUrl, detectOrientation } from "@/lib/utils";
import Image from "next/image";

const CommentSection = dynamic(() => import("@/components/CommentSection"), {
    ssr: true,
    loading: () => <div className="h-32 rounded-lg bg-white/5 animate-pulse" />,
});
import MovieTabs from "@/components/MovieTabs";
import MovieCast from "@/components/MovieCast";
import { searchTMDBMovie, getTMDBDetails, getTMDBImage } from "@/services/tmdb";
import WatchlistButton from "@/components/WatchlistButton";
import ShareButton from "@/components/ShareButton";
import { getTMDBEpisodeImages, TMDBEpisodeMeta } from "@/app/actions/tmdb";

// Revalidate every 5 minutes (was 60s). ISR means first visitor triggers refresh, others get cache.
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const data = await getMovieDetail(slug);
    const movie: any = data?.movie;
    if (!movie) return { title: "Không tìm thấy phim - KHOIPHIM" };

    // Giới hạn description để SEO tốt hơn
    const desc = movie.content ? movie.content.replace(/<[^>]+>/g, '').substring(0, 160) + '...' : `Xem phim ${movie.name} chất lượng cao tại KHOIPHIM.`;
    const poster = getImageUrl(movie.poster_url || movie.thumb_url || "");
    const url = `https://khoiphim.io.vn/phim/${slug}`;

    return {
        title: `${movie.name || "Phim"} - Xem phim tại KHOIPHIM`,
        description: desc,
        alternates: {
            canonical: url,
        },
        robots: {
            index: true,
            follow: true,
        },
        openGraph: {
            title: `${movie.name} | ${movie.origin_name}`,
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
    const data = await getMovieDetail(slug);

    if (!data) {
        return <div className="text-center py-20 text-white">Không tìm thấy phim</div>;
    }

    const { movie, episodes } = data as any;
    const serverData = episodes?.[0]?.server_data || [];

    // --- DATA NORMALIZATION TO PREVENT SERVER COMPONENT RENDER CRASHES ---
    // External APIs occasionally return strings instead of arrays for actors/directors,
    // which causes array methods (.join, .filter) to throw SSR exceptions.
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

    // Xác định loại phim cho TMDB
    let type: 'movie' | 'tv' = 'movie';
    if (movie?.type === 'phim-bo' || movie?.type === 'tv-shows' || movie?.type === 'hoat-hinh') {
        type = 'tv';
    }

    // ==> TỐI ƯU: Fetch song song tất cả dữ liệu phụ (TMDB + Related)
    const [tmdbSearch, relatedMoviesRaw, tmdbEpisodeImagesRes] = await Promise.allSettled([
        searchTMDBMovie(
            movie?.origin_name || movie?.name,
            movie?.year ? parseInt(movie.year.toString().split("-")[0]) : undefined,
            type,
            { originalName: movie?.origin_name, localName: movie?.name, countrySlug: movie?.country?.[0]?.slug }
        ),
        (movie?.category && movie.category.length > 0 && movie.category[0].slug)
            ? getMoviesList('phim-moi-cap-nhat', { category: movie.category[0].slug, limit: 12 })
            : Promise.resolve({ items: [] }),
        getTMDBEpisodeImages(
            movie?.origin_name || movie?.name,
            movie?.year ? parseInt(movie.year.toString().split("-")[0]) : undefined,
            { originalName: movie?.origin_name, localName: movie?.name, countrySlug: movie?.country?.[0]?.slug }
        ),
    ]);

    const tmdbSearchResult = tmdbSearch.status === 'fulfilled' ? tmdbSearch.value : null;
    const tmdbDetails = tmdbSearchResult ? await getTMDBDetails(tmdbSearchResult.id, type) : null;
    const relatedMovies = relatedMoviesRaw.status === 'fulfilled' && relatedMoviesRaw.value?.items
        ? relatedMoviesRaw.value.items.filter((m: { slug?: string }) => m.slug !== movie?.slug).slice(0, 8)
        : [];
    const episodeImageMap: Record<string, TMDBEpisodeMeta> = tmdbEpisodeImagesRes.status === "fulfilled" ? (tmdbEpisodeImagesRes.value || {}) : {};

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

        const byIndex = indexInServer + 1;
        pushKey(String(byIndex));
        pushKey(String(byIndex).padStart(2, "0"));

        return Array.from(seen);
    };

    const episodeThumbnails: Record<string, string> = {};
    const episodeMetadata: Record<string, TMDBEpisodeMeta> = {};
    (episodes || []).forEach((serverItem: any) => {
        (serverItem?.server_data || []).forEach((ep: any, indexInServer: number) => {
            if (!ep?.slug) return;
            const candidates = buildEpisodeKeyCandidates(ep, indexInServer);
            const matchedData = candidates
                .map((key) => episodeImageMap[key])
                .find(Boolean);

            if (matchedData?.image) {
                episodeThumbnails[ep.slug] = matchedData.image;
            }
            if (matchedData) {
                episodeMetadata[ep.slug] = matchedData;
            }
        });
    });

    // --- Backdrop image selection ---
    // Rule: PRIORITY 1 = Source Thumb (The snowy couple in OPhim thumb_url)
    //       PRIORITY 2 = TMDB Backdrop (High quality fallback)
    //       PRIORITY 3 = TMDB Poster
    //       PRIORITY 4 = Source Poster (The Horse - least desired)

    const tmdbBackdrop = tmdbDetails?.backdrop_path ? getTMDBImage(tmdbDetails.backdrop_path, "original") : "";
    const tmdbPosterFallback = tmdbDetails?.poster_path ? getTMDBImage(tmdbDetails.poster_path, "original") : "";

    // Verified source backdrop - User specifically requested "lấy ảnh backdrop của nguồn phim đi"
    // For Asian dramas, the "thumb_url" usually contains the main actors (Snowy Couple).
    const sourceThumbUrl = movie?.thumb_url ? getImageUrl(movie.thumb_url) : "";
    const sourcePosterUrl = movie?.poster_url ? getImageUrl(movie.poster_url) : "";
    
    // Final Backdrop Selection
    // Priority: Source Thumb -> TMDB Backdrop -> TMDB Poster -> Source Poster
    const backdropUrl = sourceThumbUrl || tmdbBackdrop || tmdbPosterFallback || sourcePosterUrl;
    
    // We treat it as a "portrait" style (to apply blur/object-contain) if it's from source 
    // because source images are often smaller/differently aspected than pure backdrops.
    const isPortraitFallback = !tmdbBackdrop && !!backdropUrl;
    const rating = tmdbDetails?.vote_average ? Number(tmdbDetails.vote_average).toFixed(1) : "9.7";

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": type === 'tv' ? "TVSeries" : "Movie",
        "name": movie?.name,
        "alternativeHeadline": movie?.origin_name,
        "image": sourcePosterUrl || sourceThumbUrl || tmdbBackdrop,
        "description": movie?.content?.replace(/<[^>]+>/g, ''),
        "dateCreated": movie?.year?.toString(),
        "director": {
            "@type": "Person",
            "name": movie?.director?.[0] || tmdbDetails?.credits?.crew?.find((c: any) => c.job === "Director")?.name || "Đang cập nhật"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": rating,
            "bestRating": "10",
            "ratingCount": "100"
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

                {/* Backdrop layer: full canvas, anchored right to keep subject in right half */}
                {backdropUrl && (
                    <div className="absolute inset-0">
                        {/* 1. Blurred background filling the empty space */}
                        <Image
                            src={backdropUrl}
                            alt={movie?.name || ""}
                            fill
                            priority
                            className="object-cover object-[68%_22%] opacity-[0.4] scale-110 blur-[45px]"
                            sizes="100vw"
                            quality={60}
                        />
                        {/* 2. Sharp focused image on the right */}
                        <Image
                            src={backdropUrl}
                            alt={movie?.name || ""}
                            fill
                            priority
                            className={`opacity-100 ${isPortraitFallback ? 'object-cover sm:object-contain sm:object-right-top' : 'object-cover object-[62%_20%] sm:object-right'}`}
                            sizes="100vw"
                            quality={100}
                            unoptimized={true} 
                        />
                    </div>
                )}

                {/* Softer cinematic feather blend: tránh đường chia cứng trái/phải */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/95 via-[45%] to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />

                {/* Hero Info Content aligned left/bottom on desktop, center on mobile */}
                <div className="relative z-10 w-full max-w-[1920px] mx-auto flex flex-col md:flex-row items-center md:items-end justify-center md:justify-between gap-6 md:gap-12 text-center md:text-left mt-0 sm:mt-4">
                    
                    {/* Poster on Mobile (Centered, no negative margin to avoid topbar) */}
                    <div className="w-[140px] sm:w-[180px] md:hidden shrink-0 rounded-xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.8)] border border-white/15 relative aspect-[2/3] z-20">
                        <Image 
                            src={sourcePosterUrl || sourceThumbUrl || tmdbPosterFallback || "/fallback.png"} 
                            alt={movie?.name || "Poster"} 
                            fill 
                            className="object-cover" 
                            sizes="180px"
                            priority
                        />
                    </div>

                    {/* Left side: Movie Info */}
                    <div className="space-y-3 sm:space-y-4 max-w-[760px] flex-1 flex flex-col items-center md:items-start w-full">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
                            {movie?.year && (
                                <span className="px-2.5 py-1 rounded-md border border-white/15 bg-white/[0.06] text-white/80 text-[11px] font-semibold leading-none drop-shadow-md">
                                    {movie?.year}
                                </span>
                            )}
                            <span className="px-2.5 py-1 rounded-md border border-[#8FA7C5]/40 bg-[#8FA7C5]/10 text-[#8FA7C5] text-[11px] font-bold leading-none uppercase drop-shadow-md">
                                {movie?.quality || "FHD"}
                            </span>
                        </div>
                        <h1 className="font-display text-3xl sm:text-4xl lg:text-[44px] font-black text-white leading-tight tracking-tight pt-1 drop-shadow-2xl capitalize w-full">
                            {movie?.name?.toLowerCase()}
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
                                            <span className="inline-flex items-center gap-1.5 bg-green-500/15 text-green-400 border border-green-500/30 px-3 py-1 rounded-full text-xs font-bold">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
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

                        {/* Action Buttons -- bigger touch targets on mobile, centered */}
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-4 pt-4 pb-2 w-full">
                            {serverData.length > 0 && (
                                <Link
                                    href={`/xem-phim/${movie?.slug}/${serverData[0].slug}`}
                                    className="flex items-center justify-center gap-2 bg-[#8FA7C5] text-[#0a0a0a] px-8 sm:px-10 py-3.5 rounded-full font-black text-[15px] hover:bg-[#a8bdd8] hover:scale-105 transition-all duration-300 shadow-[0_4px_20px_rgba(143,167,197,0.3)]"
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
                                            moviePoster: sourcePosterUrl || sourceThumbUrl || tmdbBackdrop || "/fallback.png",
                                            movieYear: Number(movie.year) || new Date().getFullYear(),
                                            movieQuality: String(movie.quality || "HD"),
                                            movieCategories: Array.isArray(movie.category) ? movie.category.map((c: any) => String(c.name || "")) : [],
                                        }}
                                        className="!bg-white/5 hover:!bg-white/10 text-gray-300 hover:text-white border border-white/10 py-3.5 px-6 rounded-full font-medium shadow-sm transition-all"
                                        showLabel={true}
                                    />
                                    <WatchlistButton
                                        slug={movie.slug}
                                        className="!bg-white/5 hover:!bg-white/10 text-gray-300 hover:text-white border border-white/10 py-3.5 px-6 rounded-full font-medium shadow-sm transition-all hidden sm:flex"
                                        showLabel={true}
                                    />
                                    <ShareButton title={`Xem phim ${movie.name} trên KHOIPHIM`} className="py-3.5 px-6 rounded-full !bg-white/5 hover:!bg-white/10 border-white/10 font-medium" />
                                </>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* Bottom Content: responsive — stacked on mobile, 2-col on desktop */}
            <div className="max-w-[1920px] mx-auto px-4 md:px-8 lg:pl-24 lg:pr-12 mt-6 sm:mt-8 lg:mt-12 relative z-10">
                
                {/* Mobile prioritized Section: Description */}
                <div className="lg:hidden mb-10 pt-4">
                    <div className="bg-[#07070b]/60 backdrop-blur-xl rounded-lg p-5 sm:p-6 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
                        <div className="flex items-center gap-2 mb-4 border-l-4 border-[#8FA7C5] pl-3">
                            <h3 className="text-[16px] font-black text-white tracking-widest uppercase">Nội dung</h3>
                        </div>
                        <div 
                            className="text-[14px] text-gray-300 leading-relaxed font-light text-justify" 
                            dangerouslySetInnerHTML={{ __html: movie?.content }} 
                        />
                    </div>
                </div>

                {/* On mobile/tablet: RIGHT column (tabs) first, then sidebar info below */}
                <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 items-start">

                    {/* RIGHT COLUMN (Tabs & Content) */}
                    <div className="w-full lg:col-span-8 xl:col-span-9">
                        <MovieTabs
                            movie={movie}
                            relatedMovies={relatedMovies}
                            episodes={episodes}
                            slug={slug}
                            tmdbDetails={tmdbDetails}
                            episodeThumbnails={episodeThumbnails}
                            episodeMetadata={episodeMetadata}
                            castComponent={<MovieCast movie={movie} slug={slug} isCompact={false} />}
                        />
                        {/* Comment Section below tabs */}
                        <div className="mt-8 sm:mt-12">
                            <div className="flex items-center gap-2 mb-6 border-l-2 border-[#8FA7C5] pl-3">
                                <h3 className="text-[15px] font-bold text-white uppercase tracking-widest">Bình luận</h3>
                            </div>
                            <CommentSection movieId={String(movie._id || movie.id || "")} movieSlug={String(movie.slug || "")} />
                        </div>
                    </div>

                    {/* LEFT SIDEBAR (shown after tabs on mobile, beside on desktop) */}
                    <div className="w-full lg:col-span-4 xl:col-span-3 order-2 lg:order-1 space-y-6 sm:space-y-8 lg:pr-4">
                        <div className="rounded-[10px] border border-white/[0.06] bg-[#07070b]/78 p-4 sm:p-5 space-y-6 sm:space-y-8 shadow-[0_10px_24px_#00000066]">
                        {/* Nội dung (Desktop only) */}
                        <div className="hidden lg:block">
                            <div className="flex items-center gap-2 mb-3 sm:mb-4 border-l-2 border-[#8FA7C5] pl-3">
                                <h3 className="text-[14px] sm:text-[15px] font-bold text-white uppercase tracking-widest">Nội dung</h3>
                            </div>
                            <div className="text-[13px] text-gray-400 leading-relaxed font-light text-justify line-clamp-6 sm:line-clamp-[12]" dangerouslySetInnerHTML={{ __html: movie?.content }} />
                        </div>

                        {/* Đạo diễn */}
                        <div>
                            <div className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-2">Đạo diễn</div>
                            <div className="text-[13px] font-bold text-white">{movie?.director?.join(", ") || "Đang cập nhật"}</div>
                        </div>

                        {/* Diễn viên (Desktop only Sidebar or always removed to Tabs) */}
                        <div className="hidden lg:block">
                            <div className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-3">Diễn viên</div>
                            <MovieCast movie={movie} slug={movie.slug} isCompact={true} />
                        </div>

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
