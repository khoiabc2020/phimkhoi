import Image from "next/image";
import Link from "next/link";
import { getActorDetailsFromTMDB } from "@/app/actions/tmdb";

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
        <div className={`relative w-full h-full bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.28),transparent_45%)]" />
            <span className="relative text-white font-black text-[12px] uppercase tracking-wide drop-shadow-md">
                {initials}
            </span>
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

    // Fetch richer TMDB info per actor so we can render "mini actor cards"
    const cast: CastItem[] = await Promise.all(
        actorNames.map((name: string) => getActorInfo(name))
    );

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
                        <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border border-white/15 group-hover:border-[#F4C84A] transition-colors relative bg-white/5 ring-1 ring-white/5 group-hover:ring-[#F4C84A]/40">
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
            <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-5 bg-[#F4C84A] rounded-full" />
                <h3 className="text-xl font-bold text-white">Diễn Viên</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {cast.map((actor) => (
                    <Link
                        href={`/dien-vien/${encodeURIComponent(actor.name)}`}
                        key={actor.name}
                        className="relative flex items-center gap-3 bg-white/5 rounded-lg p-3 group hover:bg-white/10 transition-colors border border-white/5 hover:border-[#F4C84A]/60"
                    >
                        <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-[#F4C84A] transition-colors shrink-0">
                            {actor.photo ? (
                                <Image src={actor.photo} alt={actor.name} fill className="object-cover" unoptimized />
                            ) : (
                                <ActorInitials name={actor.name} />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate group-hover:text-[#F4C84A] transition-colors">
                                {actor.name}
                            </p>
                            {actor.originalName && actor.originalName !== actor.name && (
                                <p className="text-xs text-gray-400 truncate italic mt-0.5">
                                    {actor.originalName}
                                </p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-gray-400">
                                {actor.departmentLabel && (
                                    <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 uppercase tracking-wide">
                                        {actor.departmentLabel}
                                    </span>
                                )}
                                {actor.genderLabel && (
                                    <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                                        {actor.genderLabel}
                                    </span>
                                )}
                            </div>
                        </div>
                        <span className="hidden sm:inline text-[11px] font-semibold text-gray-400 group-hover:text-[#F4C84A] transition-colors ml-2">
                            Xem trang
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
