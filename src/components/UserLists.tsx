"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import MovieRow from "@/components/MovieRow";
import { Movie } from "@/services/api";
import MovieRowSkeleton from "@/components/MovieRowSkeleton";

export default function UserLists() {
    const { data: session } = useSession();
    const [history, setHistory] = useState<Movie[]>([]);
    const [favorites, setFavorites] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.user) {
            const fetchData = async () => {
                try {
                    const [historyRes, favoritesRes] = await Promise.all([
                        fetch("/api/user/history"),
                        fetch("/api/user/favorites")
                    ]);

                    const historyData = await historyRes.json();
                    const favoritesData = await favoritesRes.json();

                    // Fetch full movie details for history items if needed, 
                    // but for now let's assume we might need to fetch details by slug
                    // OR we modify the API to return populated movies.

                    // Since our API currently stores just slugs, we need to fetch details.
                    // For optimization, we should probably update the API to return populated data.
                    // But to keep it simple for now, we will fetch details for the first 10 items.

                    const historyMovies = await Promise.all(
                        historyData.history.slice(0, 10).map(async (item: any) => {
                            const res = await fetch(`https://phimapi.com/phim/${item.slug}`);
                            const data = await res.json();
                            return data.movie;
                        })
                    );

                    const favoriteMovies = await Promise.all(
                        favoritesData.favorites.slice(0, 10).map(async (slug: string) => {
                            const res = await fetch(`https://phimapi.com/phim/${slug}`);
                            const data = await res.json();
                            return data.movie;
                        })
                    );

                    setHistory(historyMovies.filter(Boolean));
                    setFavorites(favoriteMovies.filter(Boolean));
                } catch (error) {
                    console.error("Failed to fetch user lists", error);
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        }
    }, [session]);



    if (!session || loading) return (
        <div className="space-y-8 mb-8 mt-8">
            <MovieRowSkeleton />
            <MovieRowSkeleton />
        </div>
    );


    return (
        <div className="space-y-8 mb-8">
            {history.length > 0 && <MovieRow title="Tiếp tục xem" movies={history} />}
            {favorites.length > 0 && <MovieRow title="Danh sách của tôi" movies={favorites} />}
        </div>
    );
}
