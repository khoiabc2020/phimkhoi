import Image from "next/image";
import Link from "next/link";
import { searchTMDBPerson } from "@/services/tmdb";

async function getActorPhoto(actorName: string): Promise<string | null> {
    try {
        const results = await searchTMDBPerson(actorName);
        if (results && results.length > 0 && results[0].profile_path) {
            return `https://image.tmdb.org/t/p/w185${results[0].profile_path}`;
        }
        return null;
    } catch {
        return null;
    }
}

function ActorInitials({ name }: { name: string }) {
    const parts = name.trim().split(" ");
    const initials = parts.length >= 2
        ? parts[0][0] + parts[parts.length - 1][0]
        : name.slice(0, 2);
    // Pick a consistent color based on name char
    const colors = [
        "from-blue-600 to-blue-800",
        "from-rose-600 to-rose-800",
        "from-violet-600 to-violet-800",
        "from-emerald-600 to-emerald-800",
        "from-orange-600 to-orange-800",
        "from-teal-600 to-teal-800",
    ];
    const colorIdx = (name.charCodeAt(0) || 0) % colors.length;
    return (
        <div className={`w-full h-full bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center`}>
            <span className="text-white font-bold text-[11px] uppercase tracking-wider">{initials}</span>
        </div>
    );
}

export default async function MovieCast({ movie, slug, isCompact = false }: { movie?: any; slug: string; isCompact?: boolean }) {
    if (!movie) return null;

    // Use source actor list (always correct — from Ophim/KKPhim)
    const actorNames: string[] = (movie.actor || [])
        .filter((a: string) => a && !a.toLowerCase().includes("đang cập nhật") && !a.toLowerCase().includes("updating"))
        .slice(0, isCompact ? 8 : 15);

    if (actorNames.length === 0) return null;

    // Fetch photos by actor name individually — decoupled from (potentially wrong) movie TMDB match
    const actorPhotos = await Promise.all(
        actorNames.map((name: string) => getActorPhoto(name))
    );

    const cast = actorNames.map((name: string, i: number) => ({ name, photo: actorPhotos[i] }));

    if (isCompact) {
        return (
            <div className="flex flex-wrap gap-4 pt-1">
                {cast.map((actor) => (
                    <Link
                        href={`/dien-vien/${encodeURIComponent(actor.name)}`}
                        key={actor.name}
                        className="flex flex-col items-center gap-2 w-[4.5rem] group"
                        title={actor.name}
                    >
                        <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border border-white/10 group-hover:border-[#F4C84A] transition-colors relative bg-white/5">
                            {actor.photo ? (
                                <Image src={actor.photo} alt={actor.name} fill className="object-cover" unoptimized />
                            ) : (
                                <ActorInitials name={actor.name} />
                            )}
                        </div>
                        <p className="text-[11px] text-gray-400 group-hover:text-white transition-colors text-center font-medium leading-tight line-clamp-2 w-full">
                            {actor.name}
                        </p>
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
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                {cast.map((actor) => (
                    <Link
                        href={`/dien-vien/${encodeURIComponent(actor.name)}`}
                        key={actor.name}
                        className="bg-white/5 rounded-lg p-2 text-center group hover:bg-white/10 transition-colors block"
                    >
                        <div className="relative w-24 h-24 mx-auto mb-2 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-yellow-500 transition-colors">
                            {actor.photo ? (
                                <Image src={actor.photo} alt={actor.name} fill className="object-cover" unoptimized />
                            ) : (
                                <ActorInitials name={actor.name} />
                            )}
                        </div>
                        <p className="text-white text-sm font-medium truncate group-hover:text-yellow-500 transition-colors">{actor.name}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
