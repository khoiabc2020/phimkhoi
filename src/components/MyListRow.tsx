"use client";

import { useEffect, useState, memo } from "react";
import { useSession } from "next-auth/react";
import MovieRow from "@/components/MovieRow";

function MyListRowInner() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<any[]>([]);

    useEffect(() => {
        if (!session) {
            setLoading(false);
            return;
        }

        let cancelled = false;
        const fetchMyList = async () => {
            try {
                const res = await fetch("/api/user/watchlist-items", { cache: "no-store" });
                if (!res.ok) return;
                const data = await res.json();
                if (cancelled) return;
                setItems(Array.isArray(data.items) ? data.items : []);
            } catch (error) {
                console.error("Failed to fetch my list:", error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchMyList();
        return () => {
            cancelled = true;
        };
    }, [session]);

    if (!session) return null;
    if (loading) {
        return (
            <div className="py-2">
                <div className="h-4 w-44 bg-white/10 rounded animate-pulse mb-3" />
                <div className="flex gap-2.5 overflow-hidden">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="min-w-[132px] sm:min-w-[155px] md:min-w-[175px] aspect-[2/3] rounded-[10px] bg-white/10 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }
    if (!items.length) return null;

    return <MovieRow title="Danh sách của bạn" movies={items} slug="/xem-sau" />;
}

export default memo(MyListRowInner);

