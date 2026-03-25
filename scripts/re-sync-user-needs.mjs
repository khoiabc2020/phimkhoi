import mongoose from 'mongoose';
import https from 'https';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const KKPHIM_API = 'https://phimapi.com';
const TMDB_API_URL = 'https://api.themoviedb.org/3';
const MONGODB_URI = process.env.MONGODB_URI;
const TMDB_API_KEY = process.env.TMDB_API_KEY;

if (!MONGODB_URI) { console.error('Error: MONGODB_URI not found'); process.exit(1); }

function fetchJson(url) {
    return new Promise((resolve) => {
        const options = { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 };
        https.get(url, options, (res) => {
            if (res.statusCode !== 200) { resolve(null); return; }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { resolve(null); }
            });
        }).on('error', (e) => { console.error('Fetch error:', e.message); resolve(null); });
    });
}

const movieSchema = new mongoose.Schema({ slug: { type: String, unique: true, index: true } }, { strict: false });
const Movie = mongoose.models.Movie || mongoose.model('Movie', movieSchema, 'movies');
const TrendingCache = mongoose.models.TrendingCache || mongoose.model('TrendingCache', new mongoose.Schema({ type: String, movies: Array, updatedAt: Date }), 'trendingcaches');

async function syncList(slug, pages = 1) {
    console.log(`>>> Syncing List [${slug}]...`);
    let endpoint = 'danh-sach';
    if (['han-quoc', 'trung-quoc', 'viet-nam'].includes(slug)) endpoint = 'quoc-gia';
    if (['hoat-hinh', 'phim-chieu-rap'].includes(slug)) endpoint = 'the-loai';

    let all = [];
    for (let p=1; p<=pages; p++) {
        const res = await fetchJson(`${KKPHIM_API}/v1/api/${endpoint}/${slug}?page=${p}&limit=48`);
        const items = res?.data?.items || [];
        if (items.length === 0) break;
        const pathImage = res?.data?.pathImage || "";
        items.forEach(item => {
            item.thumb_url = item.thumb_url?.startsWith('http') ? item.thumb_url : (pathImage + item.thumb_url);
            item.poster_url = item.poster_url?.startsWith('http') ? item.poster_url : (pathImage + item.poster_url);
            all.push(item);
        });
        console.log(`  Page ${p}: found ${items.length} items`);
    }

    if (all.length > 0) {
        await TrendingCache.findOneAndUpdate({ type: slug }, { type: slug, movies: all.slice(0, 50), updatedAt: new Date() }, { upsert: true });
        for (const m of all) {
            const updateData = { ...m };
            delete updateData._id; // IMPORTANT: Prevent Mongoose CastError on _id
            await Movie.updateOne({ slug: m.slug }, { $set: { ...updateData, lastSynced: new Date() } }, { upsert: true });
        }
        console.log(`  Done [${slug}]: saved ${all.length} movies.`);
    }
}

async function syncTMDB(window = 'day') {
    if (!TMDB_API_KEY) { console.error('No TMDB KEY'); return; }
    console.log(`>>> Syncing TMDB Trending [${window}]...`);
    const data = await fetchJson(`${TMDB_API_URL}/trending/movie/${window}?api_key=${TMDB_API_KEY}&language=vi-VN`);
    if (!data?.results) { console.error('No TMDB data'); return; }
    
    let mapped = [];
    for (const item of data.results) {
        const titles = [item.title, item.original_title].filter(Boolean);
        const movie = await Movie.findOne({ $or: [{ name: { $in: titles } }, { origin_name: { $in: titles } }] }).lean();
        if (movie) {
            mapped.push({
                ...movie,
                poster_url: `https://image.tmdb.org/t/p/w780${item.poster_path}`,
                thumb_url: `https://image.tmdb.org/t/p/original${item.backdrop_path}`,
                tmdbData: item
            });
        }
    }
    if (mapped.length > 0) {
        await TrendingCache.findOneAndUpdate({ type: `tmdb-trending-${window}` }, { type: `tmdb-trending-${window}`, movies: mapped, updatedAt: new Date() }, { upsert: true });
        console.log(`  Done TMDB [${window}]: mapped ${mapped.length} movies.`);
    } else {
        console.log(`  Done TMDB [${window}]: 0 matches found.`);
    }
}

async function run() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');
        await syncList('han-quoc', 3);
        await syncList('trung-quoc', 3);
        await syncList('phim-bo', 2);
        await syncList('phim-le', 2);
        await syncTMDB('day');
        await syncTMDB('week');
        console.log('FULL SYNC COMPLETED.');
    } catch (e) {
        console.error('Run failed:', e);
    } finally {
        process.exit(0);
    }
}

run();
