import { searchTMDBMovie, getTMDBDetails, getTMDBImage } from "@/services/tmdb";
import { Star, Clock, User, Film } from "lucide-react";
import { getImageUrl, cn } from "@/lib/utils";
import Image from "next/image";

interface MovieDetailTMDBInfoProps {
    movieName: string;
    movieYear?: number;
    movieOriginName?: string;
    type: 'movie' | 'tv';
    countrySlug?: string;
    theme: any;
}

export default async function MovieDetailTMDBInfo({
    movieName,
    movieYear,
    movieOriginName,
    type,
    countrySlug,
    theme
}: MovieDetailTMDBInfoProps) {
    const tmdbSearch = await searchTMDBMovie(
        movieOriginName || movieName,
        movieYear ? parseInt(movieYear.toString().split("-")[0]) : undefined,
        type,
        { originalName: movieOriginName, localName: movieName, countrySlug }
    ).catch((): null => null);

    const tmdbDetails = tmdbSearch
        ? await getTMDBDetails(tmdbSearch.id, type).catch((): null => null)
        : null;
    const rating = tmdbDetails?.vote_average ? Number(tmdbDetails.vote_average).toFixed(1) : "9.7";
    const tmdbBackdrop = tmdbDetails?.backdrop_path ? getTMDBImage(tmdbDetails.backdrop_path, "original") : null;

    return (
        <div className="flex flex-col gap-1 items-center md:items-start animate-in fade-in duration-700">
            {/* Ambient Backdrop Enrichment (Client-side would be better but server-side with Suspense is OK) */}
            {tmdbBackdrop && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 opacity-30 blur-[100px] saturate-[2]">
                    <Image
                        src={tmdbBackdrop}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="100vw"
                        quality={10}
                    />
                </div>
            )}
            
            <div className="flex items-center gap-1.5 mb-1.5">
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-400 text-black text-[11px] font-black leading-none drop-shadow-md">
                   <Star className="w-3.5 h-3.5 fill-current" />
                   {rating}
                </div>
                {(tmdbDetails?.runtime ?? 0) > 0 && (
                    <span className="text-[11px] font-bold text-white/50 tracking-wider">
                        • {tmdbDetails.runtime} phút
                    </span>
                )}
            </div>
        </div>
    );
}
