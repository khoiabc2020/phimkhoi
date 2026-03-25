import { getTMDBPersonDetails, getTMDBPersonCredits, getTMDBImage, searchTMDBPerson } from "@/services/tmdb";
import { getMoviesByActor } from "@/services/api";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Star, Calendar, MapPin, Info, Grid, Clock, Share2, Globe } from "lucide-react";
import { checkFavoriteActor } from "@/app/actions/actorFavorites";
import MovieCard from "@/components/MovieCard";
import FavoriteActorButton from "@/components/FavoriteActorButton";
import Footer from "@/components/Footer";

interface PersonPageProps {
    params: Promise<{ slug: string }>;
    searchParams?: Promise<{ view?: string }>;
}

export default async function PersonPage({ params, searchParams }: PersonPageProps) {
    const { slug } = await params;
    const sParams = await searchParams;
    const view = sParams?.view === 'local' ? 'local' : 'global';
    const name = slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

    try {
        // 1. Search for the person to get ID
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

        // 2. Fetch TMDB details first to get the official name
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


    return (
        <main className="min-h-screen bg-[#080b12] text-white overflow-hidden" 
              style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* Hero Section */}
            <div className="relative pt-32 pb-12 px-4 md:px-8 max-w-[1400px] mx-auto z-10">
                
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/10 blur-[120px] rounded-full -z-10 opacity-30 pointer-events-none" />

                <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
                    {/* Profile Image */}
                    <div className="w-full md:w-[320px] shrink-0 group">
                        <div className="relative aspect-[2/3] rounded-[32px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] border border-white/10 group-hover:border-primary/40 transition-all duration-700">
                            <Image 
                                src={getTMDBImage(details.profile_path, "h632") || "/placeholder-avatar.jpg"} 
                                alt={details.name} 
                                fill 
                                className="object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
                                unoptimized
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        </div>
                        
                        <div className="mt-8 flex items-center justify-center gap-4">
                            <FavoriteActorButton actorName={details.name} initialIsFavorite={isFavorite} />
                            <button className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm bg-white/5 hover:bg-white/10 text-gray-300 transition-all border border-white/10 active:scale-95 shadow-lg">
                                <Share2 className="w-4 h-4" /> <span>Chia sẻ</span>
                            </button>
                        </div>
                    </div>

                    {/* Bio Info */}
                    <div className="flex-1 space-y-8">
                        <div>
                            <h1 className="text-4xl md:text-7xl font-black text-white mb-4 tracking-tight drop-shadow-2xl">
                                {details.name}
                            </h1>
                            <div className="flex flex-wrap gap-6 text-white/40 text-[13px] font-bold uppercase tracking-widest">
                                {details.birthday && (
                                    <div className="flex items-center gap-2.5 bg-white/[0.03] px-3 py-1.5 rounded-full border border-white/5">
                                        <Calendar className="w-4 h-4 text-primary" />
                                        {details.birthday}
                                    </div>
                                )}
                                {details.place_of_birth && (
                                    <div className="flex items-center gap-2.5 bg-white/[0.03] px-3 py-1.5 rounded-full border border-white/5">
                                        <MapPin className="w-4 h-4 text-primary" />
                                        {details.place_of_birth}
                                    </div>
                                )}
                            </div>
                        </div>

                        {details.biography && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2.5 text-white/90 font-black uppercase tracking-[0.2em] text-[10px]">
                                    <Info className="w-4 h-4 text-primary" /> Tiểu sử diễn viên
                                </div>
                                <p className="text-white/60 leading-[1.8] text-[16px] font-medium line-clamp-[10] hover:line-clamp-none transition-all duration-700 cursor-help selection:bg-primary/30">
                                    {details.biography}
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-4">
                            <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md shadow-xl hover:bg-white/[0.05] transition-all group/card ring-1 ring-white/5">
                                <div className="text-[#8FA7C5]/50 text-[10px] uppercase font-black tracking-widest mb-2 group-hover:text-[#8FA7C5] transition-colors">Giới tính</div>
                                <div className="text-lg font-black text-white/90">{details.gender === 1 ? "Nữ" : "Nam"}</div>
                            </div>
                            <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md shadow-xl hover:bg-white/[0.05] transition-all group/card ring-1 ring-white/5">
                                <div className="text-[#8FA7C5]/50 text-[10px] uppercase font-black tracking-widest mb-2 group-hover:text-[#8FA7C5] transition-colors">Nghề nghiệp</div>
                                <div className="text-lg font-black text-[#8FA7C5]">{details.known_for_department === 'Acting' ? 'Diễn viên' : details.known_for_department}</div>
                            </div>
                            <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md shadow-xl hover:bg-white/[0.05] transition-all group/card ring-1 ring-white/5">
                                <div className="text-[#8FA7C5]/50 text-[10px] uppercase font-black tracking-widest mb-2 group-hover:text-[#8FA7C5] transition-colors">Độ hot</div>
                                <div className="text-lg font-black flex items-center gap-2 text-white/90">
                                    <Star className="w-5 h-5 fill-[#8FA7C5] text-[#8FA7C5]" />
                                    {details.popularity?.toFixed(1)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filmography Section */}
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-12 relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-white/[0.06] pb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_15px_rgba(143,167,197,0.5)]" />
                        <h2 className="text-2xl font-bold text-white tracking-tight">Sự nghiệp</h2>
                    </div>
                    
                    <div className="flex items-center gap-1 p-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                        <Link 
                            href={`/dien-vien/${slug}`}
                            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[13px] font-black uppercase tracking-wider transition-all ${view === 'global' ? 'bg-[#8FA7C5] text-black shadow-lg shadow-[#8FA7C5]/20' : 'text-white/40 hover:text-white'}`}
                        >
                            <Globe className="w-4 h-4" /> Kho phim quốc tế
                        </Link>
                        <Link 
                            href={`/dien-vien/${slug}?view=local`}
                            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[13px] font-black uppercase tracking-wider transition-all ${view === 'local' ? 'bg-[#8FA7C5] text-black shadow-lg shadow-[#8FA7C5]/20' : 'text-white/40 hover:text-white'}`}
                        >
                            <Grid className="w-4 h-4" /> Phim tại KHOIPHIM
                        </Link>
                    </div>
                </div>

                {view === 'global' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {globalFilmography.map((movie: any) => (
                            <Link 
                                href={`/tim-kiem?keyword=${encodeURIComponent(movie.title || movie.name)}`} // Fix: robust routing to search instead of guessing slug
                                key={movie.id} 
                                className="group"
                            >
                                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#0c0c14] border border-white/5 group-hover:border-[#8FA7C5]/50 transition-all duration-300 shadow-2xl ring-1 ring-white/5 group-hover:ring-[#8FA7C5]/30">
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
                                    <h3 className="text-sm font-bold text-white/90 group-hover:text-primary transition-colors line-clamp-1">
                                        {movie.title || movie.name}
                                    </h3>
                                    <p className="text-xs text-white/40 font-medium mt-1">
                                        {movie.release_date || movie.first_air_date ? (movie.release_date || movie.first_air_date).substring(0, 4) : "-"}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : localFilmography.length === 0 ? (
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-[32px] p-20 text-center flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-white/[0.03] rounded-full flex items-center justify-center mb-6">
                            <Info className="w-10 h-10 text-white/20" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Chưa có phim trên hệ thống</h3>
                        <p className="text-white/40 text-sm max-w-sm">Hiện tại chưa tìm thấy phim nào của {details.name} đang có sẵn tại KHOIPHIM. Hãy thử quay lại sau nhé!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
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
