import { NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const KKPHIM_API = 'https://phimapi.com';
const OPHIM_API = 'https://ophim1.com';

function getItems(data: any) {
    if (!data) return [];
    if (Array.isArray(data.items)) return data.items;
    if (data.data?.items) return data.data.items;
    return [];
}

/** Normalize KKPHIM/OPhim image URLs */
function normalizeUrl(url: string, pathImage: string = '') {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${pathImage}${url}`;
}

/** Search KKPHIM then OPhim for a movie by original title */
async function findInVietnamese(query: string, year?: number) {
    const safeQuery = encodeURIComponent(query.replace(/[:\/\\]/g, ' ').trim());

    const [kkRes, ophimRes] = await Promise.allSettled([
        fetch(`${KKPHIM_API}/v1/api/tim-kiem?keyword=${safeQuery}&limit=5`).then(r => r.json()).catch(() => null),
        fetch(`${OPHIM_API}/v1/api/tim-kiem?keyword=${safeQuery}&limit=5`).then(r => r.json()).catch(() => null),
    ]);

    const allItems: any[] = [];

    if (kkRes.status === 'fulfilled' && kkRes.value) {
        const d = kkRes.value;
        const pathImage = d.pathImage || d.data?.pathImage || '';
        const items = getItems(d).map((m: any) => ({
            ...m,
            thumb_url: normalizeUrl(m.thumb_url, pathImage),
            poster_url: normalizeUrl(m.poster_url, pathImage),
        }));
        allItems.push(...items);
    }

    if (ophimRes.status === 'fulfilled' && ophimRes.value) {
        const d = ophimRes.value;
        const pathImage = d.pathImage || 'https://img.ophim.live/uploads/movies/';
        const items = getItems(d).map((m: any) => ({
            ...m,
            thumb_url: normalizeUrl(m.thumb_url, pathImage),
            poster_url: normalizeUrl(m.poster_url, pathImage),
        }));
        allItems.push(...items);
    }

    if (allItems.length === 0) return null;

    // Best match: prefer same year, then first result
    if (year) {
        const yearMatch = allItems.find(m => m.year === year || m.year === year - 1 || m.year === year + 1);
        if (yearMatch) return yearMatch;
    }

    return allItems[0];
}

export async function GET() {
    try {
        if (!TMDB_API_KEY) {
            return NextResponse.json({ error: 'TMDB API key not configured' }, { status: 500 });
        }

        // 1. Fetch TMDB trending (all: movies + TV, daily)
        const [trendAllRes, trendTvRes] = await Promise.all([
            fetch(`https://api.themoviedb.org/3/trending/all/day?api_key=${TMDB_API_KEY}&language=vi-VN`, {
                next: { revalidate: 3600 } // Cache 1 hour
            }).then(r => r.json()),
            fetch(`https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB_API_KEY}&language=vi-VN`, {
                next: { revalidate: 3600 }
            }).then(r => r.json()),
        ]);

        // Combine and deduplicate TMDB results
        const tmdbItems: any[] = [];
        const seenIds = new Set<number>();

        for (const item of [...(trendAllRes.results || []), ...(trendTvRes.results || [])]) {
            if (!seenIds.has(item.id)) {
                seenIds.add(item.id);
                tmdbItems.push(item);
            }
        }

        // 2. For each TMDB item, find matching Vietnamese streaming movie
        const heroMovies: any[] = [];

        for (const tmdb of tmdbItems.slice(0, 20)) {
            // Use original title for better matching accuracy
            const searchQuery = tmdb.original_title || tmdb.original_name || tmdb.title || tmdb.name;
            const year = tmdb.release_date
                ? parseInt(tmdb.release_date.substring(0, 4))
                : tmdb.first_air_date
                    ? parseInt(tmdb.first_air_date.substring(0, 4))
                    : undefined;

            const match = await findInVietnamese(searchQuery, year);

            if (match) {
                heroMovies.push({
                    // Base: KKPHIM/OPhim movie data (has streaming links)
                    ...match,
                    // Override images with TMDB high-res (backdrop for hero)
                    tmdb_backdrop: tmdb.backdrop_path
                        ? `https://image.tmdb.org/t/p/original${tmdb.backdrop_path}`
                        : null,
                    tmdb_poster: tmdb.poster_path
                        ? `https://image.tmdb.org/t/p/w500${tmdb.poster_path}`
                        : null,
                    tmdb_vote: tmdb.vote_average,
                    tmdb_id: tmdb.id,
                    // Keep KKPHIM poster if TMDB one not available
                    thumb_url: tmdb.backdrop_path
                        ? `https://image.tmdb.org/t/p/original${tmdb.backdrop_path}`
                        : match.thumb_url,
                    poster_url: tmdb.poster_path
                        ? `https://image.tmdb.org/t/p/w500${tmdb.poster_path}`
                        : match.poster_url,
                });

                if (heroMovies.length >= 12) break; // Max 12 for hero
            }
        }

        return NextResponse.json({
            movies: heroMovies,
            generatedAt: new Date().toISOString(),
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
            }
        });

    } catch (error) {
        console.error('Hero trending error:', error);
        return NextResponse.json({ error: 'Server error', movies: [] }, { status: 500 });
    }
}
