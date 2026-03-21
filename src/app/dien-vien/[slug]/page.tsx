import { getTMDBPersonDetails, getTMDBPersonCredits, getTMDBImage, searchTMDBPerson } from "@/services/tmdb";
import { searchMovies } from "@/services/api";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Star, Calendar, MapPin, Info } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface PersonPageProps {
    params: { slug: string };
}

export default async function PersonPage({ params }: PersonPageProps) {
    const { slug } = params;
    const name = slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

    // 1. Search for the person to get ID
    const searchResults = await searchTMDBPerson(name);
    const person = searchResults[0];

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

    // 2. Get details & credits
    const [details, credits] = await Promise.all([
        getTMDBPersonDetails(person.id),
        getTMDBPersonCredits(person.id)
    ]);

    if (!details) return null;

    // 3. Filter and sort credits
    const filmography = (credits?.cast || [])
        .filter((m: any) => m.poster_path || m.backdrop_path)
        .slice(0, 30); // Show top 30

    return (
        <main className="min-h-screen bg-[#080b12] text-white overflow-hidden" 
              style={{ fontFamily: "'Inter', sans-serif" }}>
            <Header />

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
                            <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md shadow-xl hover:bg-white/[0.05] transition-colors group/card">
                                <div className="text-white/30 text-[10px] uppercase font-black tracking-widest mb-2 group-hover/card:text-primary transition-colors">Giới tính</div>
                                <div className="text-lg font-black">{details.gender === 1 ? "Nữ" : "Nam"}</div>
                            </div>
                            <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md shadow-xl hover:bg-white/[0.05] transition-colors group/card">
                                <div className="text-white/30 text-[10px] uppercase font-black tracking-widest mb-2 group-hover/card:text-primary transition-colors">Nghề nghiệp</div>
                                <div className="text-lg font-black text-primary">{details.known_for_department === 'Acting' ? 'Diễn viên' : details.known_for_department}</div>
                            </div>
                            <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md shadow-xl hover:bg-white/[0.05] transition-colors group/card">
                                <div className="text-white/30 text-[10px] uppercase font-black tracking-widest mb-2 group-hover/card:text-primary transition-colors">Độ hot</div>
                                <div className="text-lg font-black flex items-center gap-2">
                                    <Star className="w-5 h-5 fill-primary text-primary" />
                                    {details.popularity?.toFixed(1)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filmography Section */}
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-12 relative z-10">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_15px_rgba(143,167,197,0.5)]" />
                    <h2 className="text-2xl font-bold text-white tracking-tight">Sự nghiệp ({filmography.length}+ phim)</h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {filmography.map((movie: any) => (
                        <Link 
                            href={`/phim/${movie.title?.toLowerCase().replace(/[^a-z0-9]/g, '-') || movie.name?.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                            key={movie.id} 
                            className="group"
                        >
                            <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-white/5 border border-white/5 group-hover:border-primary/40 transition-all duration-300 shadow-lg">
                                <Image 
                                    src={getTMDBImage(movie.poster_path, "w500") || "/placeholder-poster.jpg"} 
                                    alt={movie.title || movie.name} 
                                    fill 
                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
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
            </div>

            <Footer />
        </main>
    );
}
