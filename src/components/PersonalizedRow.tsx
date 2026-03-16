"use client";

import { useEffect, useMemo, useState, memo } from "react";
import { useSession } from "next-auth/react";
import MovieRow from "@/components/MovieRow";

interface PersonalizedResponse {
  items: any[];
  seeds: string[];
  reasonTags?: string[];
}

type FilterKey = "all" | "series" | "single" | "tv" | "anime";

const FILTER_LABELS: Record<FilterKey, string> = {
  all: "Tất cả",
  series: "Phim bộ",
  single: "Phim lẻ",
  tv: "TV Shows",
  anime: "Hoạt hình",
};

const detectBucket = (movie: any): FilterKey => {
  const type = String(movie?.type || "").toLowerCase();
  if (type.includes("hoat-hinh")) return "anime";
  if (type.includes("tv")) return "tv";
  if (type.includes("phim-bo") || type.includes("series")) return "series";
  if (type.includes("phim-le") || type.includes("single")) return "single";

  const categories = Array.isArray(movie?.category) ? movie.category : [];
  const hasAnime = categories.some((c: any) => String(c?.slug || "").includes("hoat-hinh"));
  if (hasAnime) return "anime";
  return "all";
};

function PersonalizedRowInner() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [movies, setMovies] = useState<any[]>([]);
  const [seeds, setSeeds] = useState<string[]>([]);
  const [reasonTags, setReasonTags] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchRecommendations = async () => {
      try {
        const res = await fetch("/api/user/recommendations", { cache: "no-store" });
        if (!res.ok) return;
        const data: PersonalizedResponse = await res.json();
        if (cancelled) return;
        setMovies(Array.isArray(data.items) ? data.items : []);
        setSeeds(Array.isArray(data.seeds) ? data.seeds : []);
        setReasonTags(Array.isArray(data.reasonTags) ? data.reasonTags : []);
      } catch (error) {
        console.error("Failed to fetch recommendations:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRecommendations();
    return () => {
      cancelled = true;
    };
  }, [session]);

  const filterCounts = useMemo(() => {
    const counts: Record<FilterKey, number> = { all: movies.length, series: 0, single: 0, tv: 0, anime: 0 };
    for (const movie of movies) {
      const bucket = detectBucket(movie);
      if (bucket !== "all") counts[bucket] += 1;
    }
    return counts;
  }, [movies]);

  const enabledFilters = useMemo(
    () => (Object.keys(FILTER_LABELS) as FilterKey[]).filter((key) => key === "all" || filterCounts[key] > 0),
    [filterCounts]
  );

  useEffect(() => {
    if (!enabledFilters.includes(activeFilter)) {
      setActiveFilter("all");
    }
  }, [enabledFilters, activeFilter]);

  const filteredMovies = useMemo(() => {
    if (activeFilter === "all") return movies;
    return movies.filter((movie) => detectBucket(movie) === activeFilter);
  }, [movies, activeFilter]);

  if (!session) return null;

  if (loading) {
    return (
      <div className="py-2">
        <div className="h-4 w-52 bg-white/10 rounded animate-pulse mb-3" />
        <div className="flex gap-2.5 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-w-[132px] sm:min-w-[155px] md:min-w-[175px] aspect-[2/3] rounded-[10px] bg-white/10 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!movies.length) return null;

  return (
    <div className="space-y-2">
      {seeds.length ? (
        <p className="px-3 sm:px-4 text-[11px] sm:text-xs text-white/50">
          Dựa trên lịch sử xem: <span className="text-white/72">{seeds.join(" • ")}</span>
        </p>
      ) : null}
      {reasonTags.length ? (
        <div className="px-3 sm:px-4 flex items-center gap-1.5 flex-wrap">
          {reasonTags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center h-6 px-2 rounded-md text-[10px] sm:text-[11px] font-semibold bg-[#F4C84A]/12 border border-[#F4C84A]/20 text-[#F4C84A]/90"
            >
              Cùng gu: {tag}
            </span>
          ))}
        </div>
      ) : null}
      <div className="px-2 sm:px-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {enabledFilters.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveFilter(key)}
              className={[
                "h-8 px-3 rounded-[10px] text-[11px] sm:text-[12px] font-semibold border whitespace-nowrap transition-colors",
                activeFilter === key
                  ? "bg-[#F4C84A] border-[#F4C84A] text-[#0a0d14]"
                  : "bg-[#0B0B10] border-white/[0.08] text-white/70 hover:text-white hover:border-white/[0.14]",
              ].join(" ")}
            >
              {FILTER_LABELS[key]}
              {key !== "all" ? ` (${filterCounts[key]})` : ""}
            </button>
          ))}
        </div>
      </div>
      <MovieRow title="Vì bạn đã xem" movies={filteredMovies} />
    </div>
  );
}

export default memo(PersonalizedRowInner);

