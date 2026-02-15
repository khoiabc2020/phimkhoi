import { getTMDBDetails, getTMDBImage, searchTMDBMovie } from "@/services/tmdb";
import Image from "next/image";

export default async function MovieCast({ movieName, originName, year }: { movieName: string; originName: string; year: number }) {
    // 1. Search for the movie to get TMDB ID
    // 2. Fetch details including credits

    const searchResult = await searchTMDBMovie(originName || movieName, year);
    if (!searchResult) return null;

    const details = await getTMDBDetails(searchResult.id);
    if (!details || !details.credits) return null;

    const cast = details.credits.cast.slice(0, 15); // Top 15 cast
    // const director = details.credits.crew.find((p: any) => p.job === "Director");

    if (cast.length === 0) return null;

    return (
        <div className="mt-8">
            <h3 className="text-xl font-bold text-white mb-4 border-l-4 border-yellow-500 pl-3">
                Diễn Viên
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {cast.map((actor: any) => (
                    <div key={actor.id} className="bg-white/5 rounded-lg p-2 text-center group hover:bg-white/10 transition-colors">
                        <div className="relative w-24 h-24 mx-auto mb-2 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-yellow-500 transition-colors">
                            {actor.profile_path ? (
                                <Image
                                    src={getTMDBImage(actor.profile_path, "w500")!}
                                    alt={actor.name}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">
                                    No Image
                                </div>
                            )}
                        </div>
                        <p className="text-white text-sm font-medium truncate">{actor.name}</p>
                        <p className="text-gray-400 text-xs truncate">{actor.character}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
