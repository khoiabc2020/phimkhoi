export const dynamic = 'force-dynamic';

import { History, ArrowLeft, Trash2, Play, Clock, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getWatchHistory, getContinueWatching, removeWatchHistory, clearWatchHistory } from "@/app/actions/watchHistory";
import EmptyState from "@/components/EmptyState";
import Pagination from "@/components/Pagination";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getImageUrl } from "@/lib/utils";

async function ClearHistoryButton() {
    "use server";
    async function handleClear() {
        "use server";
        await clearWatchHistory();
    }

    return (
        <form action={handleClear}>
            <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-red-500/12 text-red-400 rounded-full hover:bg-red-500/20 transition-all border border-red-500/25 text-xs font-bold uppercase tracking-wider"
            >
                <Trash2 className="w-3.5 h-3.5" />
                Xóa tất cả
            </button>
        </form>
    );
}

export default async function WatchHistoryPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string }>;
}) {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/login");
    }

    const { page: pageParam } = await searchParams;
    const currentPage = Math.max(1, Number(pageParam) || 1);

    const [continueWatchingResult, historyResult] = await Promise.all([
        currentPage === 1 ? getContinueWatching() : Promise.resolve({ success: true, data: [] }),
        getWatchHistory(currentPage, 30),
    ]);

    const continueWatching = continueWatchingResult.success && continueWatchingResult.data ? continueWatchingResult.data : [];
    const history = historyResult.success && historyResult.data ? historyResult.data : [];
    const totalPages = (historyResult as any).totalPages || 1;

    return (
        <div className="min-h-screen pt-24 md:pt-28 pb-12 relative bg-[#0a0a0a]">
            {/* Onflix-style purple banner */}
            <div className="absolute top-0 inset-x-0 h-[60vh] bg-gradient-to-b from-[#8b5cf6]/18 to-transparent pointer-events-none" />

            <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-4 md:px-8 lg:pl-24 lg:pr-12 relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 md:mb-10">
                    <div className="flex items-center gap-4">
                        <Link href="/thong-tin-tai-khoan" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all group backdrop-blur-md">
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <h1 className="text-[26px] leading-[1.02] md:text-[32px] font-bold text-white tracking-tight">Lịch sử xem</h1>
                        </div>
                    </div>
                    {history.length > 0 && <ClearHistoryButton />}
                </div>

                {history.length === 0 ? (
                    <div className="py-20">
                        <EmptyState
                            icon={<History className="w-16 h-16 text-white/20" />}
                            title="Lịch sử trống"
                            description="Bạn chưa xem phim nào gần đây. Hãy bắt đầu trải nghiệm ngay!"
                            action={{ label: "Khám phá phim hay", href: "/" }}
                        />
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* Continue Watching Section */}
                        {continueWatching.length > 0 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h2 className="text-[16px] md:text-[18px] font-bold text-white mb-4 flex items-center gap-2 border-l-[3px] border-[#8FA7C5] pl-3">
                                    <Play className="w-4 h-4 text-[#8FA7C5] fill-current" />
                                    Tiếp tục xem
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 [contain:layout_paint]">
                                    {continueWatching.map((item: any) => (
                                        <div key={item._id} className="group relative block">
                                            <Link href={`/xem-phim/${item.movieSlug}/${item.episodeSlug}`} className="block">
                                                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#0B0B10] shadow-lg border border-white/5 group-hover:border-white/20 transition-all">
                                                    <Image
                                                        src={getImageUrl(item.moviePoster)}
                                                        alt={item.movieName}
                                                        fill
                                                        loading="lazy"
                                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />

                                                    {/* Xem tiếp Hover Overlay */}
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 bg-black/30">
                                                        <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center shadow-[0_0_20px_#00000080] scale-50 group-hover:scale-100 transition-transform duration-300 backdrop-blur-sm bg-black/20">
                                                            <Play className="w-5 h-5 text-white fill-white ml-1" />
                                                        </div>
                                                    </div>

                                                    {/* Tập Phim Badge */}
                                                    {item.episodeName && (
                                                        <div className="absolute bottom-2 left-0 z-20">
                                                            <span className="block px-2 py-0.5 rounded-r-md bg-[#8FA7C5] text-[#080b12] text-[10px] font-black truncate shadow-md max-w-[85px]">
                                                                {item.episodeName}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Progress Bar - sát mép đáy ảnh */}
                                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 z-20">
                                                        <div
                                                            className="h-full bg-[#8FA7C5] transition-all duration-300"
                                                            style={{ width: `${item.progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </Link>

                                            {/* Nút Xóa (X) nằm đè lên góc phải trên của Poster */}
                                            <form action={async () => { "use server"; await removeWatchHistory(item._id.toString()); }} className="absolute top-1.5 right-1.5 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button type="submit" className="w-6 h-6 rounded-full bg-black/60 text-white/70 hover:text-white hover:bg-black/90 flex items-center justify-center backdrop-blur-md shadow-lg border border-white/10" title="Xoá khỏi lịch sử">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </form>

                                            {/* Text bên dưới ảnh */}
                                            <Link href={`/xem-phim/${item.movieSlug}/${item.episodeSlug}`} className="mt-2.5 px-0.5 block">
                                                <h3 className="text-white font-bold line-clamp-1 text-sm md:text-[15px] group-hover:text-[#8FA7C5] transition-colors">
                                                    {item.movieName}
                                                </h3>
                                                {item.progress > 0 && (
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="text-white/35 text-[11px] md:text-xs">Đã xem:</span>
                                                    <span className="text-[#8FA7C5] text-[11px] md:text-xs font-bold">{item.progress}%</span>
                                                </div>
                                            )}
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Full History */}
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <h2 className="text-[16px] md:text-[18px] font-bold text-white mb-4 flex items-center gap-2 border-l-[3px] border-white/20 pl-3">
                                <History className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                                Tất cả đã xem
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 gap-y-5 [contain:layout_paint]">
                                {history.map((item: any, idx: number) => (
                                    <div key={item._id} className="group relative block">
                                        <Link href={`/xem-phim/${item.movieSlug}/${item.episodeSlug}`} className="block">
                                            <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#0B0B10] shadow-md border border-white/5 group-hover:border-white/20 transition-all">
                                                <Image
                                                    src={getImageUrl(item.moviePoster)}
                                                    alt={item.movieName}
                                                    fill
                                                    loading="lazy"
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500 group-hover:brightness-110"
                                                />

                                                {/* Tập Phim Badge */}
                                                {item.episodeName && (
                                                    <div className="absolute bottom-2 left-0 z-20">
                                                        <span className="block px-2 py-0.5 rounded-r-md bg-[#8FA7C5] text-[#080b12] text-[10px] font-black truncate shadow-md max-w-[85px]">
                                                            {item.episodeName}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Progress Indicator */}
                                                {item.progress > 0 && (
                                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 z-20">
                                                        <div
                                                            className="h-full bg-[#8FA7C5] transition-all duration-300"
                                                            style={{ width: `${item.progress}%` }}
                                                        />
                                                    </div>
                                                )}

                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 bg-black/20">
                                                    <div className="w-10 h-10 rounded-full border-2 border-white/80 flex items-center justify-center backdrop-blur-sm bg-black/20 scale-75 group-hover:scale-100 transition-transform">
                                                        <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>

                                        {/* Nút Xóa (X) */}
                                        <form action={async () => { "use server"; await removeWatchHistory(item._id.toString()); }} className="absolute top-1.5 right-1.5 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button type="submit" className="w-6 h-6 rounded-full bg-black/60 text-white/70 hover:text-white hover:bg-black/90 flex items-center justify-center backdrop-blur-md shadow-lg border border-white/10" title="Xoá khỏi lịch sử">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </form>

                                        <Link href={`/xem-phim/${item.movieSlug}/${item.episodeSlug}`} className="mt-2.5 px-0.5 block">
                                            <h3 className="text-gray-200 group-hover:text-[#8FA7C5] font-bold line-clamp-1 text-sm transition-colors">
                                                {item.movieName}
                                            </h3>
                                            {item.progress > 0 && (
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="text-white/35 text-[11px]">Đã xem:</span>
                                                    <span className="text-[#8FA7C5] text-[11px] font-bold">{item.progress}%</span>
                                                </div>
                                            )}
                                        </Link>
                                    </div>
                                ))}
                            </div>
                            {totalPages > 1 && (
                                <div className="mt-10">
                                    <Pagination currentPage={currentPage} totalPages={totalPages} />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
