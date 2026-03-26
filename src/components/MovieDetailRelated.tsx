import { getMoviesList } from "@/services/api";
import MovieCard from "./MovieCard";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface MovieDetailRelatedProps {
    categorySlug: string;
    currentMovieSlug: string;
    theme: any;
}

export default async function MovieDetailRelated({
    categorySlug,
    currentMovieSlug,
    theme
}: MovieDetailRelatedProps) {
    const res = await getMoviesList('phim-moi-cap-nhat', { category: categorySlug, limit: 12 });
    const relatedMovies = (res?.items || []).filter((m: any) => m.slug !== currentMovieSlug).slice(0, 8);

    if (relatedMovies.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full" style={{ backgroundColor: theme.primary }} />
                    <h3 className="text-white font-outfit font-extrabold text-[15px] tracking-wider uppercase">Phim đề xuất</h3>
                </div>
                <Link href={`/the-loai/${categorySlug}`} className="text-[10px] font-black text-white/30 hover:text-white uppercase tracking-widest flex items-center gap-1 transition-colors">
                    Xem tất cả <ChevronRight className="w-3 h-3" />
                </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
                {relatedMovies.map((movie: any) => (
                    <MovieCard key={movie._id} movie={movie} variant="compact" />
                ))}
            </div>
        </div>
    );
}
