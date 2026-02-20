#!/usr/bin/env node
/**
 * PhimKhoi Daily Auto-Sync Script
 * Chạy hàng ngày để đồng bộ dữ liệu phim mới từ KKPHIM + OPhim API vào MongoDB
 * Cài cron: crontab -e → 0 2 * * * cd /var/www/phimkhoi && node scripts/daily-sync.mjs >> /var/log/phimkhoi-sync.log 2>&1
 */

import mongoose from 'mongoose';
import https from 'https';

const KKPHIM_API = 'https://phimapi.com';
const OPHIM_API = 'https://ophim1.com';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/phimkhoi';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
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

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
    log('=== PhimKhoi Daily Sync Started ===');

    try {
        await mongoose.connect(MONGODB_URI);
        log('✓ Connected to MongoDB');

        await syncTrendingWithViewCount();

        log('=== Sync Completed Successfully ===');
    } catch (e) {
        log(`✗ Fatal Error: ${e.message}`);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

main();
