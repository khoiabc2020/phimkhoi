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
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.06]">
                    <span className="text-base">🔥</span>
                    <h3 className="text-[13px] font-bold uppercase tracking-[0.15em] text-[#8FA7C5]">Phim Hot</h3>
                </div>

                <div className="space-y-1">
                    {movies.slice(0, 8).map((movie: any, index: number) => {
                        const rank = index + 1;
                        const rankColor =
                            rank === 1 ? 'text-[#F5C518]' :
                            rank === 2 ? 'text-[#C0C0C0]' :
                            rank === 3 ? 'text-[#CD7F32]' :
                            'text-white/20';
                        const rankSize =
                            rank <= 3 ? 'text-[22px]' : 'text-[18px]';
                        const quality = movie.quality || movie.lang;

                        return (
                            <Link key={movie._id} href={`/phim/${movie.slug}`}
                                className="flex gap-3 group rounded-lg px-2 py-2 transition-all duration-200 hover:bg-white/[0.04]">
                                {/* Rank number */}
                                <div className={`flex items-center justify-center w-6 shrink-0 font-black font-outfit leading-none select-none ${rankColor} ${rankSize}`}
                                    style={{ minWidth: '24px', textShadow: rank <= 3 ? '0 0 12px currentColor' : 'none' }}>
                                    {rank}
                                </div>
                                {/* Poster */}
                                <div className="relative w-[52px] aspect-[2/3] rounded-md overflow-hidden shrink-0 ring-1 ring-white/[0.08] group-hover:ring-[#8FA7C5]/40 transition-all duration-200 shadow-md">
                                    <Image
                                        src={getPosterImageUrl(movie) || "/placeholder.svg"}
                                        alt={movie.name}
                                        fill
                                        loading="lazy"
                                        quality={60}
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    {quality && (
                                        <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5 text-center"
                                            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)' }}>
                                            <span className="text-[9px] font-bold text-[#8FA7C5] uppercase tracking-wide">{quality}</span>
                                        </div>
                                    )}
                                </div>
                                {/* Info */}
                                <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-center">
                                    <h4 className="text-white text-[12px] font-semibold leading-tight mb-1 group-hover:text-[#8FA7C5] transition-colors line-clamp-2">
                                        {movie.name}
                                    </h4>
                                    <p className="text-white/30 text-[10px] mb-1 line-clamp-1">{movie.origin_name}</p>
                                    <div className="flex items-center gap-1.5">
                                        {movie.year && (
                                            <span className="text-[10px] text-white/40">{movie.year}</span>
                                        )}
                                        {movie.episode_current && movie.type === 'series' && (
                                            <span className="text-[9px] text-[#8FA7C5]/70 font-medium">
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
