export const dynamic = "force-dynamic";

import { ArrowLeft, Bookmark } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import EmptyState from "@/components/EmptyState";
import { removeFromWatchlist } from "@/app/actions/watchlist";
import { getMergedWatchlist } from "@/lib/user-library";

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
                className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 opacity-0 transition-all hover:scale-110 hover:bg-red-600/80 group-hover:opacity-100"
                title="Xóa khỏi Xem Sau"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4h6v2" />
                </svg>
            </button>
        </form>
    );
}

export default async function WatchlistPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");

    const watchlist = await getMergedWatchlist(session.user);
    const movies = watchlist.movies.slice(0, 48);

    return (
        <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
            {/* Subtle gradient glow */}
            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute top-0 left-1/4 w-[500px] h-[350px] bg-[#8FA7C5]/8 blur-[150px] rounded-full" />
                <div className="absolute top-0 right-1/3 w-[400px] h-[300px] bg-indigo-500/5 blur-[120px] rounded-full" />
            </div>
            <div className="relative z-10 px-4 pb-8 pt-24 md:px-12">
                <div className="mx-auto max-w-7xl">
                    <Link
                        href="/"
                        className="group mb-6 inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Trang chủ
                    </Link>

                    <div className="mb-2 flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-primary/30 bg-primary/15">
                            <Bookmark className="h-7 w-7 fill-primary/30 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                                Xem Sau
                            </h1>
                            <p className="mt-0.5 text-sm text-white/40">
                                {watchlist.slugs.length > 0
                                    ? `${watchlist.slugs.length} phim đã lưu`
                                    : "Danh sách xem sau của bạn"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 pb-16 md:px-12 lg:pl-24 lg:pr-12 relative z-10">
                {movies.length === 0 ? (
                    <div className="mt-8">
                        <EmptyState
                            icon={<Bookmark className="h-16 w-16 text-primary/60" />}
                            title="Chưa có phim nào"
                            description='Thêm phim vào danh sách "Xem Sau" bằng nút lưu trên card phim.'
                            action={{ label: "Khám phá phim", href: "/" }}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 md:gap-4 lg:grid-cols-5 xl:grid-cols-6 [contain:layout_paint]">
                        {movies.map((movie) => (
                            <div key={movie.slug} className="group relative">
                                <Link href={`/phim/${movie.slug}`}>
                                    <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-[#0B0B10] border border-white/[0.06] group-hover:border-white/20 transition-[border-color] duration-200">
                                        <Image
                                            src={getImageUrl(movie.poster || "") || "/placeholder.jpg"}
                                            alt={movie.name}
                                            fill
                                            loading="lazy"
                                            sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 17vw"
                                            className="object-cover transition-transform duration-300 group-hover:scale-105 will-change-transform"
                                        />
                                        {/* Hover overlay */}
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/35 flex items-center justify-center">
                                            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center scale-75 group-hover:scale-100 transition-transform duration-200 shadow-lg">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="black" className="pl-0.5">
                                                    <polygon points="5 3 19 12 5 21 5 3" />
                                                </svg>
                                            </div>
                                        </div>

                                        {movie.quality && (
                                            <div className="absolute left-1.5 top-1.5 rounded border border-white/10 bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white">
                                                {movie.quality}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-2 px-0.5">
                                        <h3 className="truncate text-[12px] font-medium text-white/85 transition-colors duration-150 group-hover:text-white">
                                            {movie.name}
                                        </h3>
                                        {movie.year && <p className="text-[10px] text-white/35 mt-0.5">{movie.year}</p>}
                                    </div>
                                </Link>

                                <RemoveWatchlistButton slug={movie.slug} />
                            </div>
                        ))}
                    </div>
                )}

                {watchlist.slugs.length > 48 && (
                    <p className="mt-8 text-center text-sm text-white/30">
                        Hiển thị 48/{watchlist.slugs.length} phim đã lưu
                    </p>
                )}
            </div>
        </div>
    );
}
