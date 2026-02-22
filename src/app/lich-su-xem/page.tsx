
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
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500/20 transition-all border border-red-500/20 text-xs font-bold uppercase tracking-wider hover:scale-105"
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
        <div className="min-h-screen bg-black pt-28 pb-12 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-900/10 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-900/10 blur-[120px] rounded-full mix-blend-screen" />
            </div>

            <div className="container mx-auto px-4 md:px-12 relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/thong-tin-tai-khoan" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all group">
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 text-[#fbbf24] text-xs font-bold uppercase tracking-widest mb-1">
                                <History className="w-3.5 h-3.5" />
                                <span>Thư viện cá nhân</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase">Lịch Sử Xem</h1>
                        </div>
                    </div>
                    {history.length > 0 && <ClearHistoryButton />}
                </div>

                {history.length === 0 ? (
                    <div className="py-20">
                        <EmptyState
                            icon={<History className="w-16 h-16 text-[#fbbf24]" />}
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
                                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-l-4 border-[#fbbf24] pl-3">
                                    <Play className="w-5 h-5 text-[#fbbf24] fill-current" />
                                    Tiếp tục xem
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {continueWatching.map((item: any) => (
                                        <Link
                                            key={item._id}
                                            href={`/xem-phim/${item.movieSlug}/${item.episodeSlug}`}
                                            className="group relative block"
                                        >
                                            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-white/5 shadow-2xl border border-white/10 ring-1 ring-white/5 group-hover:ring-[#fbbf24]/50 transition-all">
                                                <Image
                                                    src={getImageUrl(item.moviePoster)}
                                                    alt={item.movieName}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                                {/* Gradient Overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                                                {/* Play Overlay */}
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                                                    <div className="w-12 h-12 rounded-full bg-[#fbbf24] flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.5)] scale-0 group-hover:scale-100 transition-transform duration-300">
                                                        <Play className="w-6 h-6 text-black fill-black ml-1" />
                                                    </div>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 backdrop-blur-sm z-20">
                                                    <div
                                                        className="h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)] relative"
                                                        style={{ width: `${item.progress}%` }}
                                                    >
                                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity delay-100" />
                                                    </div>
                                                </div>

                                                <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white font-bold border border-white/10 shadow-lg">
                                                    {item.episodeName}
                                                </div>
                                            </div>

                                            <div className="mt-3 px-1">
                                                <h3 className="text-white font-bold line-clamp-1 text-sm group-hover:text-[#fbbf24] transition-colors">
                                                    {item.movieName}
                                                </h3>
                                                <div className="flex items-center justify-between mt-1">
                                                    <p className="text-white/40 text-xs line-clamp-1">{item.movieOriginName}</p>
                                                    <div className="flex items-center gap-1 text-[#fbbf24]/80 text-[10px] font-medium bg-[#fbbf24]/10 px-1.5 py-0.5 rounded">
                                                        <Clock className="w-3 h-3" />
                                                        <span>{item.progress}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Full History */}
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-l-4 border-gray-600 pl-3">
                                <History className="w-5 h-5 text-gray-400" />
                                Tất cả đã xem
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-4 gap-y-8">
                                {history.map((item: any) => (
                                    <Link
                                        key={item._id}
                                        href={`/xem-phim/${item.movieSlug}/${item.episodeSlug}`}
                                        className="group relative block"
                                    >
                                        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-white/5 shadow-lg border border-white/10 group-hover:border-white/30 transition-all">
                                            <Image
                                                src={getImageUrl(item.moviePoster)}
                                                alt={item.movieName}
                                                fill
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
