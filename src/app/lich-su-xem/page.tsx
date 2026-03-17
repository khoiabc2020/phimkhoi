
export const dynamic = 'force-dynamic';

import { History, ArrowLeft, Trash2, Play, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getWatchHistory, getContinueWatching, removeWatchHistory, clearWatchHistory } from "@/app/actions/watchHistory";
import EmptyState from "@/components/EmptyState";
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

export default async function WatchHistoryPage() {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/login");
    }

    const [continueWatchingResult, historyResult] = await Promise.all([
        getContinueWatching(),
        getWatchHistory(),
    ]);

    const continueWatching = continueWatchingResult.success && continueWatchingResult.data ? continueWatchingResult.data : [];
    const history = historyResult.success && historyResult.data ? historyResult.data : [];

    return (
        <div className="min-h-screen pt-24 md:pt-28 pb-12 relative overflow-hidden">
            {/* Background nhẹ đồng bộ với toàn site */}
            <div className="fixed inset-0 pointer-events-none z-0 bg-[#050507]" />

            <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-4 md:px-12 relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 md:mb-8">
                    <div className="flex items-center gap-3">
                        <Link href="/thong-tin-tai-khoan" className="w-9 h-9 rounded-full bg-[#0B0B10] border border-white/[0.08] flex items-center justify-center text-white/60 hover:text-white hover:bg-[#111117] transition-all group">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 text-[#8FA7C5] text-xs font-bold uppercase tracking-widest mb-1">
                                <History className="w-3.5 h-3.5" />
                                <span>Thư viện cá nhân</span>
                            </div>
                            <h1 className="text-[24px] leading-[1.02] md:text-4xl font-black text-white tracking-tight uppercase">Lịch Sử Xem</h1>
                        </div>
                    </div>
                    {history.length > 0 && <ClearHistoryButton />}
                </div>

                {history.length === 0 ? (
                    <div className="py-20">
                        <EmptyState
                            icon={<History className="w-16 h-16 text-[#8FA7C5]" />}
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
                                <h2 className="text-[18px] md:text-xl font-bold text-white mb-5 flex items-center gap-2 border-l-4 border-[#8FA7C5] pl-3">
                                    <Play className="w-4 h-4 md:w-5 md:h-5 text-[#8FA7C5] fill-current" />
                                    Tiếp tục xem
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 [contain:layout_paint]">
                                    {continueWatching.map((item: any) => (
                                        <Link
                                            key={item._id}
                                            href={`/xem-phim/${item.movieSlug}/${item.episodeSlug}`}
                                            className="group relative block"
                                        >
                                            <div className="relative aspect-[2/3] rounded-[10px] overflow-hidden bg-[#0B0B10] shadow-[0_10px_20px_#00000066] border border-white/[0.08] group-hover:border-[#8FA7C5]/30 transition-all">
                                                <Image
                                                    src={getImageUrl(item.moviePoster)}
                                                    alt={item.movieName}
                                                    fill
                                                    loading="lazy"
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                />

                                                {/* Play button on hover */}
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 bg-black/20">
                                                    <div className="w-12 h-12 rounded-full bg-[#8FA7C5] flex items-center justify-center shadow-[0_0_20px_#8FA7C580] scale-0 group-hover:scale-100 transition-transform duration-300">
                                                        <Play className="w-6 h-6 text-black fill-black ml-1" />
                                                    </div>
                                                </div>

                                                {/* Progress Bar - đáy ảnh */}
                                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
                                                    <div
                                                        className="h-full bg-red-600"
                                                        style={{ width: `${item.progress}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Text bên dưới ảnh - không che mặt nhân vật */}
                                            <div className="mt-2 px-0.5">
                                                <h3 className="text-white font-semibold line-clamp-1 text-sm group-hover:text-[#8FA7C5] transition-colors">
                                                    {item.movieName}
                                                </h3>
                                                <div className="flex items-center justify-between mt-0.5">
                                                    <span className="text-white/50 text-xs">{item.episodeName}</span>
                                                    <span className="text-[#8FA7C5]/70 text-[10px] font-medium">{item.progress}%</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Full History */}
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <h2 className="text-[18px] md:text-xl font-bold text-white mb-5 flex items-center gap-2 border-l-4 border-gray-600 pl-3">
                                <History className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                                Tất cả đã xem
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 md:gap-x-4 gap-y-6 [contain:layout_paint]">
                                {history.map((item: any) => (
                                    <Link
                                        key={item._id}
                                        href={`/xem-phim/${item.movieSlug}/${item.episodeSlug}`}
                                        className="group relative block"
                                    >
                                        <div className="relative aspect-[2/3] rounded-[10px] overflow-hidden bg-[#0B0B10] shadow-[0_10px_20px_#00000066] border border-white/[0.08] group-hover:border-white/30 transition-all">
                                            <Image
                                                src={getImageUrl(item.moviePoster)}
                                                alt={item.movieName}
                                                fill
                                                loading="lazy"
                                                className="object-cover group-hover:scale-105 transition-transform duration-500 grayscale group-hover:grayscale-0"
                                            />

                                            {/* Progress Indicator */}
                                            {item.progress > 0 && (
                                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
                                                    <div
                                                        className="h-full bg-red-600/80"
                                                        style={{ width: `${item.progress}%` }}
                                                    />
                                                </div>
                                            )}

                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Play className="w-8 h-8 text-white fill-white drop-shadow-lg" />
                                            </div>
                                        </div>
                                        <div className="mt-2 px-1">
                                            <h3 className="text-gray-300 group-hover:text-white font-medium line-clamp-1 text-sm transition-colors">
                                                {item.movieName}
                                            </h3>
                                            <p className="text-gray-600 text-xs mt-0.5">{item.episodeName}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
