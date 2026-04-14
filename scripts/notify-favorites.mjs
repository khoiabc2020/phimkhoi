#!/usr/bin/env node
/**
 * notify-favorites.mjs
 * Chạy sau mỗi lần sync: quét favorites, tạo Notification khi có tập mới
 *
 * Logic:
 * 1. Lấy tất cả favorites từ DB, nhóm theo movieSlug
 * 2. Với mỗi slug, đọc episode_current từ Movie collection (đã sync sẵn)
 * 3. Nếu episode_current khác lastEpisode → tạo Notification per user + update lastEpisode
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error('[notify-favorites] MONGODB_URI not set, skipping.');
    process.exit(0);
}

function log(msg) {
    console.log(`[${new Date().toISOString()}] [notify-favorites] ${msg}`);
}

// ── Models ───────────────────────────────────────────────────────────────────

const favoriteSchema = new mongoose.Schema({
    userId: String,
    movieSlug: String,
    movieName: String,
    moviePoster: String,
    lastEpisode: { type: String, default: '' },
}, { strict: false });
const Favorite = mongoose.models?.Favorite || mongoose.model('Favorite', favoriteSchema, 'favorites');

const movieSchema = new mongoose.Schema({
    slug: String,
    name: String,
    episode_current: String,
    type: String,
    thumb_url: String,
    poster_url: String,
}, { strict: false });
const Movie = mongoose.models?.Movie || mongoose.model('Movie', movieSchema, 'movies');

const notifSchema = new mongoose.Schema({
    title: String,
    message: String,
    link: String,
    type: { type: String, default: 'info' },
    isGlobal: { type: Boolean, default: false },
    userId: String,       // per-user notification
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
}, { strict: false });
const Notification = mongoose.models?.Notification || mongoose.model('Notification', notifSchema, 'notifications');

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: Number(process.env.MONGODB_CONNECT_TIMEOUT_MS || 8000),
        bufferCommands: false,
    });
    log('Connected to MongoDB');

    // 1. Lấy tất cả favorites từ DB
    const allFavorites = await Favorite.find({}, 'userId movieSlug movieName moviePoster lastEpisode').lean();
    if (!allFavorites.length) {
        log('No favorites found, skipping.');
        await mongoose.disconnect();
        return;
    }
    log(`Found ${allFavorites.length} favorites from ${new Set(allFavorites.map(f => String(f.userId))).size} users`);

    // 2. Nhóm theo slug để giảm số lần query Movie collection
    const slugSet = new Set(allFavorites.map(f => f.movieSlug).filter(Boolean));
    const movieDocs = await Movie.find(
        { slug: { $in: Array.from(slugSet) } },
        'slug name episode_current type thumb_url poster_url'
    ).lean();

    const movieBySlug = new Map();
    for (const m of movieDocs) movieBySlug.set(m.slug, m);
    log(`Loaded ${movieDocs.length} movie docs for ${slugSet.size} unique slugs`);

    // 3. Detect changes
    const toNotify = []; // { userId, movieSlug, movieName, oldEp, newEp, poster }
    const toUpdateLastEp = []; // { favoriteId, newEp }

    for (const fav of allFavorites) {
        const movie = movieBySlug.get(fav.movieSlug);
        if (!movie) continue;

        const currentEp = String(movie.episode_current || '').trim();
        const lastEp = String(fav.lastEpisode || '').trim();

        // Bỏ qua phim lẻ (Full) — không cần thông báo từng tập
        const isMovie = movie.type === 'single' || (currentEp.toLowerCase().includes('full') && lastEp === '');
        if (isMovie && lastEp === '') {
            // Set lastEpisode ngay lần đầu để tránh spam notification
            toUpdateLastEp.push({ id: fav._id, newEp: currentEp });
            continue;
        }

        if (!currentEp || currentEp === lastEp) continue;

        // Có tập mới!
        toNotify.push({
            userId: String(fav.userId),
            movieSlug: fav.movieSlug,
            movieName: movie.name || fav.movieName,
            poster: movie.poster_url || movie.thumb_url || fav.moviePoster || '',
            oldEp: lastEp,
            newEp: currentEp,
        });
        toUpdateLastEp.push({ id: fav._id, newEp: currentEp });
    }

    log(`Detected ${toNotify.length} updates, ${toUpdateLastEp.length} lastEpisode records to update`);

    // 4. Tạo Notification documents (batch)
    if (toNotify.length > 0) {
        const notifDocs = toNotify.map(n => ({
            title: `${n.movieName} có tập mới!`,
            message: `Đã cập nhật ${n.newEp}${n.oldEp ? ` (trước: ${n.oldEp})` : ''}. Xem ngay!`,
            link: `/phim/${n.movieSlug}`,
            type: 'info',
            isGlobal: false,
            userId: n.userId,
            movieSlug: n.movieSlug,
            moviePoster: n.poster,
            newEpisode: n.newEp,
            isRead: false,
            createdAt: new Date(),
        }));

        // Tránh duplicate: check userId+slug+newEpisode — vĩnh viễn (không dùng time window)
        const existingKeys = new Set(
            (await Notification.find({
                userId: { $in: [...new Set(toNotify.map(n => n.userId))] },
                movieSlug: { $in: [...new Set(toNotify.map(n => n.movieSlug))] },
            }, 'userId movieSlug newEpisode').lean())
            .map((n: any) => `${n.userId}:${n.movieSlug}:${n.newEpisode || ''}`)
        );

        const newNotifs = notifDocs.filter(n => !existingKeys.has(`${n.userId}:${n.movieSlug}:${n.newEpisode}`));
        if (newNotifs.length > 0) {
            await Notification.insertMany(newNotifs, { ordered: false });
            log(`Created ${newNotifs.length} new notifications (${notifDocs.length - newNotifs.length} skipped as duplicates)`);
        } else {
            log('All notifications already sent within 12h window, skipping');
        }
    }

    // 5. Update lastEpisode trong Favorite (bulk write)
    if (toUpdateLastEp.length > 0) {
        const bulkOps = toUpdateLastEp.map(({ id, newEp }) => ({
            updateOne: {
                filter: { _id: id },
                update: { $set: { lastEpisode: newEp } },
            },
        }));
        const bulkResult = await Favorite.bulkWrite(bulkOps, { ordered: false });
        log(`Updated lastEpisode for ${bulkResult.modifiedCount} favorites`);
    }

    // 6. Dọn notification cũ hơn 30 ngày (keep DB clean)
    const oldCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const deleted = await Notification.deleteMany({ isGlobal: false, createdAt: { $lt: oldCutoff } });
    if (deleted.deletedCount > 0) log(`Pruned ${deleted.deletedCount} old notifications (>30 days)`);

    // 7. Dedup existing notifications: per user+slug+episode, keep only the newest
    const allPersonal = await Notification.find({ isGlobal: false }, '_id userId movieSlug newEpisode createdAt').sort({ createdAt: -1 }).lean();
    const keepIds = new Set();
    const dupKeys = new Set();
    for (const n of allPersonal) {
        const key = `${n.userId}:${n.movieSlug}:${n.newEpisode || ''}`;
        if (!dupKeys.has(key)) {
            dupKeys.add(key);
            keepIds.add(String(n._id));
        }
    }
    const dupIds = allPersonal.map((n: any) => n._id).filter((id: any) => !keepIds.has(String(id)));
    if (dupIds.length > 0) {
        const dedupResult = await Notification.deleteMany({ _id: { $in: dupIds } });
        log(`Removed ${dedupResult.deletedCount} duplicate notifications from DB`);
    }

    await mongoose.disconnect();
    log('Done.');
}

main().catch(err => {
    console.error('[notify-favorites] Fatal error:', err);
    mongoose.disconnect().catch(() => {});
    process.exit(1);
});
