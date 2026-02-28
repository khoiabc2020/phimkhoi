import { Metadata } from 'next';
import { getMoviesByActor } from '@/services/api';
import MovieCard from '@/components/MovieCard';
import Pagination from '@/components/Pagination';
import { Users2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata({ params, searchParams }: { params: Promise<{ name: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const { name } = await params;
    const decodedName = decodeURIComponent(name);
    return {
        title: `Phim của diễn viên ${decodedName} - Khôi Phim`,
        description: `Danh sách phim có sự tham gia của diễn viên ${decodedName} tại Khôi Phim.`
    };
}

export default async function ActorPage({ params, searchParams }: { params: Promise<{ name: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const { name } = await params;
    const paramsQuery = await searchParams;
    const page = typeof paramsQuery.page === 'string' ? parseInt(paramsQuery.page) : 1;
    const decodedName = decodeURIComponent(name);

    const { items, pagination } = await getMoviesByActor(decodedName, page, 24);

    return (
        <main className="min-h-screen pt-24 pb-12">
            <div className="container mx-auto px-4">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/20">
                            <Users2 className="w-6 h-6 text-black" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                                Phim của diễn viên <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">{decodedName}</span>
                            </h1>
                            <p className="text-gray-400 mt-1">
                                {pagination?.totalItems ? `Tìm thấy ${pagination.totalItems} kết quả` : 'Đang tìm kiếm...'}
                            </p>
                        </div>
                    </div>
                    <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent" />
                </div>

                {/* Content Section */}
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-white/5 rounded-2xl border border-white/10">
                        <AlertCircle className="w-16 h-16 text-gray-500 mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Không tìm thấy phim nào</h2>
                        <p className="text-gray-400 mb-6">Chưa có thông tin phim nào của diễn viên "{decodedName}" trong hệ thống.</p>
                        <Link
                            href="/"
                            className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-2.5 rounded-full font-bold transition-colors"
                        >
                            Trở về trang chủ
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
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
        </main>
    );
}
