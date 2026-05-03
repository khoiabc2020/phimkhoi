#!/usr/bin/env node
/**
 * PhimKhoi Daily Auto-Sync Script - Optimized & Fixed
 */

import mongoose from 'mongoose';
import https from 'https';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeMovieImages } from './shared/movie-media.mjs';
import { ASIAN_COUNTRY_RULES, matchesCountryForDisplay, matchesCountryStrict } from './shared/movie-country.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const KKPHIM_API = 'https://phimapi.com';
const OPHIM_API = 'https://ophim1.com';
const NGUONC_API = 'https://phim.nguonc.com';
const TMDB_API_URL = 'https://api.themoviedb.org/3';
const MONGODB_URI = process.env.MONGODB_URI;
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const COUNTRY_SYNC_SLUGS = new Set(['trung-quoc', 'han-quoc', 'nhat-ban', 'thai-lan', 'viet-nam', 'dai-loan']);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const normalizeText = (value) =>
    String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();

if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI not found in .env.local');
    process.exit(1);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fetchJson(url) {
    return new Promise((resolve) => {
        const options = {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
            timeout: 15000
        };
        https.get(url, options, (res) => {
            if (res.statusCode === 429) {
                console.warn(`    ⚠️ Rate limited (429) at ${url.substring(0, 40)}... Waiting 2s`);
                resolve({ rateLimited: true });
                return;
            }
            if (res.statusCode !== 200) {
                resolve(null);
                return;
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { resolve(null); }
            });
        }).on('error', () => resolve(null))
          .on('timeout', () => resolve(null));
    });
}

async function searchTMDBMovie(query, year, type = 'movie') {
    if (!TMDB_API_KEY) return null;
    
    const cleanQuery = query
        .replace(/Vietsub|Thuyết Minh|Lồng Tiếng|Tập \d+/gi, "")
        .replace(/\d+D/gi, "") 
        .replace(/Phần \d+|Season \d+|SS\d+/gi, "") 
        .replace(/\(.*\)/g, "")
        .replace(/\s+/g, " ")
        .trim();

    if (!cleanQuery) return null;

    try {
        const endpoint = type === 'tv' ? 'tv' : 'movie';
        const locales = ['vi-VN', 'en-US']; // Stick to standard ISO codes
        
        for (const locale of locales) {
            const url = `${TMDB_API_URL}/search/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanQuery)}&language=${locale}`;
            const data = await fetchJson(url);
            
            if (data?.results?.length > 0) {
                let match = data.results[0];
                if (year) {
                    const found = data.results.find(r => {
                        const rYear = (r.release_date || r.first_air_date || '').substring(0, 4);
                        return Math.abs(parseInt(rYear) - parseInt(year)) <= 1;
                    });
                    if (found) match = found;
                }
                return { ...match, media_type: endpoint };
            }
            await sleep(200); // Small gap between locales
        }
    } catch (e) { return null; }
    return null;
}

function getItems(data) {
    if (!data) return [];
    if (Array.isArray(data.items)) return data.items;
    if (data.data?.items) return data.data.items;
    return [];
}

function extractYear(movie) {
    const parsed = Number(String(movie?.year || '').slice(0, 4));
    return Number.isFinite(parsed) && parsed > 1900 ? parsed : 0;
}

function extractTmdbYear(tmdbData) {
    const value = tmdbData?.release_date || tmdbData?.first_air_date || tmdbData?.year;
    const parsed = Number(String(value || '').slice(0, 4));
    return Number.isFinite(parsed) && parsed > 1900 ? parsed : 0;
}

function buildMovieTitleKeys(movie) {
    const values = [
        movie?.origin_name,
        movie?.name,
        String(movie?.slug || '').replace(/-/g, ' '),
    ]
        .map(normalizeText)
        .filter((value, index, arr) => value.length >= 3 && arr.indexOf(value) === index);

    return new Set(values);
}

function buildTmdbTitleKeys(tmdbData) {
    return [
        tmdbData?.title,
        tmdbData?.name,
        tmdbData?.original_title,
        tmdbData?.original_name,
    ]
        .map(normalizeText)
        .filter((value, index, arr) => value.length >= 3 && arr.indexOf(value) === index);
}

function hasTitleAffinity(movie, tmdbData) {
    const movieKeys = Array.from(buildMovieTitleKeys(movie));
    const tmdbKeys = buildTmdbTitleKeys(tmdbData);
    if (movieKeys.length === 0 || tmdbKeys.length === 0) return false;

    return movieKeys.some(movieKey =>
        tmdbKeys.some(tmdbKey =>
            movieKey === tmdbKey ||
            movieKey.includes(tmdbKey) ||
            tmdbKey.includes(movieKey)
        )
    );
}

function shouldUseTmdbMedia(movie, tmdbData) {
    if (!movie || !tmdbData || typeof tmdbData !== 'object') return false;
    if (!tmdbData.poster_path && !tmdbData.backdrop_path) return false;

    const movieYear = extractYear(movie);
    const tmdbYear = extractTmdbYear(tmdbData);
    if (movieYear && tmdbYear && Math.abs(movieYear - tmdbYear) > 2) return false;

    const tmdbTitles = buildTmdbTitleKeys(tmdbData);
    if (tmdbTitles.length > 0 && !hasTitleAffinity(movie, tmdbData)) return false;

    const originalLanguage = normalizeText(tmdbData.original_language || '');
    const originCountries = Array.isArray(tmdbData.origin_country)
        ? tmdbData.origin_country.map(value => String(value || '').toUpperCase())
        : [];
    const countrySlugs = Array.isArray(movie?.country)
        ? movie.country.map(country => String(country?.slug || '').trim()).filter(Boolean)
        : [];

    for (const countrySlug of countrySlugs) {
        const rule = ASIAN_COUNTRY_RULES[countrySlug] || null;
        if (!rule) continue;
        const hasExpectedLanguage = rule.langs.some(lang => originalLanguage === lang);
        const hasExpectedCountry = rule.countries.some(country => originCountries.includes(country));
        if (!hasExpectedLanguage && !hasExpectedCountry) return false;
    }

    return true;
}

function sanitizeMovieRecord(movie) {
    if (!movie) return movie;
    const images = normalizeMovieImages({
        poster_url: movie.poster_url,
        thumb_url: movie.thumb_url,
    });
    const tmdbData = shouldUseTmdbMedia({ ...movie, ...images }, movie.tmdbData) ? movie.tmdbData : null;
    return {
        ...movie,
        ...images,
        tmdbData,
    };
}

function pickLongerText(nextValue, currentValue) {
    const nextText = String(nextValue || '').trim();
    const currentText = String(currentValue || '').trim();
    return nextText.length >= currentText.length ? nextText : currentText;
}

function pickNonEmptyArray(nextValue, currentValue) {
    const nextArray = Array.isArray(nextValue) ? nextValue.filter(Boolean) : [];
    const currentArray = Array.isArray(currentValue) ? currentValue.filter(Boolean) : [];
    return nextArray.length >= currentArray.length ? nextArray : currentArray;
}

function mergeMovieRecord(existing, incoming) {
    const current = existing || {};
    const next = sanitizeMovieRecord({ ...current, ...incoming });
    return sanitizeMovieRecord({
        ...current,
        ...next,
        name: String(next.name || current.name || '').trim(),
        origin_name: pickLongerText(next.origin_name, current.origin_name),
        content: pickLongerText(next.content, current.content),
        poster_url: next.poster_url || current.poster_url || '',
        thumb_url: next.thumb_url || current.thumb_url || '',
        trailer_url: next.trailer_url || current.trailer_url || '',
        time: next.time || current.time || '',
        episode_current: next.episode_current || current.episode_current || '',
        episode_total: next.episode_total || current.episode_total || '',
        quality: next.quality || current.quality || '',
        lang: next.lang || current.lang || '',
        notify: next.notify || current.notify || '',
        showtimes: next.showtimes || current.showtimes || '',
        type: next.type || current.type || '',
        status: next.status || current.status || '',
        year: next.year || current.year || 0,
        view: next.view || current.view || 0,
        actor: pickNonEmptyArray(next.actor, current.actor),
        director: pickNonEmptyArray(next.director, current.director),
        category: pickNonEmptyArray(next.category, current.category),
        country: pickNonEmptyArray(next.country, current.country),
        episodes: pickNonEmptyArray(next.episodes, current.episodes),
        tmdbData: next.tmdbData || current.tmdbData || null,
    });
}

function log(msg) {
    console.log(`[${new Date().toISOString()}] ${msg}`);
}

// ── Models ──────────────────────────────────────────────────────────────────

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

const trendingSchema = new mongoose.Schema({
    type: { type: String, index: true },
    movies: Array,
    updatedAt: { type: Date, default: Date.now }
});

const TrendingCache = mongoose.models.TrendingCache || mongoose.model('TrendingCache', trendingSchema, 'trendingcaches');

// ── Stats ────────────────────────────────────────────────────────────────────

const STATS = {
    kkphim: 0,
    ophim: 0,
    nguonc: 0,
    totalCreated: 0,
    totalUpdated: 0
};

const isTrailer = (m) => {
    if (!m) return true;
    const s = String(m.status || "").toLowerCase();
    const e = String(m.episode_current || "").toLowerCase();
    const n = String(m.name || "").toLowerCase();
    const q = String(m.quality || "").toLowerCase();
    const ny = String(m.notify || "").toLowerCase();
    
    const markers = ["trailer", "teaser", "preview", "nhá hàng", "sắp chiếu", "coming soon"];
    
    return markers.some(mkr => 
        s.includes(mkr) || e.includes(mkr) || n.includes(mkr) || q.includes(mkr) || ny.includes(mkr)
    );
};

async function syncMovieList(slug, pages = 1) {
    log(`Syncing [${slug}] depth=${pages}...`);
    
    try {
        let allItems = [];
        
        for (let page = 1; page <= pages; page++) {
            let endpoint = 'the-loai';
            if (['phim-bo', 'phim-le', 'tv-shows', 'hoat-hinh', 'phim-moi-cap-nhat'].includes(slug)) endpoint = 'danh-sach';
            if (['han-quoc', 'trung-quoc', 'viet-nam'].includes(slug)) endpoint = 'quoc-gia';

            let nguoncUrl = `${NGUONC_API}/api/films/${endpoint}/${slug}?page=${page}`;
            if (slug === 'phim-moi-cap-nhat') nguoncUrl = `${NGUONC_API}/api/films/phim-moi-cap-nhat?page=${page}`;

            const [kkRes, ophimRes, nguoncRes] = await Promise.all([
                fetchJson(`${KKPHIM_API}/v1/api/${endpoint}/${slug}?page=${page}&limit=48`),
                fetchJson(`${OPHIM_API}/v1/api/${endpoint}/${slug}?page=${page}&limit=48`),
                fetchJson(nguoncUrl)
            ]);

            // Handle 429
            if ([kkRes, ophimRes, nguoncRes].some(r => r?.rateLimited)) {
                await sleep(3000);
                page--; // Retry this page
                continue;
            }

            const kkPathImage = kkRes?.pathImage || kkRes?.data?.pathImage || "";
            const ophimPathImage = ophimRes?.pathImage || ophimRes?.data?.pathImage || "https://img.ophim.live/uploads/movies/";

            const kkItems = getItems(kkRes).map(item => sanitizeMovieRecord({
                ...item,
                thumb_url: item.thumb_url?.startsWith('http') ? item.thumb_url : (kkPathImage + item.thumb_url),
                poster_url: item.poster_url?.startsWith('http') ? item.poster_url : (kkPathImage + item.poster_url)
            }));
            
            const ophimItems = getItems(ophimRes).map(item => sanitizeMovieRecord({
                ...item,
                thumb_url: item.thumb_url?.startsWith('http') ? item.thumb_url : (ophimPathImage + item.thumb_url),
                poster_url: item.poster_url?.startsWith('http') ? item.poster_url : (ophimPathImage + item.poster_url)
            }));

            const nguoncItems = (nguoncRes?.items || []).map(item => sanitizeMovieRecord({
                ...item,
                _id: item.id || item.slug,
                thumb_url: item.thumb_url || item.poster_url,
                poster_url: item.poster_url || item.thumb_url
            }));


            if (kkItems.length === 0 && ophimItems.length === 0 && nguoncItems.length === 0) break;
            
            const currentBatch = [...kkItems];
            STATS.kkphim += kkItems.length;

            for (const item of ophimItems) {
                if (!currentBatch.some(m => m.slug === item.slug)) {
                    currentBatch.push(item);
                    STATS.ophim++;
                }
            }
            for (const item of nguoncItems) {
                if (!currentBatch.some(m => m.slug === item.slug)) {
                    currentBatch.push(item);
                    STATS.nguonc++;
                }
            }

            allItems.push(...currentBatch);
            await sleep(600); // Rate limit breather per page
        }

        const seen = new Set();
        const unique = allItems.filter(m => {
            if (!m.slug || seen.has(m.slug)) return false;
            if (isTrailer(m)) return false;
            if (COUNTRY_SYNC_SLUGS.has(slug) && !matchesCountryForDisplay(m, slug)) return false;
            
            // Fix MongoDB "language override unsupported" error
            if (m.language) {
                m.lang = m.language;
                delete m.language;
            }
            
            seen.add(m.slug);
            return true;
        }).map(sanitizeMovieRecord);

        const cleanCacheMovies = unique
            .filter(movie => !isTrailer(movie))
            .filter(movie => !COUNTRY_SYNC_SLUGS.has(slug) || matchesCountryForDisplay(movie, slug))
            .map(sanitizeMovieRecord);

        await TrendingCache.findOneAndUpdate(
            { type: slug },
            { type: slug, movies: cleanCacheMovies.slice(0, 150), updatedAt: new Date() },
            { upsert: true }
        );

        // Bulk fetch tất cả existing movies trong 1 query thay vì N queries
        const slugsToUpsert = cleanCacheMovies.map(m => m.slug);
        const existingDocs = await Movie.find({ slug: { $in: slugsToUpsert } }).lean();
        const existingMap = new Map(existingDocs.map(m => [m.slug, m]));

        const now = new Date();
        const bulkOps = cleanCacheMovies.map(movie => {
            const existing = existingMap.get(movie.slug) || null;
            const { _id, ...updateData } = mergeMovieRecord(existing, movie);
            return {
                updateOne: {
                    filter: { slug: movie.slug },
                    update: { $set: { ...sanitizeMovieRecord(updateData), lastSynced: now } },
                    upsert: true,
                },
            };
        });

        if (bulkOps.length > 0) {
            const bulkResult = await Movie.bulkWrite(bulkOps, { ordered: false });
            STATS.totalCreated += bulkResult.upsertedCount;
            STATS.totalUpdated += bulkResult.modifiedCount;
        }

        log(`  → Found ${unique.length} unique movies for [${slug}]`);
    } catch (error) {
        log(`  ✗ Error syncing [${slug}]: ${error.message}`);
    }
}

async function syncTrendingWithViewCount(deep = false) {
    const lists = ['phim-bo', 'phim-le', 'hoat-hinh', 'tv-shows', 'phim-chieu-rap', 'phim-moi-cap-nhat', 'trung-quoc', 'han-quoc', 'viet-nam'];
    const pagesToSync = deep ? 150 : 25;

    for (const slug of lists) {
        await syncMovieList(slug, pagesToSync);
        await sleep(1500); // Category breather
    }
    await syncFullMovieDetails();
}

async function syncFullMovieDetails() {
    log('Syncing FULL movie details for all trending items...');
    const caches = await TrendingCache.find({});
    const allSlugs = new Set();
    caches.forEach(c => (c.movies || []).forEach(m => allSlugs.add(m.slug)));
    
    log(`  → Found ${allSlugs.size} unique trending slugs to hydrate`);
    
    const slugsArray = Array.from(allSlugs);
    log(`Hydrating ${slugsArray.length} movies...`);
    const BATCH_SIZE = 8;
    let hydrated = 0;

    for (let i = 0; i < slugsArray.length; i += BATCH_SIZE) {
        const batch = slugsArray.slice(i, i + BATCH_SIZE);
        if (i % (BATCH_SIZE * 5) === 0) {
            console.log(`  > Progress: ${i}/${slugsArray.length} (${Math.round(i/slugsArray.length*100)}%)`);
        }
        await Promise.all(batch.map(async (slug) => {
            try {
                // Fetch toàn bộ fields ngay từ đầu — dùng lại cho merge, không fetch lần 2
                const existing = await Movie.findOne({ slug }).lean();
                if (existing?.lastSynced && (new Date() - new Date(existing.lastSynced) < 86400000)) return;

                let detailData = await fetchJson(`${KKPHIM_API}/v1/api/phim/${slug}`);
                if (!detailData?.data?.item) detailData = await fetchJson(`${OPHIM_API}/v1/api/phim/${slug}`);

                if (detailData?.data?.item) {
                    const { _id, ...itemData } = detailData.data.item;
                    const episodes = detailData.data.episodes || [];

                    // Fix MongoDB "language override unsupported" error
                    if (itemData.language) {
                        itemData.lang = itemData.language;
                        delete itemData.language;
                    }

                    let tmdbData = existing?.tmdbData || null;
                    if (tmdbData && !shouldUseTmdbMedia(itemData, tmdbData)) {
                        tmdbData = null;
                    }
                    if (!tmdbData) {
                        const tmdbCandidate = await searchTMDBMovie(itemData.origin_name || itemData.name, itemData.year);
                        tmdbData = shouldUseTmdbMedia(itemData, tmdbCandidate) ? tmdbCandidate : null;
                    }

                    // Tái sử dụng existing đã fetch ở trên — không cần findOne lần 2
                    const mergedRecord = mergeMovieRecord(existing, {
                        ...itemData,
                        episodes,
                        tmdbData,
                    });
                    
                    await Movie.updateOne(
                        { slug },
                        { $set: { ...mergedRecord, lastSynced: new Date() } }
                    );
                    hydrated++;
                }
            } catch (e) {}
        }));
        await sleep(400); // Throttling hydration
    }
    log(`  ✓ Successfully hydrated ${hydrated} movies`);
}

async function syncTMDBTrending(timeWindow = 'day') {
    if (!TMDB_API_KEY) return;
    const type = `tmdb-trending-${timeWindow}`;
    log(`Syncing [${type}] (Hero Data source)...`);

    try {
        const mappedMovies = [];
        const data = await fetchJson(`${TMDB_API_URL}/trending/movie/${timeWindow}?api_key=${TMDB_API_KEY}&language=vi-VN&page=1`);
        
        if (data?.results) {
            for (const item of data.results) {
                const itemName = item.title || item.name;
                const itemOriginalName = item.original_title || item.original_name;

                const localMovie = await Movie.findOne({
                    $or: [
                        { name: new RegExp(`^${itemName}$`, 'i') },
                        { origin_name: new RegExp(`^${itemOriginalName}$`, 'i') },
                        { name: { $regex: itemName.split(' - ')[0], $options: 'i' } }
                    ]
                }).lean();

                if (localMovie) {
                    const candidate = {
                        ...localMovie,
                        poster_url: item.poster_path ? `https://image.tmdb.org/t/p/original${item.poster_path}` : localMovie.poster_url,
                        thumb_url: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : localMovie.thumb_url,
                        tmdbData: {
                            id: item.id,
                            vote_average: item.vote_average,
                            poster_path: item.poster_path,
                            backdrop_path: item.backdrop_path,
                            original_language: item.original_language,
                            original_title: item.original_title,
                            original_name: item.original_name,
                            title: item.title,
                            name: item.name,
                            release_date: item.release_date,
                            first_air_date: item.first_air_date,
                            origin_country: item.origin_country || [],
                            media_type: item.media_type || 'movie'
                        }
                    };
                    mappedMovies.push(sanitizeMovieRecord(candidate));
                }
            }
            await TrendingCache.findOneAndUpdate({ type }, { type, movies: mappedMovies, updatedAt: new Date() }, { upsert: true });
            log(`  ✓ Saved ${mappedMovies.length} items for [${type}]`);
        }
    } catch (e) { log(`  ✗ TMDb Trending Error: ${e.message}`); }
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
            await syncTrendingWithViewCount(true);
        } else {
            await syncTrendingWithViewCount(isFull);
        }

        await syncTMDBTrending('day');
        await syncTMDBTrending('week');

        console.log('\n' + '='.repeat(50));
        console.log('SYNC SUMMARY:');
        console.log(`- KKPhim: ${STATS.kkphim} movies processed`);
        console.log(`- OPhim:  ${STATS.ophim} additional matches`);
        console.log(`- NguonC: ${STATS.nguonc} additional matches`);
        console.log(`- New Records: ${STATS.totalCreated} | Updated: ${STATS.totalUpdated}`);
        console.log('='.repeat(50) + '\n');

    } catch (e) {
        log(`✗ Fatal Error: ${e.message}`);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

main();
