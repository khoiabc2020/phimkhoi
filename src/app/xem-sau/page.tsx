export const dynamic = 'force-dynamic';

import { Bookmark, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import EmptyState from "@/components/EmptyState";
import { removeFromWatchlist } from "@/app/actions/watchlist";
import mongoose from "mongoose";

function getImageUrl(url: string) {
    if (!url) return "/placeholder.jpg";
    if (url.startsWith("http")) return url;
    return `https://phimimg.com/${url}`;
}

async function RemoveWatchlistButton({ slug }: { slug: string }) {
    async function handleRemove() {
        "use server";
        await removeFromWatchlist(slug);
    }

    return (
        <form action={handleRemove}>
            <button
                type="submit"
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600/80 z-10 hover:scale-110"
                title="Xóa khỏi Xem Sau"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
            </button>
        </form>
    );
}

async function fetchMovieBySlug(slug: string) {
    try {
        const res = await fetch(`https://phimapi.com/phim/${slug}`, { next: { revalidate: 3600 } });
        if (!res.ok) return null;
        const data = await res.json();
        return data?.movie || null;
    } catch {
        return null;
    }
}

export default async function WatchlistPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    await dbConnect();
    // Guard against non-ObjectId session IDs (e.g. admin mock)
    if (!mongoose.isValidObjectId(session.user.id)) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <p className="text-white/40 text-sm">Không thể tải danh sách. Vui lòng đăng nhập lại.</p>
            </div>
        );
    }
    const user = await User.findById(session.user.id).select("watchlist").lean();
    const watchlistSlugs: string[] = (user as any)?.watchlist?.slice().reverse() || [];

    // Fetch movie data for all slugs in parallel (batch of 12 max to avoid rate limits)
    const movies = await Promise.all(
        watchlistSlugs.slice(0, 48).map(fetchMovieBySlug)
    );
    const validMovies = movies.filter(Boolean);

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            {/* Hero Banner */}
            <div className="relative pt-20 pb-8 px-4 md:px-12 bg-gradient-to-b from-black/60 to-[#0a0a0a]">
                <div className="max-w-7xl mx-auto">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6 transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Trang chủ
                    </Link>

                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                            <Bookmark className="w-7 h-7 text-primary fill-primary/30" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                                Xem Sau
                            </h1>
                            <p className="text-white/40 text-sm mt-0.5">
                                {watchlistSlugs.length > 0
                                    ? `${watchlistSlugs.length} phim đã lưu`
                                    : "Danh sách xem sau của bạn"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-12 pb-16">
                {validMovies.length === 0 ? (
                    <div className="mt-8">
                        <EmptyState
                            icon={<Bookmark className="w-16 h-16 text-primary/60" />}
                            title="Chưa có phim nào"
                            description='Thêm phim vào danh sách "Xem Sau" bằng nút + trên card phim.'
                            action={{ label: "Khám phá phim", href: "/" }}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                        {validMovies.map((movie: any) => (
                            <div key={movie.slug} className="group relative">
                                <Link href={`/phim/${movie.slug}`}>
                                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5 shadow-md">
                                        <Image
                                            src={getImageUrl(movie.poster_url || movie.thumb_url)}
                                            alt={movie.name}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            loading="lazy"
                                            unoptimized
                                        />
                                        {/* Gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                        {/* Quality Badge */}
                                        {movie.quality && (
                                            <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm border border-white/10 rounded text-[9px] font-bold text-white">
                                                {movie.quality}
                                            </div>
                                        )}

                                        {/* Bookmark indicator */}
                                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            <Bookmark className="w-3 h-3 text-black fill-black" />
                                        </div>

                                        {/* Play overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            <Link
                                                href={`/xem-phim/${movie.slug}`}
                                                className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/30 hover:scale-110 transition-all"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white" className="pl-0.5"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                            </Link>
                                        </div>
                                    </div>
                                    <div className="mt-2 space-y-0.5">
                                        <h3 className="text-white font-bold text-[13px] truncate group-hover:text-primary transition-colors">
                                            {movie.name}
                                        </h3>
                                        {movie.origin_name && (
                                            <p className="text-white/40 text-[11px] truncate italic">{movie.origin_name}</p>
                                        )}
                                        <p className="text-white/30 text-[10px]">{movie.year}</p>
                                    </div>
                                </Link>

                                <RemoveWatchlistButton slug={movie.slug} />
                            </div>
                        ))}
                    </div>
                )}

                {watchlistSlugs.length > 48 && (
                    <p className="text-center text-white/30 text-sm mt-8">
                        Hiển thị 48/{watchlistSlugs.length} phim đã lưu
                    </p>
                )}
            </div>
        </div>
    );
}
