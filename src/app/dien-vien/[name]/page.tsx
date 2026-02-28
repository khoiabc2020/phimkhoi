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
    const decodedName = decodeURIComponent(name);

    const [{ items, pagination }, tmdbDetails, favResult] = await Promise.all([
        getMoviesByActor(decodedName, page, 24),
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

    return (
        <main className="min-h-screen pt-20 md:pt-24 pb-12 bg-[#0b0b0b]">
            <div className="container mx-auto px-4 md:px-8 xl:px-12 max-w-[1600px]">

                <div className="flex flex-col md:flex-row gap-6 lg:gap-10">
                    {/* Left Sidebar: Poster & Info */}
                    <div className="w-full md:w-[260px] lg:w-[320px] flex-shrink-0">
                        {/* Profile Image */}
                        <div className="w-full aspect-[2/3] relative rounded-xl overflow-hidden bg-[#1f1f1f] border border-white/5 shadow-2xl mb-6">
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
                                <div className="w-1.5 h-5 bg-[#1ce783] rounded-full" />
                                <h3 className="text-xl font-bold text-white">Tiểu sử</h3>
                            </div>
                            <p className="text-[#a1a1aa] leading-relaxed text-[15px] whitespace-pre-wrap">
                                {biography}
                            </p>
                        </div>

                        {/* Filmography */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-1.5 h-5 bg-[#1ce783] rounded-full" />
                                <h3 className="text-xl font-bold text-white">
                                    Phim tham gia <span className="font-normal text-gray-500 text-lg">({pagination?.totalItems || 0})</span>
                                </h3>
                            </div>

                            {/* Tabs */}
                            <div className="flex items-center gap-1 mb-6 border-b border-white/[0.08]">
                                <button className="flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 text-white border-white transition-all">
                                    <Grid className="w-4 h-4 text-yellow-400" />
                                    Phim
                                </button>
                                <button className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-gray-500 border-b-2 border-transparent hover:text-white transition-all cursor-not-allowed">
                                    <Clock className="w-4 h-4" />
                                    Thời gian
                                </button>
                            </div>

                            {/* Movie Grid */}
                            {items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center bg-white/5 rounded-2xl border border-white/10">
                                    <AlertCircle className="w-16 h-16 text-gray-500 mb-4" />
                                    <h2 className="text-xl font-bold text-white mb-2">Chưa có dữ liệu phim</h2>
                                    <p className="text-gray-400">Hệ thống đang cập nhật danh sách phim của {decodedName}.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                                        {items.map((movie: any) => (
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
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </main>
    );
}
