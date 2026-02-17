import { getMoviesByCategory } from "@/services/api";
import MovieRow from "@/components/MovieRow";
import Link from "next/link";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils";

interface RelatedMoviesProps {
    categorySlug: string;
    currentMovieId: string;
    mode?: 'row' | 'vertical'; // 'row' uses MovieRow (horizontal), 'vertical' uses sidebar list
}

export default async function RelatedMovies({ categorySlug, currentMovieId, mode = 'row' }: RelatedMoviesProps) {
    if (!categorySlug) return null;

    const data = await getMoviesByCategory(categorySlug, 1, 12);
    // Filter out current movie
    const movies = data.items?.filter((m: any) => m._id !== currentMovieId) || [];

    if (movies.length === 0) return null;

    if (mode === 'vertical') {
        return (
            <div className="space-y-4">
                {movies.map((movie: any) => (
                    <Link key={movie._id} href={`/phim/${movie.slug}`} className="flex gap-3 group">
                        <div className="relative w-16 aspect-[2/3] rounded overflow-hidden shrink-0 border border-white/10 group-hover:border-yellow-500 transition-colors">
                            <Image
                                src={getImageUrl(movie.poster_url || movie.thumb_url)}
                                alt={movie.name}
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div className="flex-1 min-w-0 py-0.5">
                            <h4 className="text-white text-xs font-bold leading-tight mb-1 group-hover:text-yellow-500 transition-colors line-clamp-2">{movie.name}</h4>
                            <p className="text-gray-500 text-[10px] mb-1 line-clamp-1">{movie.origin_name}</p>
                            <span className="text-[10px] text-gray-400 border border-white/10 px-1 py-0.5 rounded bg-white/5">{movie.year}</span>
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
