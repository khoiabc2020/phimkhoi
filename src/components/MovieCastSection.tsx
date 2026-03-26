import { getMovieCast } from "@/app/actions/tmdb";

interface MovieCastSectionProps {
    movieName: string;
    movieYear?: number;
    originalName?: string;
    localName?: string;
    countrySlug?: string;
    localizedActors?: string[];
}

export default async function MovieCastSection({
    movieName,
    movieYear,
    originalName,
    localName,
    countrySlug,
    localizedActors
}: MovieCastSectionProps) {
    const cast = await getMovieCast(movieName, movieYear, 'movie', localizedActors, {
        originalName,
        localName,
        countrySlug
    });

    if (!cast || cast.length === 0) return null;

    return (
        <div className="mt-4">
            <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Diễn viên</h4>
            <div className="flex flex-wrap gap-1.5">
                {cast.slice(0, 10).map((actor: any) => (
                    <span key={actor.id}
                        className="text-xs px-2.5 py-1 rounded-full text-gray-200 border border-white/[0.10]"
                        style={{ background: "rgba(255,255,255,0.06)" }}>
                        {actor.name}
                    </span>
                ))}
            </div>
        </div>
    );
}
