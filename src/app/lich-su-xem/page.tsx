import { History, ArrowLeft, Trash2, Play, Clock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getWatchHistory, getContinueWatching, removeWatchHistory, clearWatchHistory } from "@/app/actions/watchHistory";
import EmptyState from "@/components/EmptyState";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

function getImageUrl(url: string) {
    if (!url) return "/placeholder.jpg";
    if (url.startsWith("http")) return url;
    return `https://phimimg.com/${url}`;
}

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
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors border border-red-500/20"
            >
                <Trash2 className="w-4 h-4" />
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
        <div className="min-h-screen bg-[#0a0a0a] pt-28 pb-12">
            <div className="container mx-auto px-4 md:px-12">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <History className="w-8 h-8 text-blue-400" />
                            <h1 className="text-3xl md:text-4xl font-bold text-white">Lịch Sử Xem</h1>
                        </div>
                    </div>
                    {history.length > 0 && <ClearHistoryButton />}
                </div>

                {history.length === 0 ? (
                    <EmptyState
                        icon={<History className="w-16 h-16 text-blue-400" />}
                        title="Chưa có lịch sử xem"
                        description="Lịch sử xem phim của bạn sẽ được hiển thị tại đây."
                        action={{ label: "Khám phá phim", href: "/" }}
                    />
                ) : (
                    <>
                        {/* Continue Watching Section */}
                        {continueWatching.length > 0 && (
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                    <Play className="w-6 h-6 text-yellow-400" />
                                    Tiếp tục xem
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {continueWatching.map((item: any) => (
                                        <Link
                                            key={item._id}
                                            href={`/xem-phim/${item.movieSlug}/${item.episodeSlug}`}
                                            className="group relative"
                                        >
                                            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-white/5">
                                                <Image
                                                    src={getImageUrl(item.moviePoster)}
                                                    alt={item.movieName}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                                {/* Progress Bar */}
                                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                                                    <div
                                                        className="h-full bg-red-500"
                                                        style={{ width: `${item.progress}%` }}
                                                    />
                                                </div>
                                                {/* Play Overlay */}
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Play className="w-12 h-12 text-white fill-white" />
                                                </div>
                                            </div>
                                            <div className="mt-2">
                                                <h3 className="text-white font-semibold line-clamp-1 text-sm">
                                                    {item.movieName}
                                                </h3>
                                                {item.movieOriginName && (
                                                    <p className="text-yellow-400 text-xs line-clamp-1 italic">
                                                        {item.movieOriginName}
                                                    </p>
                                                )}
                                                <p className="text-gray-400 text-xs line-clamp-1">{item.episodeName}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Clock className="w-3 h-3 text-gray-500" />
                                                    <span className="text-gray-500 text-xs">{item.progress}% đã xem</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Full History */}
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                <History className="w-6 h-6 text-gray-400" />
                                Tất cả lịch sử
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                                {history.map((item: any) => (
                                    <Link
                                        key={item._id}
                                        href={`/xem-phim/${item.movieSlug}/${item.episodeSlug}`}
                                        className="group relative"
                                    >
                                        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-white/5">
                                            <Image
                                                src={getImageUrl(item.moviePoster)}
                                                alt={item.movieName}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            {/* Progress Indicator */}
                                            {item.progress > 0 && (
                                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                                                    <div
                                                        className="h-full bg-red-500"
                                                        style={{ width: `${item.progress}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-2">
                                            <h3 className="text-white font-semibold line-clamp-1 text-sm">
                                                {item.movieName}
                                            </h3>
                                            {item.movieOriginName && (
                                                <p className="text-yellow-400 text-xs line-clamp-1 italic">
                                                    {item.movieOriginName}
                                                </p>
                                            )}
                                            <p className="text-gray-400 text-xs line-clamp-1">{item.episodeName}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
