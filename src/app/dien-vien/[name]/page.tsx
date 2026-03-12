import { Metadata } from 'next';
import { getMoviesByActor } from '@/services/api';
import MovieCard from '@/components/MovieCard';
import Pagination from '@/components/Pagination';
import { AlertCircle, Share2, Grid, Clock } from 'lucide-react';
import Link from 'next/link';
import { getActorDetailsFromTMDB } from '@/app/actions/tmdb';
import { checkFavoriteActor } from '@/app/actions/actorFavorites';
import FavoriteActorButton from '@/components/FavoriteActorButton';

export async function generateMetadata({ params, searchParams }: { params: Promise<{ name: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const { name } = await params;
    const decodedName = decodeURIComponent(name);
    return {
        title: `${decodedName} - Phim tham gia & Tiểu sử | Khôi Phim`,
        description: `Danh sách phim, tiểu sử và thông tin chi tiết của diễn viên / đạo diễn ${decodedName} mới nhất và đầy đủ nhất tại Khôi Phim.`
    };
}

// Helper to format date "YYYY-MM-DD" to "DD/MM/YYYY"
function formatDate(dateStr?: string) {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
}

function calculateAge(dateStr?: string) {
    if (!dateStr) return null;
    const birthDate = new Date(dateStr);
    const difference = Date.now() - birthDate.getTime();
    const ageDate = new Date(difference);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}

export default async function ActorPage({ params, searchParams }: { params: Promise<{ name: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const { name } = await params;
    const paramsQuery = await searchParams;
    const page = typeof paramsQuery.page === 'string' ? parseInt(paramsQuery.page) : 1;
    const view = paramsQuery.view === 'time' ? 'time' : 'movies';
    const decodedName = decodeURIComponent(name);

    const [{ items, pagination }, timelineResult, tmdbDetails, favResult] = await Promise.all([
        getMoviesByActor(decodedName, page, 24),
        view === 'time' ? getMoviesByActor(decodedName, 1, 200) : Promise.resolve(null),
        getActorDetailsFromTMDB(decodedName),
        checkFavoriteActor(decodedName)
    ]);

    const isFavorite = favResult.isFavorite;

    // TMDB fields Mapping
    const gender = tmdbDetails?.gender === 1 ? 'Nữ' : tmdbDetails?.gender === 2 ? 'Nam' : 'Chưa rõ';
    const profileUrl = tmdbDetails?.profile_path ? `https://image.tmdb.org/t/p/h632${tmdbDetails.profile_path}` : null;
    const biography = tmdbDetails?.biography || `Diễn viên ${decodedName} chưa có thông tin tiểu sử.`;
    const birthday = tmdbDetails?.birthday;
    const age = calculateAge(birthday);
    const placeOfBirth = tmdbDetails?.place_of_birth;

    // Also Known As (often used for original chinese/korean name)
    const originalName = tmdbDetails?.also_known_as && tmdbDetails.also_known_as.length > 0
        ? tmdbDetails.also_known_as[0]
        : null;

    // Remove cross-source duplicates before rendering (same movie can appear with different slugs)
    const dedupeMovies = (movies: any[]) => {
        const seen = new Set<string>();
        return movies.filter((movie) => {
            const key = [
                String(movie?.origin_name || "").trim().toLowerCase(),
                String(movie?.name || "").trim().toLowerCase(),
                String(movie?.year || ""),
                String(movie?.poster_url || movie?.thumb_url || "").trim().toLowerCase(),
            ].join("|");
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    };

    const pagedItems = dedupeMovies(items || []);
    const timelineItems = dedupeMovies(timelineResult?.items || items || []).sort(
        (a, b) => (Number(b?.year) || 0) - (Number(a?.year) || 0)
    );

    const timelineByYear = timelineItems.reduce((acc, movie) => {
        const year = Number(movie?.year) || 0;
        if (!year) return acc;
        if (!acc[year]) acc[year] = [];
        acc[year].push(movie);
        return acc;
    }, {} as Record<number, any[]>);

    const timelineYears = Object.keys(timelineByYear)
        .map((y) => Number(y))
        .sort((a, b) => b - a);

    return (
        <main className="min-h-screen pt-20 md:pt-24 pb-12 bg-[#0b0b0b]">
            <div className="w-full max-w-[1920px] mx-auto px-4 md:px-8 xl:px-12 max-w-[1920px]">

                <div className="flex flex-col md:flex-row gap-6 lg:gap-10">
                    {/* Left Sidebar: Poster & Info */}
                    <div className="w-full md:w-[260px] lg:w-[320px] flex-shrink-0">
                        {/* Profile Image */}
                        <div className="w-full aspect-[2/3] relative rounded-lg overflow-hidden bg-[#1f1f1f] border border-white/5 shadow-2xl mb-6">
                            {profileUrl ? (
                                <img src={profileUrl} alt={decodedName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-2">
                                    <Grid className="w-12 h-12 opacity-50" />
                                    <span className="text-sm font-medium">Không có ảnh</span>
                                </div>
                            )}
                        </div>

                        {/* Personal Info */}
                        <div className="space-y-4 text-sm hidden md:block">
                            <div className="flex flex-col gap-1 text-gray-400">
                                <h4 className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                    Giới tính
                                </h4>
                                <span className="text-gray-300 font-medium">{gender}</span>
                            </div>

                            {birthday && (
                                <div className="flex flex-col gap-1 text-gray-400">
                                    <h4 className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        Ngày sinh & Tuổi
                                    </h4>
                                    <span className="text-gray-300 font-medium">
                                        {formatDate(birthday)}
                                        {age && <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-gray-400">{age} tuổi</span>}
                                    </span>
                                </div>
                            )}

                            {placeOfBirth && (
                                <div className="flex flex-col gap-1 text-gray-400">
                                    <h4 className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        Nơi sinh
                                    </h4>
                                    <span className="text-gray-300 font-medium leading-relaxed">{placeOfBirth}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Content */}
                    <div className="flex-1 min-w-0">
                        {/* Header & Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-2">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-1">{decodedName}</h1>
                                {originalName && <h2 className="text-lg md:text-xl text-gray-400">{originalName}</h2>}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <FavoriteActorButton actorName={decodedName} initialIsFavorite={isFavorite} />
                                <button className="flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm bg-white/5 hover:bg-white/10 text-gray-300 transition-colors border border-white/10">
                                    <Share2 className="w-4 h-4" /> Chia sẻ
                                </button>
                            </div>
                        </div>

                        {/* Mobile Info view */}
                        <div className="flex flex-wrap gap-4 text-xs md:hidden mb-6 py-4 border-b border-t border-white/5 mt-4">
                            <div className="flex flex-col"><span className="text-gray-500 mb-0.5 uppercase tracking-wide">Giới tính</span><span className="text-gray-200">{gender}</span></div>
                            {birthday && <div className="flex flex-col"><span className="text-gray-500 mb-0.5 uppercase tracking-wide">Ngày sinh</span><span className="text-gray-200">{formatDate(birthday)}</span></div>}
                            {placeOfBirth && <div className="flex flex-col w-full"><span className="text-gray-500 mb-0.5 uppercase tracking-wide">Nơi sinh</span><span className="text-gray-200 truncate">{placeOfBirth}</span></div>}
                        </div>

                        {/* Biography */}
                        <div className="mt-8 mb-10">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-1.5 h-5 bg-[#F4C84A] rounded-full" />
                                <h3 className="text-xl font-bold text-white">Tiểu sử</h3>
                            </div>
                            <p className="text-[#a1a1aa] leading-relaxed text-[15px] whitespace-pre-wrap">
                                {biography}
                            </p>
                        </div>

                        {/* Filmography */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-1.5 h-5 bg-[#F4C84A] rounded-full" />
                                <h3 className="text-xl font-bold text-white">
                                    Phim tham gia <span className="font-normal text-gray-500 text-lg">({pagination?.totalItems || 0})</span>
                                </h3>
                            </div>

                            {/* Tabs */}
                            <div className="flex items-center gap-1 mb-6 border-b border-white/[0.08]">
                                <Link
                                    href={`/dien-vien/${name}`}
                                    className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition-all ${view === 'movies'
                                        ? 'text-white border-white'
                                        : 'text-gray-500 border-transparent hover:text-white'
                                        }`}
                                >
                                    <Grid className={`w-4 h-4 ${view === 'movies' ? 'text-yellow-400' : ''}`} />
                                    Phim
                                </Link>
                                <Link
                                    href={`/dien-vien/${name}?view=time`}
                                    className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition-all ${view === 'time'
                                        ? 'text-white border-white'
                                        : 'text-gray-500 border-transparent hover:text-white'
                                        }`}
                                >
                                    <Clock className={`w-4 h-4 ${view === 'time' ? 'text-yellow-400' : ''}`} />
                                    Thời gian
                                </Link>
                            </div>

                            {/* Movie Grid / Timeline */}
                            {view === 'movies' && pagedItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center bg-white/5 rounded-lg border border-white/10">
                                    <AlertCircle className="w-16 h-16 text-gray-500 mb-4" />
                                    <h2 className="text-xl font-bold text-white mb-2">Chưa có dữ liệu phim</h2>
                                    <p className="text-gray-400">Hệ thống đang cập nhật danh sách phim của {decodedName}.</p>
                                </div>
                            ) : view === 'movies' ? (
                                <>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                                        {pagedItems.map((movie: any) => (
                                            <MovieCard key={movie._id || movie.slug} movie={movie} />
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    {pagination && pagination.totalPages > 1 && (
                                        <div className="mt-12 flex justify-center">
                                            <Pagination
                                                currentPage={pagination.currentPage}
                                                totalPages={pagination.totalPages}
                                                baseUrl={`/dien-vien/${name}`}
                                            />
                                        </div>
                                    )}
                                </>
                            ) : timelineYears.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center bg-white/5 rounded-lg border border-white/10">
                                    <AlertCircle className="w-16 h-16 text-gray-500 mb-4" />
                                    <h2 className="text-xl font-bold text-white mb-2">Chưa có dữ liệu theo năm</h2>
                                    <p className="text-gray-400">Không có mốc thời gian phim cho {decodedName}.</p>
                                </div>
                            ) : (
                                <div className="space-y-10">
                                    {timelineYears.map((year) => (
                                        <div key={year} className="grid grid-cols-[auto_1fr] gap-4 sm:gap-6">
                                            <div className="pt-1">
                                                <div className="text-2xl font-black text-emerald-400 leading-none">{year}</div>
                                            </div>
                                            <div className="relative border-l border-white/10 pl-4 sm:pl-6">
                                                <div className="absolute left-0 top-2 w-2 h-2 -translate-x-1/2 rounded-full bg-[#F4C84A]" />
                                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                                    {timelineByYear[year].map((movie: any) => (
                                                        <MovieCard key={`${year}-${movie._id || movie.slug || movie.name}`} movie={movie} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </main>
    );
}
