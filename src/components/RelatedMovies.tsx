import { getMoviesByCategory } from "@/services/api";
import MovieRow from "@/components/MovieRow";

export default async function RelatedMovies({ categorySlug, currentMovieId }: { categorySlug: string, currentMovieId: string }) {
    if (!categorySlug) return null;

    const data = await getMoviesByCategory(categorySlug, 1, 12);

    // Filter out current movie
    const movies = data.items?.filter((m: any) => m._id !== currentMovieId) || [];

    if (movies.length === 0) return null;

    return (
        <div className="mt-12">
            <MovieRow title="Có thể bạn quan tâm" movies={movies} slug={`/the-loai/${categorySlug}`} />
        </div>
    );
}
