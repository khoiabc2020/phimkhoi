import Link from "next/link";
import Image from "next/image";
import { Movie } from "@/services/api";

interface FeaturedActorsProps {
    movies: Movie[];
}

function nameToSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "d")
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

export default function FeaturedActors({ movies }: FeaturedActorsProps) {
    const actorCounts: Record<string, number> = {};
    for (const movie of movies) {
        for (const actor of movie.actor || []) {
            const name = actor.trim();
            if (!name || name.length < 2) continue;
            actorCounts[name] = (actorCounts[name] || 0) + 1;
        }
    }

    const featuredActors = Object.entries(actorCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 12)
        .map(([name]) => name);

    if (featuredActors.length < 3) return null;

    return (
        <div className="mb-8">
            <div className="flex items-center gap-2.5 mb-4">
                <span className="h-5 w-1 rounded-full bg-[#8FA7C5]" />
                <h2 className="text-[16px] md:text-[18px] font-bold text-white tracking-tight">
                    Diễn viên nổi bật
                </h2>
            </div>

            <div className="flex gap-5 md:gap-6 overflow-x-auto no-scrollbar pb-1">
                {featuredActors.map((name) => {
                    const slug = nameToSlug(name);
                    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0d1520&color=8FA7C5&size=128&bold=true&font-size=0.45`;
                    return (
                        <Link
                            key={name}
                            href={`/dien-vien/${slug}`}
                            className="flex flex-col items-center gap-2 shrink-0 group"
                        >
                            <div className="relative w-14 h-14 md:w-[60px] md:h-[60px] rounded-full overflow-hidden border-2 border-white/10 group-hover:border-[#8FA7C5]/60 transition-all duration-200 group-hover:scale-105 shadow-lg group-hover:shadow-[0_0_14px_rgba(143,167,197,0.25)]">
                                <Image
                                    src={avatarUrl}
                                    alt={name}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>
                            <p className="text-[11px] font-medium text-white/50 group-hover:text-white/80 transition-colors text-center max-w-[60px] md:max-w-[72px] line-clamp-2 leading-tight">
                                {name}
                            </p>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
