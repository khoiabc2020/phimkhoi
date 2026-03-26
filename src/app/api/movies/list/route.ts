import { NextResponse } from 'next/server';
import { getMoviesByFilterFromCache, getMoviesFromCache } from '@/lib/movie-cache';
import { getFallbackDisplayMovies, syncMoviesToLocalCache } from '@/services/server-movies';
import { getMoviesList } from '@/services/api';

/**
 * [Elite Retrieval API]
 * Bridges the frontend listings to the local MongoDB cache.
 * Ensures "full" grid pages (28 items) and lightning-fast loads.
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type') || 'category';
        const slug = searchParams.get('slug');
        const page = Math.max(1, Number(searchParams.get('page')) || 1);
        const limit = Math.max(1, Number(searchParams.get('limit')) || 28);
        const year = searchParams.get('year') || 'all';
        const category = searchParams.get('category') || 'all';

        // 1. Handle Categorical/Country filters
        if (type === 'category' || type === 'country') {
            if (!slug) return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
            
            const data = await getMoviesByFilterFromCache(type, slug, page, limit, { year, category });
            if (data) {
                return NextResponse.json(data, {
                    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
                });
            }
        }

        // 2. Handle Generic List types (phim-bo, phim-le, etc.)
        if (type === 'list' && slug) {
            const data = await getMoviesFromCache(slug, page, limit);
            if (data) {
                return NextResponse.json(data, {
                    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
                });
            }
        }

        // 3. Cache miss -> try upstream immediately and sync local cache in background
        if (slug) {
            const externalData = await getMoviesList(slug, {
                page,
                limit,
                category: type === 'category' ? slug : category !== 'all' ? category : undefined,
                country: type === 'country' ? slug : undefined,
                year: year !== 'all' ? Number(year) : undefined,
            }).catch((): null => null);

            if (externalData?.items?.length) {
                syncMoviesToLocalCache(externalData.items).catch(() => {});
                return NextResponse.json(externalData, {
                    headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' }
                });
            }

            const fallbackItems = await getFallbackDisplayMovies({
                type: slug,
                limit,
                options: {
                    category: type === 'category' ? slug : category !== 'all' ? category : undefined,
                    country: type === 'country' ? slug : undefined,
                    year,
                }
            });

            if (fallbackItems.length) {
                return NextResponse.json({
                    items: fallbackItems,
                    pagination: { currentPage: page, totalPages: 1 },
                    fallback: true
                }, {
                    headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' }
                });
            }
        }

        // 4. Absolute fallback
        return NextResponse.json({ items: [], pagination: { currentPage: 1, totalPages: 0 }, fallback: true });

    } catch (error) {
        console.error('[API Movies List] Error:', error);
        return NextResponse.json({ items: [], error: 'Internal server error' }, { status: 500 });
    }
}
