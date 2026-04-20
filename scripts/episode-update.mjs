#!/usr/bin/env node
/**
 * PhimKhoi Fast Episode Update Script
 * Only syncs episodes for currently-airing series.
 * Runs in ~2-3 minutes vs 67 minutes for full sync.
 * Run: node scripts/episode-update.mjs
 */

import mongoose from 'mongoose';
import https from 'https';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const KKPHIM_API = 'https://phimapi.com';
const NGUONC_API = 'https://phim.nguonc.com';
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('[episode-update] MONGODB_URI not found in .env.local');
    process.exit(1);
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── Schema (inline, same pattern as daily-sync.mjs) ─────────────────────────
const movieSchema = new mongoose.Schema({
    slug: { type: String, unique: true, index: true },
    type: String,
    status: String,
    episode_current: String,
    episode_total: String,
    episodes: { type: Array, default: [] },
    updatedAt: Date,
    lastSynced: { type: Date, default: Date.now },
}, { strict: false });

const Movie = mongoose.models.Movie || mongoose.model('Movie', movieSchema, 'movies');

// ── Helpers ──────────────────────────────────────────────────────────────────
function fetchJson(url, timeout = 12000) {
    return new Promise((resolve) => {
        const req = https.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PhimKhoi-EpisodeSync/1.0)' },
            timeout,
        }, (res) => {
            if (res.statusCode === 429) { resolve({ rateLimited: true }); return; }
            if (res.statusCode !== 200) { resolve(null); return; }
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(null); } });
        });
        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
    });
}

// Merge episodes: keep server with most episodes, add new servers
function mergeEpisodes(incoming, existing) {
    if (!incoming || incoming.length === 0) return existing || [];
    if (!existing || existing.length === 0) return incoming;
    const merged = [...existing];
    for (const inSrv of incoming) {
        const srvName = inSrv.server_name || '';
        const idx = merged.findIndex(e => e.server_name === srvName);
        const inCount = Array.isArray(inSrv.server_data) ? inSrv.server_data.length : 0;
        if (idx >= 0) {
            const exCount = Array.isArray(merged[idx].server_data) ? merged[idx].server_data.length : 0;
            if (inCount >= exCount) merged[idx] = inSrv; // Replace only if has more or equal episodes
        } else {
            merged.push(inSrv); // New server — add it
        }
    }
    return merged;
}

async function getKKPhimEpisodes(slug) {
    const data = await fetchJson(`${KKPHIM_API}/phim/${slug}`);
    if (!data?.status || !data?.movie) return null;
    return {
        episodes: data.episodes || [],
        episode_current: data.movie.episode_current || '',
        episode_total: data.movie.episode_total || '',
    };
}

async function getNguonCEpisodes(slug) {
    const data = await fetchJson(`${NGUONC_API}/api/v3/movie/${slug}`);
    if (data?.status !== 'success' || !data?.movie) return null;
    const eps = (data.movie.episodes || []).map(ep => ({
        server_name: `NguonC # ${ep.server_name || '#1'}`,
        server_data: (ep.items || []).map(item => ({
            name: item.name || '',
            slug: item.slug || '',
            filename: item.filename || '',
            link_embed: item.embed || '',
            link_m3u8: item.m3u8 || '',
        })),
    }));
    return {
        episodes: eps,
        episode_current: data.movie.episode_current || '',
    };
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function run() {
    const startedAt = Date.now();
    console.log(`[episode-update] Starting at ${new Date().toISOString()}`);

    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('[episode-update] Connected to MongoDB');

    // Find ongoing series updated in last 45 days (active series only)
    const ongoingMovies = await Movie.find({
        type: { $in: ['series', 'hoathinh', 'tvshows'] },
        episode_current: { $not: /hoàn tất|Hoàn Tất|full/i },
        updatedAt: { $gte: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) },
    }, 'slug episode_current episodes').lean();

    console.log(`[episode-update] Found ${ongoingMovies.length} active series to check`);

    let updated = 0, noChange = 0, errors = 0;

    const BATCH = 8;
    for (let i = 0; i < ongoingMovies.length; i += BATCH) {
        const batch = ongoingMovies.slice(i, i + BATCH);

        await Promise.all(batch.map(async (movie) => {
            try {
                const [kkData, ncData] = await Promise.all([
                    getKKPhimEpisodes(movie.slug),
                    getNguonCEpisodes(movie.slug),
                ]);

                if (!kkData && !ncData) { errors++; return; }

                const existingEpisodes = Array.isArray(movie.episodes) ? movie.episodes : [];
                let newEpisodes = existingEpisodes;
                let newEpCurrent = movie.episode_current || '';

                if (kkData) {
                    newEpisodes = mergeEpisodes(kkData.episodes, newEpisodes);
                    if (kkData.episode_current) newEpCurrent = kkData.episode_current;
                }
                if (ncData) {
                    newEpisodes = mergeEpisodes(ncData.episodes, newEpisodes);
                }

                const oldCount = existingEpisodes.reduce((s, srv) => s + (srv.server_data?.length || 0), 0);
                const newCount = newEpisodes.reduce((s, srv) => s + (srv.server_data?.length || 0), 0);
                const epChanged = newEpCurrent !== movie.episode_current;

                if (newCount === oldCount && !epChanged) { noChange++; return; }

                await Movie.updateOne(
                    { slug: movie.slug },
                    { $set: { episodes: newEpisodes, episode_current: newEpCurrent, lastSynced: new Date() } }
                );
                updated++;
                if (newCount !== oldCount) {
                    console.log(`  ✓ ${movie.slug}: ${oldCount} → ${newCount} eps (${newEpCurrent})`);
                }
            } catch (err) {
                errors++;
            }
        }));

        if (i + BATCH < ongoingMovies.length) await sleep(200);
    }

    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log(`[episode-update] Done in ${elapsed}s — updated: ${updated}, no-change: ${noChange}, errors: ${errors}`);

    await mongoose.disconnect();
    process.exit(0);
}

run().catch(err => {
    console.error('[episode-update] Fatal error:', err);
    process.exit(1);
});
