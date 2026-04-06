import { NextResponse } from 'next/server';
import { getMoviesByFilterFromCache, getMoviesFromCache } from '@/lib/movie-cache';
import { getFallbackDisplayMovies, syncMoviesToLocalCache } from '@/services/server-movies';
import { getMoviesByCategory, getMoviesByCountry, getMoviesList } from '@/services/api';
import { sanitizeMovieList } from '@/lib/movie-list';
import { matchesCountryForDisplay } from '@/lib/movie-country';

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
        const allowAdult = slug === 'phim-18' || category === 'phim-18';
        const finalize = (items: any[]) => {
            const countryScopedItems =
                type === 'country' && slug
                    ? items.filter((item) => matchesCountryForDisplay(item, slug))
                    : items;
            return sanitizeMovieList(countryScopedItems, { limit, allowAdult });
        };
        const minFill = Math.min(limit, 12);
        const fillThreshold = Math.max(8, Math.floor(minFill * 0.6));

        // 1. Handle Categorical/Country filters
        if (type === 'category' || type === 'country') {
            if (!slug) return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
            
            const data = await getMoviesByFilterFromCache(type, slug, page, limit, { year, category });
            if (data) {
                const sanitizedItems = finalize(data.items || []);
                if (sanitizedItems.length >= fillThreshold) {
                    return NextResponse.json({
                    ...data,
                        items: sanitizedItems
                    }, {
                    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' }
                    });
                }
            }
        }

        // 2. Handle Generic List types (phim-bo, phim-le, etc.)
        if (type === 'list' && slug) {
            const data = await getMoviesFromCache(slug, page, limit);
            if (data) {
                const sanitizedItems = finalize(data.items || []);
                if (sanitizedItems.length > 0) {
                    return NextResponse.json({
                    ...data,
                        items: sanitizedItems
                    }, {
                    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' }
                    });
                }
            }
        }

        // 3. Cache miss -> try upstream immediately and sync local cache in background
        if (slug) {
            const externalData = await (
                type === 'country'
                    ? getMoviesByCountry(slug, page, limit, {
                        category: category !== 'all' ? category : undefined,
                        year: year !== 'all' ? Number(year) : undefined,
                        skipLocal: true,
                    })
                    : type === 'category'
                        ? getMoviesByCategory(slug, page, limit, {
                            country: undefined,
                            year: year !== 'all' ? Number(year) : undefined,
                        })
                        : getMoviesList(slug, {
                            page,
                            limit,
                            category: category !== 'all' ? category : undefined,
                            country: type === 'country' ? slug : undefined,
                            year: year !== 'all' ? Number(year) : undefined,
                        })
            ).catch((): null => null);

            if (externalData?.items?.length) {
                syncMoviesToLocalCache(externalData.items).catch(() => {});
                const sanitizedItems = finalize(externalData.items || []);
                if (sanitizedItems.length > 0) {
                    return NextResponse.json({
                    ...externalData,
                        items: sanitizedItems
                    }, {
                    headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' }
                    });
                }
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
                    items: finalize(fallbackItems),
                    pagination: { currentPage: page, totalPages: 1 },
                    fallback: true
                }, {
                    headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' }
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
