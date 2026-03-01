import { getTMDBDetails, getTMDBImage, searchTMDBMovie } from "@/services/tmdb";
import Image from "next/image";
import Link from "next/link";

export default async function MovieCast({ movieName, originName, year, isCompact = false }: { movieName: string; originName: string; year: number; isCompact?: boolean }) {
    // 1. Search for the movie to get TMDB ID
    // 2. Fetch details including credits

    const searchResult = await searchTMDBMovie(originName || movieName, year);
    if (!searchResult) return null;

    const details = await getTMDBDetails(searchResult.id);
    if (!details || !details.credits) return null;

    const cast = details.credits.cast.slice(0, 15); // Top 15 cast
    // const director = details.credits.crew.find((p: any) => p.job === "Director");

    if (cast.length === 0) return null;

    if (isCompact) {
        return (
            <div className="flex flex-wrap gap-4 pt-1">
                {cast.slice(0, 8).map((actor: any) => (
                    <Link href={`/dien-vien/${encodeURIComponent(String(actor.name))}`} key={actor.id} className="flex flex-col items-center gap-2 w-[4.5rem] group" title={actor.name}>
                        <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border border-white/10 group-hover:border-[#00B14F] transition-colors relative bg-white/5">
                            {actor.profile_path ? (
                                <Image src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`} alt={actor.name || "Actor"} fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500 text-center leading-tight">N/A</div>
                            )}
                        </div>
                        <p className="text-[11px] text-gray-400 group-hover:text-white transition-colors text-center font-medium leading-tight line-clamp-2 w-full">{actor.name}</p>
                    </Link>
                ))}
            </div>
        );
    }

    return (
        <div className="mt-8">
            <h3 className="text-xl font-bold text-white mb-4 border-l-4 border-yellow-500 pl-3">
                Diễn Viên
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {cast.map((actor: any) => (
                    <Link href={`/dien-vien/${encodeURIComponent(String(actor.name))}`} key={actor.id} className="bg-white/5 rounded-lg p-2 text-center group hover:bg-white/10 transition-colors block">
                        <div className="relative w-24 h-24 mx-auto mb-2 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-yellow-500 transition-colors">
                            {actor.profile_path ? (
                                <Image
                                    src={`https://image.tmdb.org/t/p/w500${actor.profile_path}`}
                                    alt={actor.name || "Actor"}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">
                                    No Image
                                </div>
                            )}
                        </div>
                        <p className="text-white text-sm font-medium truncate group-hover:text-yellow-500 transition-colors">{actor.name}</p>
                        <p className="text-gray-400 text-xs truncate">{actor.character}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
