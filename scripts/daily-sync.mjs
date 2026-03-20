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

async function syncMovieList(type, limit = 48) {
    log(`Syncing [${type}] limit=${limit}...`);

    const [kkData, ophimData] = await Promise.all([
        fetchJson(`${KKPHIM_API}/v1/api/danh-sach/${type}?limit=${limit}&sort_field=view`),
        fetchJson(`${OPHIM_API}/v1/api/danh-sach/${type}?limit=${limit}&sort_field=view`)
    ]);

    const kkItems = getItems(kkData);
    const ophimItems = getItems(ophimData);
    const allItems = [...kkItems, ...ophimItems];

    // Deduplicate by slug
    const seen = new Set();
    const unique = allItems.filter(m => {
        if (!m.slug || seen.has(m.slug)) return false;
        seen.add(m.slug);
        return true;
    });

    // Sort by view count descending
    unique.sort((a, b) => (b.view || 0) - (a.view || 0));

    log(`  → Found ${unique.length} unique movies for [${type}]`);

    // Update cache collection
    await TrendingCache.findOneAndUpdate(
        { type },
        { type, movies: unique.slice(0, 24), updatedAt: new Date() },
        { upsert: true }
    );

    // Upsert individual movies into Movie collection
    let upserted = 0;
    for (const movie of unique) {
        try {
            await Movie.findOneAndUpdate(
                { slug: movie.slug },
                { $set: { ...movie, lastSynced: new Date() } },
                { upsert: true, setDefaultsOnInsert: true }
            );
            upserted++;
        } catch (e) {
            // Skip duplicates
        }
    }

    log(`  → Upserted ${upserted} movies into DB`);
    return unique.length;
}

async function syncTrendingWithViewCount() {
    log('Syncing trending sorted by view count...');

    const lists = ['phim-bo', 'phim-le', 'hoat-hinh', 'tv-shows', 'phim-chieu-rap'];

    for (const type of lists) {
        try {
            await syncMovieList(type, 48);
        } catch (e) {
            log(`  ✗ Error syncing ${type}: ${e.message}`);
        }
    }
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

async function main() {
    log('=== PhimKhoi Daily Sync Started ===');

    try {
        await mongoose.connect(MONGODB_URI);
        log('✓ Connected to MongoDB');

        await syncTrendingWithViewCount();
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
