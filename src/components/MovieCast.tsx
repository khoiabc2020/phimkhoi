import Image from "next/image";
import Link from "next/link";
import { getActorDetailsFromTMDB } from "@/services/tmdb";

type CastItem = {
    name: string;
    photo: string | null;
    genderLabel?: string;
    originalName?: string | null;
    departmentLabel?: string | null;
};

async function getActorInfo(actorName: string): Promise<CastItem> {
    try {
        const details = await getActorDetailsFromTMDB(actorName);
        if (!details) {
            return { name: actorName, photo: null };
        }

        const photo = details.profile_path
            ? `https://image.tmdb.org/t/p/w185${details.profile_path}`
            : null;

        const genderLabel =
            details.gender === 1 ? "Nữ" :
                details.gender === 2 ? "Nam" :
                    undefined;

        const originalName =
            details.also_known_as && details.also_known_as.length > 0
                ? details.also_known_as[0]
                : null;

        let departmentLabel: string | null = null;
        if (details.known_for_department) {
            if (details.known_for_department === "Acting") departmentLabel = "Diễn viên";
            else if (details.known_for_department === "Directing") departmentLabel = "Đạo diễn";
            else departmentLabel = details.known_for_department;
        }

        return {
            name: actorName,
            photo,
            genderLabel,
            originalName,
            departmentLabel,
        };
    } catch {
        return { name: actorName, photo: null };
    }
}

function ActorInitials({ name }: { name: string }) {
    const parts = name.trim().split(" ");
    const initials = parts.length >= 2
        ? parts[0][0] + parts[parts.length - 1][0]
        : name.slice(0, 2);
    // Pick a consistent but elegant palette based on name hash
    const colors = [
        "from-[#5B8CFF] to-[#3454D1]",
        "from-[#A855F7] to-[#6D28D9]",
        "from-[#10B981] to-[#0F766E]",
        "from-[#EC4899] to-[#BE185D]",
        "from-[#F97316] to-[#C2410C]",
        "from-[#14B8A6] to-[#0F766E]",
    ];
    const colorIdx = (name.charCodeAt(0) || 0) % colors.length;
    return (
        <div className="relative w-full h-full bg-[#1A1D29] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent" />
            <span className="relative text-white/50 font-black text-[14px] uppercase tracking-[4px] drop-shadow-md">
                {initials}
            </span>
        </div>
    );
}

export default async function MovieCast({ 
    movie, 
    slug, 
    isCompact = false,
    tmdbCast = []
}: { 
    movie?: any; 
    slug: string; 
    isCompact?: boolean;
    tmdbCast?: any[];
}) {
    if (!movie) return null;

    // Use source actor list (always correct — from Ophim/KKPhim)
    const safeActors = Array.isArray(movie.actor) ? movie.actor : (typeof movie.actor === 'string' ? movie.actor.split(',').map((s: string) => s.trim()) : []);
    const actorNames: string[] = safeActors
        .filter((a: string) => a && typeof a === 'string' && !a.toLowerCase().includes("đang cập nhật") && !a.toLowerCase().includes("updating"))
        .slice(0, isCompact ? 10 : 20);

    if (actorNames.length === 0) return null;

    // Optimization: Match local actor names with TMDB credits first to avoid global searching
    const cast: CastItem[] = await Promise.all(
        actorNames.map(async (name: string) => {
            // Find a match in the pre-fetched TMDB credits
            // Case 1: Direct name match (e.g. "Kim Ji-won" == "Kim Ji-won")
            // Case 2: Normalized name match (Hán Việt -> Pinyin/English)
            const matchedTmdbActor = tmdbCast.find(a => 
                a.name?.toLowerCase() === name.toLowerCase() || 
                a.original_name?.toLowerCase() === name.toLowerCase()
            );

            if (matchedTmdbActor) {
                return {
                    name,
                    photo: matchedTmdbActor.profile_path ? `https://image.tmdb.org/t/p/w185${matchedTmdbActor.profile_path}` : null,
                    originalName: matchedTmdbActor.original_name,
                    departmentLabel: "Diễn viên"
                };
            }

            // Fallback: Perform global search (expensive, only if not in credits)
            return getActorInfo(name);
        })
    );

    if (isCompact) {
        return (
            <div className="flex flex-wrap gap-3 pt-1">
                {cast.map((actor) => (
                    <Link
                        href={`/dien-vien/${actor.name.toLowerCase().replace(/ /g, '-')}`}
                        key={actor.name}
                        className="flex flex-col items-center gap-2 group w-[4.5rem]"
                        title={actor.name}
                    >
                        <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border border-white/10 group-hover:border-[#8FA7C5]/60 transition-all duration-300 relative bg-[#0c1018] shadow-lg ring-1 ring-white/5">
                            {actor.photo ? (
                                <Image src={actor.photo} alt={actor.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" sizes="56px" quality={82} />
                            ) : (
                                <ActorInitials name={actor.name} />
                            )}
                        </div>
                        <p className="text-[11px] text-gray-400 group-hover:text-white transition-colors text-center font-bold leading-tight line-clamp-2 w-full">
                            {actor.name}
                        </p>
                    </Link>
                ))}
            </div>
        );
    }

    return (
        <div className="w-full relative py-2">
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-4 px-1">
                {cast.map((actor) => (
                    <Link
                        href={`/dien-vien/${actor.name.toLowerCase().replace(/ /g, '-')}`}
                        key={actor.name}
                        className="flex flex-col items-center gap-3 shrink-0 w-[100px] group"
                    >
                        {/* Avatar */}
                        <div className="relative w-20 h-20 rounded-full overflow-hidden border border-white/10 group-hover:border-[#8FA7C5]/60 group-hover:shadow-[0_0_20px_rgba(143,167,197,0.2)] transition-all duration-300">
                            {actor.photo ? (
                                <Image
                                    src={actor.photo}
                                    alt={actor.name}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                    sizes="80px"
                                    quality={82}
                                />
                            ) : (
                                <ActorInitials name={actor.name} />
                            )}
                            {/* Accent Ring */}
                            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 group-hover:ring-white/20 transition-all" />
                        </div>
                        
                        {/* Info */}
                        <div className="text-center px-1">
                            <p className="text-[13px] font-black text-white leading-tight group-hover:text-primary transition-colors line-clamp-2">
                                {actor.name}
                            </p>
                            {actor.originalName && actor.originalName !== actor.name && (
                                <p className="text-[10px] text-gray-500 truncate mt-1 font-medium">
                                    {actor.originalName}
                                </p>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
            
            {/* Gradient Mask for overflow hint */}
            <div className="absolute top-0 right-0 bottom-6 w-12 bg-gradient-to-l from-[#07070b] to-transparent pointer-events-none z-10" />
        </div>
    );
}
