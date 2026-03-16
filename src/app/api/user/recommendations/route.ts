import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import WatchHistory from "@/models/WatchHistory";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getMovieDetail, getMoviesByCategory, getMoviesByCountry, Movie } from "@/services/api";

type TagItem = { slug?: string; name?: string };
type TagScore = { slug: string; name: string; count: number };

const countTags = (map: Map<string, TagScore>, tags: TagItem[] = []) => {
  for (const t of tags) {
    if (!t?.slug) continue;
    const prev = map.get(t.slug);
    if (!prev) {
      map.set(t.slug, { slug: t.slug, name: t.name || t.slug, count: 1 });
    } else {
      map.set(t.slug, { ...prev, count: prev.count + 1 });
    }
  }
};

const topTags = (map: Map<string, TagScore>, limit: number) =>
  [...map.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

const topSlugs = (map: Map<string, TagScore>, limit: number) =>
  topTags(map, limit)
    .slice(0, limit)
    .map((t) => t.slug);

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ items: [], seeds: [], reasonTags: [] }, { status: 200 });
    }

    await dbConnect();

    const recentWatched = await WatchHistory.aggregate([
      { $match: { userId: session.user.id } },
      { $sort: { lastWatched: -1 } },
      { $group: { _id: "$movieSlug", doc: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$doc" } },
      { $sort: { lastWatched: -1 } },
      { $limit: 6 },
      { $project: { movieSlug: 1, movieName: 1, movieOriginName: 1 } },
    ]);

    if (!recentWatched?.length) {
      return NextResponse.json(
        { items: [], seeds: [], reasonTags: [] },
        { headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=120" } }
      );
    }

    const watchedSlugSet = new Set<string>(
      recentWatched.map((w: { movieSlug?: string }) => w.movieSlug).filter(Boolean)
    );

    const detailResults = await Promise.all(
      recentWatched.map(async (w: { movieSlug?: string }) => {
        if (!w.movieSlug) return null;
        return getMovieDetail(w.movieSlug).catch(() => null);
      })
    );

    const categoryCount = new Map<string, TagScore>();
    const countryCount = new Map<string, TagScore>();

    for (const detail of detailResults) {
      const movie = (detail as any)?.movie;
      if (!movie) continue;
      countTags(categoryCount, Array.isArray(movie.category) ? movie.category : []);
      countTags(countryCount, Array.isArray(movie.country) ? movie.country : []);
    }

    const topCategorySlugs = topSlugs(categoryCount, 2);
    const topCountrySlugs = topSlugs(countryCount, 1);
    const reasonTags = [...topTags(categoryCount, 2), ...topTags(countryCount, 1)].map((t) => t.name);

    const categoryFetches = topCategorySlugs.map((slug) =>
      getMoviesByCategory(slug, 1, 24).then((res) => res.items || []).catch((): Movie[] => [])
    );
    const countryFetches = topCountrySlugs.map((slug) =>
      getMoviesByCountry(slug, 1, 24).then((res) => res.items || []).catch((): Movie[] => [])
    );

    const buckets = await Promise.all([...categoryFetches, ...countryFetches]);

    const merged = buckets.flat();
    const uniqueBySlug = new Map<string, Movie>();
    for (const item of merged) {
      if (!item?.slug) continue;
      if (watchedSlugSet.has(item.slug)) continue;
      if (!uniqueBySlug.has(item.slug)) {
        uniqueBySlug.set(item.slug, item);
      }
    }

    const items = [...uniqueBySlug.values()].slice(0, 12);
    const seeds = recentWatched
      .map((w: { movieName?: string; movieOriginName?: string }) => w.movieName || w.movieOriginName)
      .filter(Boolean)
      .slice(0, 3);

    return NextResponse.json(
      { items, seeds, reasonTags },
      {
        headers: {
          "Cache-Control": "private, max-age=120, stale-while-revalidate=180",
        },
      }
    );
  } catch (error) {
    console.error("Recommendations API error:", error);
    return NextResponse.json({ items: [], seeds: [], reasonTags: [], error: "Server Error" }, { status: 500 });
  }
}

