import { getTMDBPersonDetails, getTMDBPersonCredits, getTMDBImage, searchTMDBPerson } from "@/services/tmdb";
import { getMoviesByActor } from "@/services/api";
import Image from "next/image";
import Link from "next/link";
import { Star, Share2, Globe, Grid, Info, Calendar, MapPin } from "lucide-react";
import { checkFavoriteActor } from "@/app/actions/actorFavorites";
import MovieCard from "@/components/MovieCard";
import FavoriteActorButton from "@/components/FavoriteActorButton";
import Footer from "@/components/Footer";

interface PersonPageProps {
    params: Promise<{ slug: string }>;
    searchParams?: Promise<{ view?: string }>;
}

function calcAge(birthday: string): number | null {
    if (!birthday) return null;
    const birth = new Date(birthday);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age > 0 ? age : null;
}

export default async function PersonPage({ params, searchParams }: PersonPageProps) {
    const { slug } = await params;
    const sParams = await searchParams;
    const view = sParams?.view === 'local' ? 'local' : 'global';
    const name = slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

    try {
        const searchResults = await searchTMDBPerson(name).catch((): any[] => []);
        const person = searchResults?.[0];

        if (!person) {
            return (
                <div className="min-h-screen bg-[#080b12] text-white flex items-center justify-center pt-20">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold mb-4">Không tìm thấy diễn viên</h1>
                        <Link href="/" className="text-primary hover:underline">Quay lại trang chủ</Link>
                    </div>
                </div>
            );
        }

        const detailsData = await getTMDBPersonDetails(person.id).catch((): null => null);
        const details = detailsData as any;

        if (!details) return (
            <div className="min-h-screen bg-[#080b12] text-white flex items-center justify-center pt-20">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Không thể tải thông tin diễn viên</h1>
                    <Link href="/" className="text-primary hover:underline">Quay lại trang chủ</Link>
                </div>
            </div>
        );

        const [creditsData, localData, favResult] = await Promise.all([
            getTMDBPersonCredits(person.id).catch((): null => null),
            getMoviesByActor(details.name, 1, 50).catch((): { items: any[] } => ({ items: [] })),
            checkFavoriteActor(details.name).catch((): { isFavorite: boolean } => ({ isFavorite: false })),
        ]);
        const credits = creditsData as any;

        const globalFilmography = (credits?.cast || [])
            .filter((m: any) => m.poster_path || m.backdrop_path)
            .slice(0, 50);

        const localFilmography = (localData as any)?.items || [];
        const isFavorite = (favResult as any)?.isFavorite;
        const age = calcAge(details.birthday);
        const department = details.known_for_department === 'Acting' ? 'Diễn viên' : (details.known_for_department || 'Diễn viên');

    return (
        <main className="min-h-screen bg-[#080b12] text-white">

            {/* ── HERO ── */}
            <div className="relative pt-20 md:pt-28 pb-8 px-4 md:px-8 max-w-[1400px] mx-auto">

                {/* bg glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#8FA7C5]/8 blur-[120px] rounded-full -z-10 pointer-events-none" />

                {/* ── MOBILE: horizontal strip ── DESKTOP: vertical photo + bio side-by-side ── */}
                <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-start">

                    {/* Photo col */}
                    <div className="shrink-0 w-full md:w-[280px]">

                        {/* Mobile: horizontal row — photo left, bio right */}
                        <div className="flex flex-row md:flex-col gap-4 md:gap-0 items-start">

                            {/* Photo */}
                            <div className="relative shrink-0 w-[100px] md:w-full aspect-[2/3] rounded-xl md:rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.75)] border border-white/[0.08]">
                                <Image
                                    src={getTMDBImage(details.profile_path, "h632") || "/placeholder-avatar.jpg"}
                                    alt={details.name}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100px, 280px"
                                    quality={88}
                                    priority
                                />
                            </div>

                            {/* Mobile bio (right of photo) */}
                            <div className="flex-1 md:hidden flex flex-col justify-start gap-2 pt-1">
                                <h1 className="text-xl font-black text-white leading-tight tracking-tight">
                                    {details.name}
                                </h1>

                                {/* Compact meta */}
                                <div className="flex flex-col gap-1">
                                    {details.birthday && (
                                        <div className="flex items-center gap-1.5 text-white/40 text-[11px]">
                                            <Calendar className="w-3 h-3 text-[#8FA7C5]" />
                                            <span>{details.birthday}{age ? ` (${age} tuổi)` : ''}</span>
                                        </div>
                                    )}
                                    {details.place_of_birth && (
                                        <div className="flex items-center gap-1.5 text-white/40 text-[11px]">
                                            <MapPin className="w-3 h-3 text-[#8FA7C5]" />
                                            <span className="line-clamp-1">{details.place_of_birth}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Compact stats */}
                                <div className="grid grid-cols-3 gap-1.5 mt-1">
                                    <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                                        <div className="text-[9px] font-black uppercase tracking-wider text-[#8FA7C5]/50 mb-0.5">Giới tính</div>
                                        <div className="text-[11px] font-black text-white/80">{details.gender === 1 ? "Nữ" : "Nam"}</div>
                                    </div>
                                    <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                                        <div className="text-[9px] font-black uppercase tracking-wider text-[#8FA7C5]/50 mb-0.5">Nghề</div>
                                        <div className="text-[11px] font-black text-[#8FA7C5] truncate">{department}</div>
                                    </div>
                                    <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                                        <div className="text-[9px] font-black uppercase tracking-wider text-[#8FA7C5]/50 mb-0.5">Độ hot</div>
                                        <div className="text-[11px] font-black text-white/80 flex items-center gap-0.5">
                                            <Star className="w-2.5 h-2.5 fill-[#8FA7C5] text-[#8FA7C5]" />
                                            {details.popularity?.toFixed(0)}
                                        </div>
                                    </div>
                                </div>

                                {/* Action buttons — horizontal row */}
                                <div className="flex flex-row gap-2 mt-1">
                                    <FavoriteActorButton actorName={details.name} initialIsFavorite={isFavorite} />
                                    <button className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-white/5 hover:bg-white/10 text-white/50 transition-all border border-white/[0.08] active:scale-95 flex-1">
                                        <Share2 className="w-3 h-3" /> Chia sẻ
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Desktop buttons — below photo */}
                        <div className="hidden md:flex mt-5 flex-row gap-2">
                            <FavoriteActorButton actorName={details.name} initialIsFavorite={isFavorite} />
                            <button className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold bg-white/5 hover:bg-white/10 text-white/50 transition-all border border-white/[0.08] active:scale-95 flex-1">
                                <Share2 className="w-3.5 h-3.5" /> Chia sẻ
                            </button>
                        </div>
                    </div>

                    {/* Bio col (desktop only — mobile bio is in-row above) */}
                    <div className="hidden md:flex flex-1 flex-col space-y-6">
                        <div>
                            <h1 className="text-5xl lg:text-7xl font-black text-white mb-4 tracking-tight drop-shadow-2xl">
                                {details.name}
                            </h1>
                            <div className="flex flex-wrap gap-3 text-white/40 text-[12px] font-bold">
                                {details.birthday && (
                                    <div className="flex items-center gap-2 bg-white/[0.03] px-3 py-1.5 rounded-full border border-white/5">
                                        <Calendar className="w-3.5 h-3.5 text-[#8FA7C5]" />
                                        {details.birthday}{age ? ` · ${age} tuổi` : ''}
                                    </div>
                                )}
                                {details.place_of_birth && (
                                    <div className="flex items-center gap-2 bg-white/[0.03] px-3 py-1.5 rounded-full border border-white/5">
                                        <MapPin className="w-3.5 h-3.5 text-[#8FA7C5]" />
                                        {details.place_of_birth}
                                    </div>
                                )}
                            </div>
                        </div>

                        {details.biography && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-white/60 font-black uppercase tracking-[0.2em] text-[10px]">
                                    <Info className="w-3.5 h-3.5 text-[#8FA7C5]" /> Tiểu sử
                                </div>
                                <p className="text-white/55 leading-[1.75] text-[15px] font-medium line-clamp-8 hover:line-clamp-none transition-all cursor-help">
                                    {details.biography}
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-4 pt-2">
                            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                                <div className="text-[9px] font-black uppercase tracking-widest text-[#8FA7C5]/50 mb-1.5">Giới tính</div>
                                <div className="text-[15px] font-black text-white/85">{details.gender === 1 ? "Nữ" : "Nam"}</div>
                            </div>
                            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                                <div className="text-[9px] font-black uppercase tracking-widest text-[#8FA7C5]/50 mb-1.5">Nghề nghiệp</div>
                                <div className="text-[15px] font-black text-[#8FA7C5]">{department}</div>
                            </div>
                            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                                <div className="text-[9px] font-black uppercase tracking-widest text-[#8FA7C5]/50 mb-1.5">Độ hot</div>
                                <div className="text-[15px] font-black flex items-center gap-1.5 text-white/85">
                                    <Star className="w-4 h-4 fill-[#8FA7C5] text-[#8FA7C5]" />
                                    {details.popularity?.toFixed(1)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile biography — below the horizontal row */}
                {details.biography && (
                    <div className="md:hidden mt-4 space-y-2">
                        <div className="text-[9px] font-black uppercase tracking-widest text-[#8FA7C5]/50">Tiểu sử</div>
                        <p className="text-white/50 leading-relaxed text-[12px] line-clamp-5">
                            {details.biography}
                        </p>
                    </div>
                )}
            </div>

            {/* ── FILMOGRAPHY ── */}
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 md:py-12">
                {/* Header + Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white/[0.06] pb-5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-1 h-5 bg-[#8FA7C5] rounded-full" />
                        <h2 className="text-lg md:text-2xl font-black text-white tracking-tight">Sự nghiệp</h2>
                        <span className="text-[11px] text-white/25 font-medium">
                            {view === 'local' ? `${localFilmography.length} phim` : `${globalFilmography.length} phim`}
                        </span>
                    </div>

                    <div className="flex items-center gap-1 p-1 bg-white/[0.04] border border-white/[0.08] rounded-xl self-start sm:self-auto">
                        <Link
                            href={`/dien-vien/${slug}`}
                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${view === 'global' ? 'bg-[#8FA7C5] text-black shadow-sm' : 'text-white/35 hover:text-white/70'}`}
                        >
                            <Globe className="w-3 h-3" /> Quốc tế
                        </Link>
                        <Link
                            href={`/dien-vien/${slug}?view=local`}
                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${view === 'local' ? 'bg-[#8FA7C5] text-black shadow-sm' : 'text-white/35 hover:text-white/70'}`}
                        >
                            <Grid className="w-3 h-3" /> KHOIPHIM
                        </Link>
                    </div>
                </div>

                {view === 'global' ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-5">
                        {globalFilmography.map((movie: any) => (
                            <Link
                                href={`/tim-kiem?keyword=${encodeURIComponent(movie.title || movie.name)}`}
                                key={movie.id}
                                className="group"
                            >
                                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-white/[0.03] border border-white/[0.05] group-hover:border-[#8FA7C5]/40 transition-all duration-200">
                                    <Image
                                        src={getTMDBImage(movie.poster_path, "w342") || "/placeholder-poster.jpg"}
                                        alt={movie.title || movie.name}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        unoptimized
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                                        {movie.vote_average > 0 && (
                                            <div className="flex items-center gap-1 text-yellow-400 text-[10px] font-bold">
                                                <Star className="w-2.5 h-2.5 fill-yellow-400" />
                                                {movie.vote_average?.toFixed(1)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-1.5">
                                    <h3 className="text-[11px] md:text-[13px] font-semibold text-white/80 group-hover:text-[#8FA7C5] transition-colors line-clamp-1">
                                        {movie.title || movie.name}
                                    </h3>
                                    <p className="text-[10px] text-white/30 mt-0.5">
                                        {(movie.release_date || movie.first_air_date || "").substring(0, 4) || "–"}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : localFilmography.length === 0 ? (
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-12 text-center flex flex-col items-center justify-center">
                        <Info className="w-8 h-8 text-white/15 mb-3" />
                        <h3 className="text-base font-bold text-white/60 mb-1">Chưa có phim trên hệ thống</h3>
                        <p className="text-white/30 text-[12px] max-w-sm">Hiện chưa tìm thấy phim nào của {details.name} tại KHOIPHIM.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-5">
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
