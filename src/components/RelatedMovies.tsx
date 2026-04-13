import { getRelatedMoviesForMovie } from "@/services/server-movies";
import MovieRow from "@/components/MovieRow";
import Link from "next/link";
import Image from "next/image";
import { getPosterImageUrl } from "@/lib/utils";

interface RelatedMoviesProps {
    categorySlug: string;
    currentMovieId?: string;
    currentMovieSlug?: string;
    countrySlug?: string;
    mode?: 'row' | 'vertical';
}

export default async function RelatedMovies({
    categorySlug,
    currentMovieId,
    currentMovieSlug,
    countrySlug,
    mode = 'row',
}: RelatedMoviesProps) {
    if (!categorySlug) return null;

    const movies = await getRelatedMoviesForMovie({
        categorySlug,
        currentMovieSlug: currentMovieSlug || currentMovieId || "",
        countrySlug,
        limit: mode === 'vertical' ? 8 : 12,
    });

    if (movies.length === 0) return null;

    if (mode === 'vertical') {
        return (
            <div className="[contain:layout_paint]">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50">Phim Đề Xuất</h3>
                </div>

                <div className="space-y-0.5">
                    {movies.slice(0, 8).map((movie: any, index: number) => {
                        const rank = index + 1;
                        const rankColor =
                            rank === 1 ? 'text-[#F5C518]' :
                            rank === 2 ? 'text-[#A8A8A8]' :
                            rank === 3 ? 'text-[#B87333]' :
                            'text-white/15';
                        const rankSize =
                            rank <= 3 ? 'text-[20px]' : 'text-[16px]';
                        const quality = movie.quality || movie.lang;

                        return (
                            <Link key={movie._id} href={`/phim/${movie.slug}`}
                                className="flex gap-3 group rounded-md px-2 py-2.5 transition-all duration-150 hover:bg-white/[0.04]">
                                {/* Rank number */}
                                <div className={`flex items-center justify-center shrink-0 font-black font-outfit leading-none select-none tabular-nums ${rankColor} ${rankSize}`}
                                    style={{ minWidth: '22px' }}>
                                    {rank}
                                </div>
                                {/* Poster — wider for better visibility */}
                                <div className="relative w-[62px] aspect-[2/3] rounded-md overflow-hidden shrink-0 ring-1 ring-white/[0.07] group-hover:ring-[#8FA7C5]/35 transition-all duration-200">
                                    <Image
                                        src={getPosterImageUrl(movie) || "/placeholder.svg"}
                                        alt={movie.name}
                                        fill
                                        loading="lazy"
                                        quality={65}
                                        className="object-cover group-hover:scale-[1.04] transition-transform duration-400"
                                    />
                                    {quality && (
                                        <div className="absolute bottom-0 left-0 right-0 px-1 pt-3 pb-0.5"
                                            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)' }}>
                                            <span className="text-[8px] font-bold text-white/70 uppercase tracking-wide">{quality}</span>
                                        </div>
                                    )}
                                </div>
                                {/* Info */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                                    <h4 className="text-white/90 text-[12px] font-semibold leading-snug group-hover:text-[#8FA7C5] transition-colors line-clamp-2">
                                        {movie.name}
                                    </h4>
                                    <p className="text-white/25 text-[10px] line-clamp-1">{movie.origin_name}</p>
                                    <div className="flex items-center gap-1.5">
                                        {movie.year && (
                                            <span className="text-[10px] text-white/35">{movie.year}</span>
                                        )}
                                        {movie.episode_current && movie.type === 'series' && (
                                            <span className="text-[9px] text-[#8FA7C5]/60 font-medium">
                                                {movie.episode_current}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="mt-12">
            <MovieRow title="Có thể bạn quan tâm" movies={movies} slug={`/the-loai/${categorySlug}`} />
        </div>
    );
}
