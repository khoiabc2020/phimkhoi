import { getMoviesByCategory } from "@/services/api";
import MovieRow from "@/components/MovieRow";
import Link from "next/link";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils";

interface RelatedMoviesProps {
    categorySlug: string;
    currentMovieId: string;
    mode?: 'row' | 'vertical';
}

export default async function RelatedMovies({ categorySlug, currentMovieId, mode = 'row' }: RelatedMoviesProps) {
    if (!categorySlug) return null;

    const data = await getMoviesByCategory(categorySlug, 1, 12);
    const movies = data.items?.filter((m: any) => m._id !== currentMovieId) || [];

    if (movies.length === 0) return null;

    if (mode === 'vertical') {
        return (
            <div className="space-y-3 [contain:layout_paint]">
                {movies.slice(0, 5).map((movie: any) => (
                    <Link key={movie._id} href={`/phim/${movie.slug}`}
                        className="flex gap-3 group rounded-xl p-2 transition-all duration-200 hover:bg-white/[0.04]">
                        {/* Poster */}
                        <div className="relative w-16 aspect-[2/3] rounded-lg overflow-hidden shrink-0 ring-1 ring-white/[0.08] group-hover:ring-yellow-400/50 transition-all duration-200 shadow-md">
                            <Image
                                src={getImageUrl(movie.poster_url || movie.thumb_url)}
                                alt={movie.name}
                                fill
                                loading="lazy"
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-center">
                            <h4 className="text-white text-xs font-semibold leading-tight mb-1 group-hover:text-yellow-400 transition-colors line-clamp-2" style={{ fontSize: '13px' }}>
                                {movie.name}
                            </h4>
                            <p className="text-gray-500 text-[11px] mb-1.5 line-clamp-1">{movie.origin_name}</p>
                            <span className="text-[11px] text-gray-400 px-1.5 py-0.5 rounded-md inline-block w-fit"
                                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                {movie.year}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        );
    }

    return (
        <div className="mt-12">
            <MovieRow title="Có thể bạn quan tâm" movies={movies} slug={`/the-loai/${categorySlug}`} />
        </div>
    );
}
