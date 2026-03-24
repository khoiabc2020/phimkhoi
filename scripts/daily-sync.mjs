#!/usr/bin/env node
/**
 * PhimKhoi Daily Auto-Sync Script
 * Chạy hàng ngày để đồng bộ dữ liệu phim mới từ KKPHIM + OPhim API vào MongoDB
 * Cài cron: crontab -e → 0 2 * * * cd /var/www/phimkhoi && node scripts/daily-sync.mjs >> /var/log/phimkhoi-sync.log 2>&1
 */

import mongoose from 'mongoose';
import https from 'https';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const KKPHIM_API = 'https://phimapi.com';
const OPHIM_API = 'https://ophim1.com';
const NGUONC_API = 'https://phim.nguonc.com';
const TMDB_API_URL = 'https://api.themoviedb.org/3';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/phimkhoi';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

// ── Helpers ──────────────────────────────────────────────────────────────────

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        };
        https.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { resolve(null); }
            });
        }).on('error', () => resolve(null));
    });
}

function getItems(data) {
    if (!data) return [];
    if (Array.isArray(data.items)) return data.items;
    if (data.data?.items) return data.data.items;
    return [];
}

function log(msg) {
    console.log(`[${new Date().toISOString()}] ${msg}`);
}

// ── Movie Schema ──────────────────────────────────────────────────────────────

const movieSchema = new mongoose.Schema({
    _id: String,
    name: String,
    slug: { type: String, unique: true, index: true },
    origin_name: String,
    type: String,
    status: String,
    thumb_url: String,
    poster_url: String,
    quality: String,
    lang: String,
    year: Number,
    view: { type: Number, default: 0 },
    episode_current: String,
    episode_total: String,
    chieurap: Boolean,
    category: Array,
    country: Array,
    lastSynced: { type: Date, default: Date.now }
}, { strict: false });

const Movie = mongoose.models.Movie || mongoose.model('Movie', movieSchema, 'movies');

// ── Trending Cache Schema ─────────────────────────────────────────────────────

const trendingSchema = new mongoose.Schema({
    type: { type: String, index: true }, // 'phim-bo', 'phim-le', 'hoat-hinh', 'tv-shows'
    movies: Array,
    updatedAt: { type: Date, default: Date.now }
});

const TrendingCache = mongoose.models.TrendingCache || mongoose.model('TrendingCache', trendingSchema, 'trendingcache');

// ── Sync Functions ────────────────────────────────────────────────────────────

async function syncMovieList(type, pages = 1, limitPerPage = 48) {
    log(`Syncing [${type}] depth=${pages}...`);
    
    let allItems = [];
    
    for (let page = 1; page <= pages; page++) {
        log(`  → Fetching page ${page}...`);
        
        // Translate type for NguonC (they use 'films' prefix in some cases)
        let nguoncUrl = `${NGUONC_API}/api/films/the-loai/${type}?page=${page}`;
        if (['phim-bo', 'phim-le', 'tv-shows', 'hoat-hinh'].includes(type) || type.startsWith('phim-')) {
            nguoncUrl = `${NGUONC_API}/api/films/danh-sach/${type}?page=${page}`;
        }
        if (['han-quoc', 'trung-quoc', 'viet-nam'].includes(type)) {
            nguoncUrl = `${NGUONC_API}/api/films/quoc-gia/${type}?page=${page}`;
        }

        const [kkRes, ophimRes, nguoncRes] = await Promise.all([
            fetchJson(`${KKPHIM_API}/v1/api/danh-sach/${type}?page=${page}&limit=${limitPerPage}&sort_field=modified.time`),
            fetchJson(`${OPHIM_API}/v1/api/danh-sach/${type}?page=${page}&limit=${limitPerPage}&sort_field=modified.time`),
            fetchJson(nguoncUrl)
        ]);

        const kkPathImage = kkRes?.pathImage || kkRes?.data?.pathImage || "";
        const ophimPathImage = ophimRes?.pathImage || ophimRes?.data?.pathImage || "https://img.ophim.live/uploads/movies/";

        const kkItems = getItems(kkRes).map(item => ({
            ...item,
            thumb_url: item.thumb_url?.startsWith('http') ? item.thumb_url : (kkPathImage + item.thumb_url),
            poster_url: item.poster_url?.startsWith('http') ? item.poster_url : (kkPathImage + item.poster_url)
        }));
        
        const ophimItems = getItems(ophimRes).map(item => ({
            ...item,
            thumb_url: item.thumb_url?.startsWith('http') ? item.thumb_url : (ophimPathImage + item.thumb_url),
            poster_url: item.poster_url?.startsWith('http') ? item.poster_url : (ophimPathImage + item.poster_url)
        }));

        const nguoncItems = (nguoncRes?.items || []).map(item => ({
            ...item,
            _id: item.id || item.slug,
            thumb_url: item.thumb_url, // NguonC usually provides full URLs or different format
            poster_url: item.poster_url
        }));

        if (kkItems.length === 0 && ophimItems.length === 0 && nguoncItems.length === 0) break;
        
        allItems = [...allItems, ...kkItems, ...ophimItems, ...nguoncItems];
    }

    // Deduplicate by slug
    const seen = new Set();
    const unique = allItems.filter(m => {
        if (!m.slug || seen.has(m.slug)) return false;
        seen.add(m.slug);
        return true;
    });

    // Sort by modified time descending (newest first)
    unique.sort((a, b) => {
        const timeA = new Date(a.modified?.time || 0).getTime();
        const timeB = new Date(b.modified?.time || 0).getTime();
        return timeB - timeA;
    });

    log(`  → Found ${unique.length} unique movies for [${type}]`);

    // Update cache collection (Elite Depth: 120 items)
    await TrendingCache.findOneAndUpdate(
        { type },
        { type, movies: unique.slice(0, 120), updatedAt: new Date() },
        { upsert: true }
    );

    // Upsert individual movies into Movie collection
    let upserted = 0;
    for (const movie of unique) {
        try {
            // FIX: Destructure _id out of movie object to avoid "modifying immutable field _id" error
            const { _id, ...updateData } = movie;
            await Movie.findOneAndUpdate(
                { slug: movie.slug },
                { $set: { ...updateData, lastSynced: new Date() } },
                { upsert: true, setDefaultsOnInsert: true }
            );
            upserted++;
        } catch (e) {
            // Skip duplicates or other errors
        }
    }

    log(`  → Upserted ${upserted} movies into DB`);
    return unique.length;
}

async function syncTrendingWithViewCount(deep = false) {
    log(`Syncing trending sorted by view count (deep=${deep})...`);

    const lists = ['phim-bo', 'phim-le', 'hoat-hinh', 'tv-shows', 'phim-chieu-rap', 'phim-moi-cap-nhat', 'trung-quoc', 'han-quoc', 'viet-nam'];
    const pagesToSync = deep ? 100 : 15;

    // Parallel sync for categories
    await Promise.all(lists.map(async (type) => {
        try {
            await syncMovieList(type, pagesToSync, 48);
        } catch (e) {
            log(`  ✗ Error syncing ${type}: ${e.message}`);
        }
    }));

    // [Elite Persistence] Sync FULL details for all movies in TrendingCache
    await syncFullMovieDetails();
}

async function syncFullMovieDetails() {
    log('Syncing FULL movie details for all trending items...');
    
    // Get all slugs currently in cache
    const caches = await TrendingCache.find({});
    const allSlugs = new Set();
    caches.forEach(c => c.movies.forEach(m => allSlugs.add(m.slug)));
    
    log(`  → Found ${allSlugs.size} unique trending slugs to hydrate`);
    
    let hydrated = 0;
    const slugsArray = Array.from(allSlugs);
    
    // BATCH PROCESSING: Hydrate in parallel groups of 5 to speed up significantly
    const BATCH_SIZE = 5;
    for (let i = 0; i < slugsArray.length; i += BATCH_SIZE) {
        const batch = slugsArray.slice(i, i + BATCH_SIZE);
        
        await Promise.all(batch.map(async (slug) => {
            try {
                // 1. Check if already synced recently OR if it already has episodes (shallow check)
                const existing = await Movie.findOne({ slug }, { episodes: 1, lastSynced: 1, content: 1 }).lean();
                
                // If it has episodes and was synced within 48h, skip it (Elite Efficiency)
                if (existing && existing.episodes && existing.episodes.length > 0 && 
                    existing.lastSynced && (new Date() - new Date(existing.lastSynced) < 172800000)) {
                    return; 
                }

                // 2. Fetch full detail (try KKPHIM first, then OPHIM, then NguonC)
                let detailData = await fetchJson(`${KKPHIM_API}/v1/api/phim/${slug}`);
                if (!detailData || !detailData.data?.item) {
                    detailData = await fetchJson(`${OPHIM_API}/v1/api/phim/${slug}`);
                }
                if (!detailData || !detailData.data?.item) {
                    const nc = await fetchJson(`${NGUONC_API}/api/film/${slug}`);
                    if (nc?.status === 'success') {
                        detailData = {
                            data: {
                                item: { ...nc.movie, thumb_url: nc.movie.poster_url, poster_url: nc.movie.thumb_url },
                                episodes: nc.movie.episodes?.map(e => ({
                                    server_name: e.server_name,
                                    server_data: e.items?.map(it => ({ name: it.name, slug: it.slug, link_embed: it.embed, link_m3u8: it.m3u8 }))
                                })) || []
                            }
                        };
                    }
                }
                
                if (!detailData || !detailData.data?.item) return;
                
                const item = detailData.data.item;
                const episodes = detailData.data.episodes || [];

                const { _id, ...itemData } = item;
                await Movie.findOneAndUpdate(
                    { slug },
                    { 
                        $set: { 
                            ...itemData, 
                            episodes, 
                            lastSynced: new Date()
                        } 
                    },
                    { upsert: true }
                );
                
                hydrated++;
            } catch (e) {
                // Log but continue
            }
        }));

        if (hydrated > 0 && hydrated % 20 === 0) log(`    ... Hydrated ${hydrated}/${slugsArray.length} movies`);
        // Small pause between batches
        await new Promise(r => setTimeout(r, 500));
    }
    
    log(`  ✓ Successfully hydrated ${hydrated} movies with full metadata`);
}

async function syncTMDBTrending(timeWindow = 'day') {
    if (!TMDB_API_KEY) {
        log('✗ Skipping TMDb Trending: TMDB_API_KEY not found');
        return;
    }

    const type = `tmdb-trending-${timeWindow}`;
    log(`Syncing [${type}] (Hero Data source - Expanded Search)...`);

    try {
        const mappedMovies = [];
        const maxPages = 3;
        const targetCount = 10;

        for (let page = 1; page <= maxPages; page++) {
            if (mappedMovies.length >= targetCount) break;

            const url = `${TMDB_API_URL}/trending/movie/${timeWindow}?api_key=${TMDB_API_KEY}&language=vi-VN&page=${page}`;
            const data = await fetchJson(url);
            
            if (!data || !data.results) {
                log(`  ✗ Error fetching TMDb Trending [${timeWindow}] page ${page}`);
                break;
            }

            for (const item of data.results) {
                if (mappedMovies.length >= 20) break; // Hard limit

                const title = item.title || item.name;
                const originalTitle = item.original_title || item.original_name;
                
                // Search local DB for matching slug
                const localMovie = await Movie.findOne({
                    $or: [
                        { name: new RegExp(`^${title}$`, 'i') },
                        { origin_name: new RegExp(`^${originalTitle}$`, 'i') },
                        { slug: title.toLowerCase().replace(/[^a-z0-9]/g, '-') }
                    ]
                }).lean();

                if (!localMovie) continue;

                // Skip duplicates
                if (mappedMovies.some(m => m.slug === localMovie.slug)) continue;

                // Skip if it is just a Trailer or Unreleased
                const ep = (localMovie.episode_current || '').toLowerCase();
                const status = (localMovie.status || '').toLowerCase();
                if (ep.includes('trailer') || status.includes('trailer') || status.includes('sắp chiếu')) {
                    continue;
                }

                mappedMovies.push({
                    _id: String(item.id),
                    name: title,
                    slug: localMovie.slug,
                    // Use 'original' for maximum quality as requested
                    poster_url: item.poster_path ? `https://image.tmdb.org/t/p/original${item.poster_path}` : localMovie.poster_url,
                    thumb_url: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : localMovie.thumb_url,
                    year: parseInt((item.release_date || item.first_air_date || '0000').substring(0, 4)) || localMovie.year,
                    tmdbData: {
                        id: item.id,
                        vote_average: item.vote_average,
                        poster_path: item.poster_path,
                        backdrop_path: item.backdrop_path,
                        media_type: item.media_type
                    },
                    content: localMovie.content || item.overview,
                    episode_current: localMovie.episode_current,
                    quality: localMovie.quality || 'FHD',
                    category: localMovie.category,
                    country: localMovie.country,
                    time: localMovie.time,
                    origin_name: localMovie.origin_name || originalTitle
                });
            }
        }

        await TrendingCache.findOneAndUpdate(
            { type },
            { type, movies: mappedMovies, updatedAt: new Date() },
            { upsert: true }
        );

        log(`  ✓ Saved ${mappedMovies.length} items for [${type}] (High Quality)`);
    } catch (error) {
        log(`  ✗ TMDb Trending Error: ${error.message}`);
    }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function hydrateAllMovies() {
    log('=== FULL LIBRARY HYDRATION MODE ===');
    // Find all movies that have no episodes (dark cards) OR relative image paths
    const missingData = await Movie.find(
        { $or: [
            { episodes: { $in: [null, [], undefined] } },
            { thumb_url: { $in: [null, '', undefined] } },
            { thumb_url: { $not: /^http/ } }, // Catch relative paths like "uploads/..."
        ]},
        { slug: 1, _id: 0 }
    ).lean();

    log(`  → Found ${missingData.length} movies needing hydration`);

    let hydrated = 0;
    let failed = 0;
    const slugs = missingData.map(m => m.slug).filter(Boolean);
    const BATCH_SIZE = 8; // Larger batch for faster throughput

    for (let i = 0; i < slugs.length; i += BATCH_SIZE) {
        const batch = slugs.slice(i, i + BATCH_SIZE);

        await Promise.all(batch.map(async (slug) => {
            try {
                let detailData = await fetchJson(`${KKPHIM_API}/v1/api/phim/${slug}`);
                if (!detailData?.data?.item) {
                    detailData = await fetchJson(`${OPHIM_API}/v1/api/phim/${slug}`);
                }
                // Try NguonC fallback too for detail
                if (!detailData?.data?.item) {
                    const nc = await fetchJson(`${NGUONC_API}/api/film/${slug}`);
                    if (nc?.status === 'success') {
                        // Normalize NguonC detail to match our expected structure
                        detailData = {
                            data: {
                                item: {
                                    ...nc.movie,
                                    origin_name: nc.movie.original_name,
                                    content: nc.movie.description,
                                    thumb_url: nc.movie.poster_url, // NguonC flips these
                                    poster_url: nc.movie.thumb_url
                                },
                                episodes: nc.movie.episodes?.map(e => ({
                                    server_name: e.server_name,
                                    server_data: e.items?.map(it => ({
                                        name: it.name,
                                        slug: it.slug,
                                        link_embed: it.embed,
                                        link_m3u8: it.m3u8
                                    }))
                                })) || []
                            }
                        };
                    }
                }
                if (!detailData?.data?.item) { failed++; return; }

                const item = detailData.data.item;
                const episodes = detailData.data.episodes || [];
                const pathImage = detailData.data?.pathImage || detailData.pathImage || "";
                
                const { _id, ...itemData } = item;
                
                // Final safety: ensure absolute URLs in DB
                if (itemData.thumb_url && !itemData.thumb_url.startsWith('http')) itemData.thumb_url = pathImage + itemData.thumb_url;
                if (itemData.poster_url && !itemData.poster_url.startsWith('http')) itemData.poster_url = pathImage + itemData.poster_url;

                await Movie.findOneAndUpdate(
                    { slug },
                    { $set: { ...itemData, episodes, lastSynced: new Date() } },
                    { upsert: true }
                );
                hydrated++;
            } catch (e) { failed++; }
        }));

        if ((i + BATCH_SIZE) % 80 === 0 || i + BATCH_SIZE >= slugs.length) {
            log(`    ... Hydrated ${hydrated}/${slugs.length} | Failed: ${failed}`);
        }
        // Avoid rate limits
        await new Promise(r => setTimeout(r, 300));
    }

    log(`  ✓ Full library hydration complete: ${hydrated} hydrated, ${failed} failed`);
}

async function main() {
    const isFull = process.argv.includes('--full');
    const isHydrateAll = process.argv.includes('--hydrate-all');
    const mode = isHydrateAll ? 'HYDRATE-ALL' : isFull ? 'FULL' : 'QUICK';
    log(`=== PhimKhoi Daily Sync Started (Mode: ${mode}) ===`);

    try {
        await mongoose.connect(MONGODB_URI);
        log('✓ Connected to MongoDB');

        if (isHydrateAll) {
            // Deep hydrate all movies in DB with missing data
            await syncTrendingWithViewCount(true); // Pull latest list data first
            await hydrateAllMovies();             // Then hydrate every missing movie
        } else {
            await syncTrendingWithViewCount(isFull);
        }

        await syncTMDBTrending('day');
        await syncTMDBTrending('week');

        log('=== Sync Completed Successfully ===');
    } catch (e) {
        log(`✗ Fatal Error: ${e.message}`);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

main();
