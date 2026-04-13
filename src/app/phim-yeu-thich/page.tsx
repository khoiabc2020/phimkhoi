export const dynamic = 'force-dynamic';

import { Heart, ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getFavorites, removeFavorite } from "@/app/actions/favorites";
import EmptyState from "@/components/EmptyState";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

function getImageUrl(url: string) {
    if (!url) return "/placeholder.jpg";
    if (url.startsWith("http")) return url;
    return `https://phimimg.com/${url}`;
}

async function RemoveFavoriteButton({ movieId }: { movieId: string }) {
    "use server";
    async function handleRemove() {
        "use server";
        await removeFavorite(movieId);
    }

    return (
        <form action={handleRemove}>
            <button
                type="submit"
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80 z-10"
                title="Bỏ yêu thích"
            >
                <Trash2 className="w-4 h-4 text-white" />
            </button>
        </form>
    );
}

export default async function FavoritesPage() {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/login");
    }

    const favoritesResult = await getFavorites();
    const favorites = favoritesResult.success && favoritesResult.data ? favoritesResult.data : [];

    return (
        <div className="min-h-screen bg-[#0a0a0a] pt-24 md:pt-28 pb-12 relative overflow-hidden">
            {/* Subtle gradient glow */}
            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute top-0 left-1/3 w-[500px] h-[350px] bg-red-500/6 blur-[140px] rounded-full" />
                <div className="absolute top-0 right-1/4 w-[400px] h-[300px] bg-[#8FA7C5]/5 blur-[120px] rounded-full" />
            </div>
            <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-4 md:px-12 lg:pl-24 lg:pr-12 relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 md:mb-8">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="w-9 h-9 rounded-full bg-[#0B0B10] border border-white/[0.08] flex items-center justify-center text-white/60 hover:text-white hover:bg-[#111117] transition-all">
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <div className="flex items-center gap-2.5">
                            <Heart className="w-6 h-6 text-red-400" />
                            <h1 className="text-[24px] leading-[1.02] md:text-4xl font-bold text-white">
                                Phim Yêu Thích
                                {favorites.length > 0 && (
                                    <span className="ml-2 text-base text-gray-400">({favorites.length})</span>
                                )}
                            </h1>
                        </div>
                    </div>
                </div>

                {favorites.length === 0 ? (
                    <EmptyState
                        icon={<Heart className="w-16 h-16 text-red-400" />}
                        title="Chưa có phim yêu thích"
                        description="Thêm phim vào danh sách yêu thích để xem lại sau."
                        action={{ label: "Khám phá phim", href: "/" }}
                    />
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 [contain:layout_paint]">
                        {favorites.map((item: any) => (
                            <div key={item._id} className="group relative">
                                <Link href={`/phim/${item.movieSlug}`}>
                                    <div className="relative aspect-[2/3] rounded-[10px] overflow-hidden bg-[#0B0B10] border border-white/[0.08] shadow-[0_10px_20px_#00000066]">
                                        <Image
                                            src={getImageUrl(item.moviePoster)}
                                            alt={item.movieName}
                                            fill
                                            loading="lazy"
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        {/* Quality Badge */}
                                        <div className="absolute top-2 left-2 px-2 py-1 bg-black/65 backdrop-blur-sm rounded text-xs font-bold text-white">
                                            {item.movieQuality}
                                        </div>
                                        {/* Favorite Indicator */}
                                        <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/80 backdrop-blur-sm flex items-center justify-center">
                                            <Heart className="w-4 h-4 text-white fill-white" />
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <h3 className="text-white font-semibold line-clamp-1 text-sm">
                                            {item.movieName}
                                        </h3>
                                        {item.movieOriginName && (
                                            <p className="text-yellow-400 text-xs line-clamp-1">
                                                {item.movieOriginName}
                                            </p>
                                        )}
                                        <p className="text-gray-400 text-xs">{item.movieYear}</p>
                                    </div>
                                </Link>
                                <RemoveFavoriteButton movieId={item.movieId} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
