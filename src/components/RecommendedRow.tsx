"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import MovieRow from "./MovieRow";

export default function RecommendedRow() {
    const { data: session, status } = useSession();
    const [movies, setMovies] = useState<any[]>([]);
    const [seeds, setSeeds] = useState<string[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (status === "loading") return;
        if (!session?.user) { setLoaded(true); return; }

        const cached = sessionStorage.getItem("phimkhoi_recommendations");
        if (cached) {
            try {
                const { movies: m, seeds: s } = JSON.parse(cached);
                if (m?.length) { setMovies(m); setSeeds(s || []); setLoaded(true); return; }
            } catch { /* ignore */ }
        }

        fetch("/api/user/recommendations")
            .then(r => r.json())
            .then(data => {
                if (data.items?.length) {
                    setMovies(data.items);
                    setSeeds(data.seeds || []);
                    sessionStorage.setItem("phimkhoi_recommendations", JSON.stringify({ movies: data.items, seeds: data.seeds }));
                }
                setLoaded(true);
            })
            .catch(() => setLoaded(true));
    }, [session, status]);

    if (!loaded || movies.length === 0) return null;

    const title = seeds.length > 0
        ? `Vì bạn đã xem ${seeds.slice(0, 2).join(", ")}`
        : "Đề xuất cho bạn";

    return (
        <MovieRow
            title={title}
            movies={movies}
            slug="/phim-yeu-thich"
        />
    );
}
