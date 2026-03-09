"use client";

import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import Link from "next/link";
import { Play, ChevronRight, Info } from "lucide-react";
import { Movie } from "@/services/api";
import { getImageUrl, decodeHtml, cn } from "@/lib/utils";
import { getTMDBDataForCard } from "@/app/actions/tmdb";
import { useState, useEffect, useCallback, useRef } from "react";
import FavoriteButton from "./FavoriteButton";

export default function HeroSection({ movies }: { movies: Movie[] }) {
    // Desktop: không dùng plugin Autoplay để có thể tắt khi tab ẩn → giảm lag
    // duration hơi lớn hơn mặc định để chuyển slide mượt hơn (không "giật")
    const [desktopRef, desktopApi] = useEmblaCarousel({ loop: true, duration: 45 });

    const [mobileRef, mobileApi] = useEmblaCarousel({
        loop: true,
        align: "center",
        containScroll: "trimSnaps",
        dragFree: false // Tắt dragFree để vuốt từng slide có điểm dừng rõ ràng
    });

    const [selectedIndex, setSelectedIndex] = useState(0);
    const [tweenValues, setTweenValues] = useState<number[]>([]);
    const [isDesktop, setIsDesktop] = useState(false);

    // Sync Desktop: theo dõi slide hiện tại, KHÔNG autoplay để giảm CPU
    useEffect(() => {
        if (!desktopApi) return;
        const onSelect = () => setSelectedIndex(desktopApi.selectedScrollSnap());
        desktopApi.on("select", onSelect);
        return () => {
            desktopApi.off("select", onSelect);
        };
    }, [desktopApi]);

    // Sync Mobile: Loại bỏ hoàn toàn vòng lặp requestAnimationFrame tính toán tỉ lệ scale nặng nề gây lag.
    // CSS thuần túy và Embla core sẽ đảm nhận việc lướt.
    useEffect(() => {
        if (!mobileApi) return;
        const onSelect = () => setSelectedIndex(mobileApi.selectedScrollSnap());
        mobileApi.on("select", onSelect);
        return () => {
            mobileApi.off("select", onSelect);
        };
    }, [mobileApi]);

    // Lấy dữ liệu TMDB từ Server Props (page.tsx) thay vì fetch Client-Side để tăng hiệu năng tối đa
    // Dữ liệu đã có sẵn trong HTML ban đầu, không gây giật lag do hiệu ứng tải lại trên Mobile & Desktop
    const scrollTo = useCallback((index: number) => {
        if (desktopApi) desktopApi.scrollTo(index);
        if (mobileApi) mobileApi.scrollTo(index);
    }, [desktopApi, mobileApi]);

    const scrollNext = useCallback(() => {
        if (desktopApi) desktopApi.scrollNext();
        if (mobileApi) mobileApi.scrollNext();
    }, [desktopApi, mobileApi]);

    const scrollPrev = useCallback(() => {
        if (desktopApi) desktopApi.scrollPrev();
        if (mobileApi) mobileApi.scrollPrev();
    }, [desktopApi, mobileApi]);

    if (!movies || movies.length === 0) return null;

    const stripHtml = (html: string) => html ? html.replace(/<[^>]*>/g, '').trim() : "";
    // Giới hạn 5 slide để giảm lượng DOM + ảnh + CPU tính toán tối đa (cuộn siêu mượt)
    const heroMovies = movies.slice(0, 5);
    const activeMovie = heroMovies[selectedIndex] || heroMovies[0];
    const enhancedTMDB = activeMovie?.tmdbData;
    const activeRating = enhancedTMDB?.vote_average ? enhancedTMDB.vote_average.toFixed(1) : "N/A";

    const getFavoriteData = (movie: Movie) => ({
        movieId: movie._id || "",
        movieSlug: movie.slug,
        movieName: movie.name,
        movieOriginName: movie.origin_name,
        moviePoster: movie.poster_url || movie.thumb_url,
        movieYear: Number(movie.year) || new Date().getFullYear(),
        movieQuality: movie.quality || "HD",
        movieCategories: movie.category?.map(c => c.name) || [],
    });

    const formatQualityLabel = (quality?: string) => {
        if (!quality) return null;
        const q = String(quality).trim();
        const upper = q.toUpperCase();
        if (upper.includes("FULL") && upper.includes("HD")) return "FHD";
        if (upper === "FULLHD") return "FHD";
        if (upper.includes("BLURAY")) return "BR";
        if (upper.includes("WEB-DL") || upper.includes("WEBDL")) return "WEB";
        if (upper === "FHD" || upper === "HD" || upper === "4K" || upper === "CAM") return upper;
        return q.length > 6 ? q.slice(0, 6) : q;
    };

    // Hero dùng poster/thumbnail từ API (TMDB Server Side khi đã match năm, hoặc nguồn PhimAPI). Fallback placeholder để không bao giờ slide đen.
    const getHeroImage = (movie: any, type: 'poster' | 'backdrop' = 'poster') => {
        const tmdbData = movie.tmdbData;
        if (tmdbData) {
            if (type === 'poster' && tmdbData.poster_path) {
                return `https://image.tmdb.org/t/p/original${tmdbData.poster_path}`;
            }
            if (type === 'backdrop' && tmdbData.backdrop_path) {
                return `https://image.tmdb.org/t/p/original${tmdbData.backdrop_path}`;
            }
        }
        const apiPath = type === 'backdrop' ? (movie.thumb_url || movie.poster_url) : (movie.poster_url || movie.thumb_url);
        return apiPath ? getImageUrl(apiPath) : "/placeholder.jpg";
    };

    return (
        <div className="relative w-full h-auto bg-transparent overflow-hidden flex flex-col font-sans">

            {/* ================= MOBILE LAYOUT compact — chiều cao tiết kiệm ================= */}
            <div className="md:hidden relative w-full bg-transparent" ref={mobileRef}>
                <div className="flex flex-row touch-pan-y">
                    {heroMovies.map((movie: any, index) => {
                        const posterImg = getHeroImage(movie, 'poster');
                        const backdropImg = getHeroImage(movie, 'backdrop');
                        const rating = movie.tmdbData?.vote_average ? movie.tmdbData.vote_average.toFixed(1) : null;
                        const isActive = index === selectedIndex;

                        return (
                            <div
                                key={movie._id}
                                className="relative flex-[0_0_100%] min-w-0 flex flex-col transition-opacity duration-300"
                            >
                                {/* Backdrop — fixed height 200px, phủ toàn chiều rộng */}
                                <div className="relative w-full h-[200px] sm:h-[260px] shrink-0 overflow-hidden">
                                    <Image
                                        src={backdropImg}
                                        alt={decodeHtml(movie.name)}
                                        fill
                                        className="object-cover object-top"
                                        priority={index === 0}
                                        sizes="100vw"
                                        placeholder="blur"
                                        blurDataURL="data:image/webp;base64,UklGRmIAAABXRUJQVlA4IFYAAAAwAQCdASoIAAUAAUAmJaQAA3AA/vx5nAAA/uX3L5B5mR5s3h9n189o9D0Nnv/qJ/93sAf//1kP/+cIIf//2I//97kf///eP///zGf//42gAA=="
                                        unoptimized
                                    />
                                    {/* Gradient bottom sáng hơn để không làm tối nền */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/70 via-[#020617]/20 to-transparent" />
                                    {/* Poster nhỏ góc trái dưới */}
                                    <Link href={`/phim/${movie.slug}`} className="absolute bottom-3 left-3 w-[72px] h-[100px] rounded-xl overflow-hidden shadow-xl ring-1 ring-white/15 shrink-0">
                                        <Image src={posterImg} alt="" fill className="object-cover" sizes="80px"
                                            placeholder="blur"
                                            blurDataURL="data:image/webp;base64,UklGRmIAAABXRUJQVlA4IFYAAAAwAQCdASoIAAUAAUAmJaQAA3AA/vx5nAAA/uX3L5B5mR5s3h9n189o9D0Nnv/qJ/93sAf//1kP/+cIIf//2I//97kf///eP///zGf//42gAA=="
                                            unoptimized
                                        />
                                    </Link>
                                    {/* Badges góc phải dưới (để tránh overlap notch và header phía trên) */}
                                    <div className="absolute bottom-3 right-3 flex flex-col items-end gap-1.5 z-40">
                                        {movie.quality && (
                                            <span className="bg-[#F4C84A] text-black text-[10px] font-black px-2 py-0.5 rounded shadow-sm tracking-wide max-w-[64px] truncate">
                                                {formatQualityLabel(movie.quality) || movie.quality}
                                            </span>
                                        )}
                                        {rating && (
                                            <span className="bg-black/70 text-[#F4C84A] text-[10px] font-bold px-2 py-0.5 rounded">★ {rating}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Info block — compact, thêm padding dưới để không dính Khám phá nhanh */}
                                <div className="px-4 pt-2 pb-5 flex flex-col gap-2">
                                    {/* Title + year */}
                                    <div className="pl-[84px]"> {/* align kế bên poster */}
                                        <h1 className="text-[17px] font-black text-white leading-snug line-clamp-2">
                                            {decodeHtml(movie.name)}
                                        </h1>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            {movie.year && <span className="text-[11px] text-gray-400">{movie.year}</span>}
                                            {movie.category?.slice(0, 2).map((c: { id?: string; name?: string }) => (
                                                <span key={c.id} className="text-[11px] text-gray-500">· {c.name}</span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Buttons */}
                                    <div className="flex items-center gap-2 mt-1">
                                        <Link
                                            href={`/xem-phim/${movie.slug}?autoPlay=true`}
                                            className="flex flex-1 items-center justify-center gap-2 h-10 rounded-full bg-[#F4C84A] text-black font-extrabold active:scale-95 transition-transform"
                                        >
                                            <Play className="w-4 h-4 fill-black" />
                                            <span className="text-[13px]">Xem ngay</span>
                                        </Link>

                                        <Link
                                            href={`/phim/${movie.slug}`}
                                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 border border-white/15 active:scale-95 transition-transform shrink-0"
                                        >
                                            <Info className="w-4 h-4 text-white" />
                                        </Link>

                                        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 border border-white/15 active:scale-95 transition-transform shrink-0">
                                            <FavoriteButton movieData={getFavoriteData(movie)} size="sm" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Dot indicators — cách rõ với block dưới */}
                <div className="flex justify-center gap-1.5 pb-4 pt-1">
                    {heroMovies.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => scrollTo(i)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === selectedIndex
                                ? 'w-5 bg-[#F4C84A]'
                                : 'w-1.5 bg-white/20'
                                }`}
                        />
                    ))}
                </div>
            </div>


            {/* ================= DESKTOP LAYOUT (Tablet / Large Screens) ================= */}
            {/* Shows on md screens (>= 768px) for cinematic iPad view */}
            <div className="hidden md:block relative w-full h-[55vh] lg:h-[70vh] xl:h-screen">

                <div className="absolute inset-0 h-full" ref={desktopRef}>
                    <div className="flex h-full touch-pan-y">
                        {heroMovies.map((movie, index) => {
                            const posterImg = getHeroImage(movie, 'poster');
                            const backdropImg = getHeroImage(movie, 'backdrop');

                            return (
                                <div key={movie._id} className="relative flex-[0_0_100%] min-w-0 h-full bg-transparent overflow-hidden">

                                    {/* 1. Cinematic Background */}
                                    <div className="absolute inset-0 z-0 select-none">
                                        {/* Làm overlay sáng hơn để hero không bị đen */}
                                        <div className="absolute inset-0 bg-black/25 z-10 pointer-events-none" />
                                        <Image
                                            src={backdropImg}
                                            alt="bg"
                                            fill
                                            className="object-cover opacity-80 will-change-transform"
                                            priority={index === 0}
                                            unoptimized
                                            placeholder={index === 0 ? "empty" : "blur"}
                                            blurDataURL={index === 0 ? undefined : "data:image/webp;base64,UklGRmIAAABXRUJQVlA4IFYAAAAwAQCdASoIAAUAAUAmJaQAA3AA/vx5nAAA/uX3L5B5mR5s3h9n189o9D0Nnv/qJ/93sAf//1kP/+cIIf//2I//97kf///eP///zGf//42gAA=="}
                                        />
                                        {/* Vignettes for focus (nhẹ hơn, không che quá nhiều) */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/60 via-[#020617]/20 to-transparent z-20 w-2/3 pointer-events-none" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/45 via-transparent to-transparent z-20 h-1/2 bottom-0 top-auto pointer-events-none" />
                                    </div>

                                    {/* 2. Content Container */}
                                    <div className="relative z-30 h-full container max-w-[1600px] mx-auto px-6 md:px-12 lg:px-24 xl:px-32 flex items-center">
                                        <div className="grid grid-cols-12 gap-6 md:gap-8 lg:gap-12 w-full items-center mt-12 md:mt-16">

                                            {/* Left: Info — rút ngắn animation để giảm lag desktop */}
                                            <div className="col-span-12 md:col-span-8 lg:col-span-7 xl:col-span-6 space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">

                                                {/* Meta Badges */}
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <span className="px-3 py-1 rounded bg-[#F4C84A] text-black text-xs font-bold tracking-wider uppercase">
                                                        Phim Hot
                                                    </span>
                                                    {movie.year && (
                                                        <span className="px-3 py-1 rounded border border-white/20 bg-white/5 text-white text-xs font-semibold">
                                                            {movie.year}
                                                        </span>
                                                    )}
                                                    {movie.quality && (
                                                        <span className="px-3 py-1 rounded border border-[#F4C84A]/50 bg-[#F4C84A]/10 text-[#F4C84A] text-xs font-bold border-glow-accent">
                                                            {formatQualityLabel(movie.quality) || movie.quality}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1 text-white/80 text-xs font-medium">
                                                        <span className="text-[#F4C84A]">★</span> {movie.tmdbData?.vote_average?.toFixed(1) || "N/A"}
                                                    </span>
                                                </div>

                                                {/* Title */}
                                                <h1
                                                    className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight drop-shadow-2xl line-clamp-2 lg:line-clamp-3 mb-3 px-1"
                                                    title={decodeHtml(movie.name)}
                                                >
                                                    {decodeHtml(movie.name)}
                                                </h1>

                                                {/* Origin Name & Categories */}
                                                <div className="flex items-center gap-4 mb-5 flex-wrap">
                                                    {movie.origin_name && (
                                                        <h2 className="text-[16px] text-[#F4C84A] font-medium tracking-wide opacity-90 truncate max-w-[200px] sm:max-w-xs" title={decodeHtml(movie.origin_name)}>
                                                            {decodeHtml(movie.origin_name)}
                                                        </h2>
                                                    )}
                                                    <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                                    <div className="flex gap-3 flex-wrap">
                                                        {movie.category?.slice(0, 3).map(c => (
                                                            <span key={c.id} className="text-white/80 hover:text-[#F4C84A] transition-colors cursor-pointer text-xs font-semibold uppercase tracking-wider">
                                                                {c.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Description */}
                                                <p className="text-white/70 text-sm md:text-base leading-relaxed line-clamp-3 font-normal max-w-2xl text-shadow-sm">
                                                    {decodeHtml(stripHtml(movie.content || ""))}
                                                </p>

                                                {/* CTA Buttons - Liquid Glass Container (Desktop) */}
                                                <div className="flex flex-wrap items-center gap-3 p-[6px] glass-pill w-fit mt-4">
                                                    <Link
                                                        href={`/xem-phim/${movie.slug}?autoPlay=true`}
                                                        className="group relative flex items-center justify-center gap-2 h-12 px-6 sm:px-8 rounded-full bg-[#F4C84A] hover:bg-[#ffe58a] text-black font-extrabold text-[15px] transition-all duration-200 hover:scale-105 active:scale-95"
                                                    >
                                                        <Play className="w-5 h-5 fill-black shrink-0" />
                                                        <span className="whitespace-nowrap">Xem Ngay</span>
                                                    </Link>

                                                    <Link
                                                        href={`/phim/${movie.slug}`}
                                                        className="flex items-center justify-center gap-2 h-12 px-5 sm:px-6 rounded-full glass hover:bg-white/15 border border-white/10 text-white font-bold text-[15px] transition-all hover:scale-105 active:scale-95 group/info"
                                                    >
                                                        <Info className="w-5 h-5 text-white/80 group-hover/info:text-[#F4C84A] transition-colors shrink-0" />
                                                        <span className="hidden sm:inline whitespace-nowrap">Chi tiết</span>
                                                    </Link>

                                                    <div className="h-12 w-12 flex items-center justify-center rounded-full glass hover:bg-white/15 border border-white/10 transition-all hover:scale-110 cursor-pointer shrink-0">
                                                        <FavoriteButton movieData={getFavoriteData(movie)} size="md" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: 3D Tilt Poster Card */}
                                            {/* Scaled for both tablets and large screens */}
                                            <div className="col-span-12 md:col-span-4 lg:col-span-5 xl:col-span-6 hidden md:flex justify-end lg:justify-center xl:justify-end pr-0 lg:pr-8 xl:pr-16">
                                                <div className="relative w-[240px] lg:w-[300px] xl:w-[360px] aspect-[2/3] rounded-[24px] lg:rounded-[32px] overflow-hidden ring-1 ring-white/10 group/poster transition-transform duration-300 ease-out hover:scale-[1.02] z-30 will-change-transform transform-gpu shadow-2xl shrink-0">
                                                    <Image
                                                        src={posterImg}
                                                        alt={decodeHtml(movie.name)}
                                                        fill
                                                        className="object-cover transition-transform duration-300 group-hover/poster:scale-105 will-change-transform"
                                                        priority={index === 0}
                                                        unoptimized
                                                        placeholder="blur"
                                                        blurDataURL="data:image/webp;base64,UklGRmIAAABXRUJQVlA4IFYAAAAwAQCdASoIAAUAAUAmJaQAA3AA/vx5nAAA/uX3L5B5mR5s3h9n189o9D0Nnv/qJ/93sAf//1kP/+cIIf//2I//97kf///eP///zGf//42gAA=="
                                                    />
                                                </div>
                                            </div>

                                        </div>
                                    </div>

                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Navigation Arrows (Desktop) */}
                <button onClick={scrollPrev} className="absolute left-8 top-1/2 -translate-y-1/2 z-50 w-16 h-16 rounded-full glass flex items-center justify-center text-white/40 hover:text-black hover:bg-[#F4C84A] hover:border-[#F4C84A] transition-all duration-200 group">
                    <ChevronRight className="w-8 h-8 rotate-180" />
                </button>
                <button onClick={scrollNext} className="absolute right-8 top-1/2 -translate-y-1/2 z-50 w-16 h-16 rounded-full glass flex items-center justify-center text-white/40 hover:text-black hover:bg-[#F4C84A] hover:border-[#F4C84A] transition-all duration-200 group">
                    <ChevronRight className="w-8 h-8" />
                </button>

                {/* Dots Indicator */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 flex gap-4">
                    {heroMovies.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => scrollTo(idx)}
                            className={cn(
                                "h-2 rounded-full transition-all duration-500 ease-out",
                                idx === selectedIndex
                                    ? "w-12 bg-[#F4C84A]"
                                    : "w-2 bg-white/20 hover:bg-white/50"
                            )}
                        />
                    ))}
                </div>
            </div>
        </div >
    );
}
