import { getTMDBPersonDetails, getTMDBPersonCredits, getTMDBImage, searchTMDBPerson } from "@/services/tmdb";
import { getMoviesByActor } from "@/services/api";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { ChevronLeft, Star, Calendar, MapPin, Info, Grid, Clock, Share2, Globe } from "lucide-react";
import { checkFavoriteActor } from "@/app/actions/actorFavorites";
import MovieCard from "@/components/MovieCard";
import FavoriteActorButton from "@/components/FavoriteActorButton";
import Footer from "@/components/Footer";

export const revalidate = 3600; // 1h — actor profiles change rarely

function slugToName(slug: string): string {
    return slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const name = slugToName(slug);
    const canonical = `https://khoiphim.org/dien-vien/${slug}`;
    return {
        title: `${name} - Diễn Viên | KHOIPHIM`,
        description: `Xem phim của diễn viên ${name} vietsub HD miễn phí. Toàn bộ phim ${name} đóng được cập nhật tại KHOIPHIM.`,
        keywords: `${name}, diễn viên ${name}, phim của ${name}, ${name} vietsub`,
        alternates: { canonical },
        robots: { index: true, follow: true },
        openGraph: {
            title: `${name} | Diễn Viên - KHOIPHIM`,
            description: `Toàn bộ phim của ${name} - vietsub HD miễn phí tại KHOIPHIM.`,
            url: canonical,
            type: "profile",
        },
    };
}

interface PersonPageProps {
    params: Promise<{ slug: string }>;
    searchParams?: Promise<{ view?: string }>;
}

export default async function PersonPage({ params, searchParams }: PersonPageProps) {
    const { slug } = await params;
    const sParams = await searchParams;
    const view = sParams?.view === 'local' ? 'local' : sParams?.view === 'timeline' ? 'timeline' : 'global';
    const name = slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

    try {
        // 1. Search for the person to get ID
        const searchResults = await searchTMDBPerson(name).catch((): any[] => []);
        const person = searchResults?.[0];

        if (!person) {
            return (
                <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center pt-20">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold mb-4">Không tìm thấy diễn viên</h1>
                        <Link href="/" className="text-primary hover:underline">Quay lại trang chủ</Link>
                    </div>
                </div>
            );
        }

        // 2. Fetch TMDB details first to get the official name
        const detailsData = await getTMDBPersonDetails(person.id).catch((): null => null);
        const details = detailsData as any;

        if (!details) return (
            <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center pt-20">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Không thể tải thông tin diễn viên</h1>
                    <Link href="/" className="text-primary hover:underline">Quay lại trang chủ</Link>
                </div>
            </div>
        );

        // 3. Fetch credits, local movies, and favorite status in parallel — each with individual catch
        const [creditsData, localData, favResult] = await Promise.all([
            getTMDBPersonCredits(person.id).catch((): null => null),
            getMoviesByActor(details.name, 1, 50).catch((): { items: any[] } => ({ items: [] })),
            checkFavoriteActor(details.name).catch((): { isFavorite: boolean } => ({ isFavorite: false })),
        ]);
        const credits = creditsData as any;

        // 4. Filter and sort credits
        const globalFilmography = (credits?.cast || [])
            .filter((m: any) => m.poster_path || m.backdrop_path)
            .slice(0, 50);

        const localFilmography = (localData as any)?.items || [];
        const isFavorite = (favResult as any)?.isFavorite;

        // Calculate age from birthday
        let age: number | null = null;
        if (details.birthday) {
            const born = new Date(details.birthday);
            const today = new Date();
            age = today.getFullYear() - born.getFullYear();
            const m = today.getMonth() - born.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < born.getDate())) age--;
            if (details.deathday) {
                const died = new Date(details.deathday);
                age = died.getFullYear() - born.getFullYear();
                const md = died.getMonth() - born.getMonth();
                if (md < 0 || (md === 0 && died.getDate() < born.getDate())) age--;
            }
        }

        // Group globalFilmography by year for timeline view
        const timelineByYear: Record<string, any[]> = {};
        for (const m of globalFilmography) {
            const yr = (m.release_date || m.first_air_date || '').substring(0, 4) || 'Không rõ';
            if (!timelineByYear[yr]) timelineByYear[yr] = [];
            timelineByYear[yr].push(m);
        }
        const timelineYears = Object.keys(timelineByYear).sort((a, b) => (b === 'Không rõ' ? -1 : a === 'Không rõ' ? 1 : Number(b) - Number(a)));


    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden">

            {/* ── HERO ── */}
            <div className="relative pt-20 md:pt-32 pb-6 md:pb-12 px-4 md:px-8 max-w-[1400px] mx-auto z-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[400px] bg-primary/8 blur-[100px] -z-10 opacity-25 pointer-events-none" />

                {/* Mobile: horizontal card | Desktop: side-by-side large */}
                <div className="flex flex-row md:flex-row gap-4 md:gap-12 items-start">

                    {/* Photo */}
                    <div className="shrink-0 w-[110px] md:w-[280px]">
                        <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                            <Image
                                src={getTMDBImage(details.profile_path, "h632") || "/placeholder-avatar.jpg"}
                                alt={details.name}
                                fill
                                className="object-cover"
                                unoptimized
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                        </div>

                        {/* Action buttons — below photo on mobile */}
                        <div className="mt-3 flex flex-col gap-2">
                            <FavoriteActorButton actorName={details.name} initialIsFavorite={isFavorite} />
                            <button className="flex items-center justify-center gap-1.5 py-2 rounded-lg font-semibold text-[12px] bg-white/5 hover:bg-white/10 text-white/60 transition-all border border-white/[0.08] active:scale-95">
                                <Share2 className="w-3.5 h-3.5" /> Chia sẻ
                            </button>
                        </div>
                    </div>

                    {/* Bio */}
                    <div className="flex-1 min-w-0 pt-1 md:pt-4">
                        {/* Name */}
                        <h1 className="text-[22px] md:text-6xl font-black text-white tracking-tight leading-tight mb-2 md:mb-4">
                            {details.name}
                        </h1>

                        {/* Meta pills */}
                        <div className="flex flex-col gap-1.5 mb-3 md:mb-6">
                            {details.birthday && (
                                <div className="flex items-center gap-1.5 text-white/40 text-[11px] md:text-[13px] font-medium">
                                    <Calendar className="w-3 h-3 md:w-4 md:h-4 text-[#8FA7C5] shrink-0" />
                                    <span>{details.birthday}</span>
                                    {age !== null && <span className="text-[#8FA7C5] font-bold">· {age} tuổi</span>}
                                </div>
                            )}
                            {details.place_of_birth && (
                                <div className="flex items-center gap-1.5 text-white/35 text-[11px] md:text-[13px] font-medium">
                                    <MapPin className="w-3 h-3 md:w-4 md:h-4 text-[#8FA7C5] shrink-0" />
                                    <span className="line-clamp-1">{details.place_of_birth}</span>
                                </div>
                            )}
                        </div>

                        {/* Stats row — compact on mobile */}
                        <div className="grid grid-cols-3 gap-1.5 md:gap-4 mb-3 md:mb-6">
                            <div className="p-2.5 md:p-5 rounded-lg md:rounded-xl bg-white/[0.04] border border-white/[0.07]">
                                <div className="text-white/30 text-[9px] md:text-[10px] uppercase font-bold tracking-wider mb-1">Giới tính</div>
                                <div className="text-[13px] md:text-lg font-black text-white/90">{details.gender === 1 ? "Nữ" : "Nam"}</div>
                            </div>
                            <div className="p-2.5 md:p-5 rounded-lg md:rounded-xl bg-white/[0.04] border border-white/[0.07]">
                                <div className="text-white/30 text-[9px] md:text-[10px] uppercase font-bold tracking-wider mb-1">Nghề nghiệp</div>
                                <div className="text-[12px] md:text-lg font-black text-[#8FA7C5] leading-tight">{details.known_for_department === 'Acting' ? 'Diễn viên' : (details.known_for_department || '—')}</div>
                            </div>
                            <div className="p-2.5 md:p-5 rounded-lg md:rounded-xl bg-white/[0.04] border border-white/[0.07]">
                                <div className="text-white/30 text-[9px] md:text-[10px] uppercase font-bold tracking-wider mb-1">Độ hot</div>
                                <div className="text-[13px] md:text-lg font-black text-white/90 flex items-center gap-1">
                                    <Star className="w-3 h-3 md:w-4 md:h-4 fill-[#8FA7C5] text-[#8FA7C5] shrink-0" />
                                    {details.popularity?.toFixed(1)}
                                </div>
                            </div>
                        </div>

                        {/* Biography — hidden on mobile unless expanded, shown on desktop */}
                        {details.biography && (
                            <div className="hidden md:block">
                                <p className="text-white/55 leading-relaxed text-[15px] line-clamp-6">
                                    {details.biography}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Biography — mobile only, below the row */}
                {details.biography && (
                    <div className="mt-4 md:hidden">
                        <p className="text-[13px] text-white/50 leading-relaxed line-clamp-4">
                            {details.biography}
                        </p>
                    </div>
                )}
            </div>

            {/* ── FILMOGRAPHY ── */}
            <div className="max-w-[1400px] mx-auto px-3 md:px-8 pb-12 relative z-10">
                {/* Section header + tabs */}
                <div className="flex items-center justify-between gap-3 mb-5 md:mb-8 border-b border-white/[0.06] pb-4">
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="w-1 h-5 bg-[#8FA7C5] rounded-full" />
                        <h2 className="text-[15px] md:text-2xl font-bold text-white">Sự nghiệp</h2>
                    </div>

                    {/* Scrollable tab bar on mobile */}
                    <div className="flex items-center gap-1 p-1 bg-white/[0.04] border border-white/[0.07] rounded-xl overflow-x-auto scrollbar-hide shrink-0 max-w-[calc(100vw-140px)] md:max-w-none">
                        <Link
                            href={`/dien-vien/${slug}`}
                            className={`flex items-center gap-1.5 px-3 md:px-5 py-1.5 rounded-lg text-[11px] md:text-[13px] font-bold whitespace-nowrap transition-all shrink-0 ${view === 'global' ? 'bg-[#8FA7C5] text-black' : 'text-white/40 hover:text-white'}`}
                        >
                            <Globe className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
                            <span className="hidden xs:inline md:inline">Quốc tế</span>
                        </Link>
                        <Link
                            href={`/dien-vien/${slug}?view=local`}
                            className={`flex items-center gap-1.5 px-3 md:px-5 py-1.5 rounded-lg text-[11px] md:text-[13px] font-bold whitespace-nowrap transition-all shrink-0 ${view === 'local' ? 'bg-[#8FA7C5] text-black' : 'text-white/40 hover:text-white'}`}
                        >
                            <Grid className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
                            <span className="hidden xs:inline md:inline">KHOIPHIM</span>
                        </Link>
                        <Link
                            href={`/dien-vien/${slug}?view=timeline`}
                            className={`flex items-center gap-1.5 px-3 md:px-5 py-1.5 rounded-lg text-[11px] md:text-[13px] font-bold whitespace-nowrap transition-all shrink-0 ${view === 'timeline' ? 'bg-[#8FA7C5] text-black' : 'text-white/40 hover:text-white'}`}
                        >
                            <Clock className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
                            <span className="hidden xs:inline md:inline">Thời gian</span>
                        </Link>
                    </div>
                </div>

                {view === 'timeline' ? (
                    <div className="relative pl-8 md:pl-12">
                        {/* Vertical timeline line */}
                        <div className="absolute left-3 md:left-5 top-0 bottom-0 w-px bg-gradient-to-b from-[#8FA7C5]/40 via-[#8FA7C5]/20 to-transparent" />

                        <div className="space-y-10">
                            {timelineYears.map((yr) => (
                                <div key={yr} className="relative">
                                    {/* Year dot + label */}
                                    <div className="absolute -left-8 md:-left-12 flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-[#8FA7C5] shadow-[0_0_10px_rgba(143,167,197,0.6)] border-2 border-[#0a0a0a] shrink-0" />
                                    </div>
                                    <div className="mb-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#8FA7C5]/10 border border-[#8FA7C5]/20">
                                        <span className="text-[#8FA7C5] font-black text-sm tracking-widest">{yr}</span>
                                        <span className="text-white/30 text-xs">{timelineByYear[yr].length} phim</span>
                                    </div>

                                    {/* Movies grid for this year */}
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                                        {timelineByYear[yr].map((movie: any) => (
                                            <Link
                                                href={`/tim-kiem?keyword=${encodeURIComponent(movie.title || movie.name)}`}
                                                key={movie.id}
                                                className="group"
                                            >
                                                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#0c0c14] border border-white/5 group-hover:border-[#8FA7C5]/50 transition-all duration-300 shadow-lg">
                                                    <Image
                                                        src={getTMDBImage(movie.poster_path, "w185") || "/placeholder-poster.jpg"}
                                                        alt={movie.title || movie.name}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                        unoptimized
                                                    />
                                                    {movie.vote_average > 0 && (
                                                        <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 px-1 py-0.5 rounded bg-black/80 text-yellow-400 text-[9px] font-bold">
                                                            <Star className="w-2 h-2 fill-yellow-400" />
                                                            {movie.vote_average.toFixed(1)}
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="mt-1.5 text-[10px] text-white/60 group-hover:text-[#8FA7C5] transition-colors line-clamp-1 font-medium leading-tight">
                                                    {movie.title || movie.name}
                                                </p>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : view === 'global' ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-5">
                        {globalFilmography.map((movie: any) => (
                            <Link 
                                href={`/tim-kiem?keyword=${encodeURIComponent(movie.title || movie.name)}`} // Fix: robust routing to search instead of guessing slug
                                key={movie.id} 
                                className="group"
                            >
                                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#0c0c14] border border-white/5 group-hover:border-[#8FA7C5]/50 transition-all duration-300 shadow-2xl ring-1 ring-white/5 group-hover:ring-[#8FA7C5]/30">
                                    <Image 
                                        src={getTMDBImage(movie.poster_path, "w342") || "/placeholder-poster.jpg"} 
                                        alt={movie.title || movie.name} 
                                        fill 
                                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                                        unoptimized
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                        <div className="flex items-center gap-1.5 text-yellow-400 text-xs font-bold mb-1">
                                            <Star className="w-3 h-3 fill-yellow-400" />
                                            {movie.vote_average?.toFixed(1)}
                                        </div>
                                        <p className="text-[10px] text-white/60 font-medium">Bắt đầu xem</p>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <h3 className="text-[11px] md:text-sm font-semibold text-white/90 group-hover:text-primary transition-colors line-clamp-1">
                                        {movie.title || movie.name}
                                    </h3>
                                    <p className="text-[10px] md:text-xs text-white/40 mt-0.5">
                                        {movie.release_date || movie.first_air_date ? (movie.release_date || movie.first_air_date).substring(0, 4) : "-"}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : localFilmography.length === 0 ? (
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-8 md:p-20 text-center flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-white/[0.03] rounded-full flex items-center justify-center mb-6">
                            <Info className="w-10 h-10 text-white/20" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Chưa có phim trên hệ thống</h3>
                        <p className="text-white/40 text-sm max-w-sm">Hiện tại chưa tìm thấy phim nào của {details.name} đang có sẵn tại KHOIPHIM. Hãy thử quay lại sau nhé!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-5">
                        {localFilmography.map((movie: any) => (
                            <MovieCard key={movie._id} movie={movie} />
                        ))}
                    </div>
                )}
            </div>

            <Footer />
        </main>
    );
    } catch (err) {
        console.error('[ActorPage] Error:', err);
        return (
            <div className="min-h-screen bg-[#080b12] text-white flex items-center justify-center pt-20">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Không thể tải trang diễn viên</h1>
                    <Link href="/" className="text-primary hover:underline">Quay lại trang chủ</Link>
                </div>
            </div>
        );
    }
}
