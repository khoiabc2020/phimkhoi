import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

const SLUGS = [
    // Phim Han
    "nghe-thuat-lua-doi-cua-sarah",
    "khi-cuoc-doi-cho-ban-qua-quyt",
    "tieng-yeu-nay-anh-dich-duoc-khong",
    "ban-trai-theo-yeu-cau",
    "trao-em-ca-vu-tru",
    // Phim Trung
    "duong-cung-ky-an-thanh-vu-phong-minh",
    "xin-chao-1983",
    "con-ra-the-thong-gi-nua",
    "bach-nguyet-phan-tinh",
    "bui-hoa-hong",
    "dai-mong-quy-ly",
    "giang-ho-da-vu-thap-nien-dang",
    "mac-nhan-tang-kieu",
    "ngoc-minh-tra-cot",
    "truc-ngoc"
];

function fetchJson(url) {
    return new Promise((resolve) => {
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

async function main() {
    if (!MONGODB_URI) { console.error("No MONGODB_URI"); return; }
    await mongoose.connect(MONGODB_URI);
    console.log("✓ Connected to MongoDB");

    for (const slug of SLUGS) {
        console.log(`Syncing [${slug}]...`);
        // Try phimapi.com
        const res = await fetchJson(`https://phimapi.com/phim/${slug}`);
        if (res && res.status && res.movie) {
            const m = res.movie;
            const normalized = {
                name: m.name,
                slug: m.slug,
                origin_name: m.origin_name,
                content: m.content,
                type: m.type,
                status: m.status,
                thumb_url: m.thumb_url,
                poster_url: m.poster_url,
                time: m.time,
                episode_current: m.episode_current,
                quality: m.quality,
                lang: m.lang,
                year: m.year,
                actor: m.actor,
                category: m.category,
                country: m.country,
                updatedAt: new Date()
            };
            await mongoose.connection.db.collection('movies').updateOne(
                { slug: m.slug },
                { $set: normalized },
                { upsert: true }
            );
            console.log(`  ✓ Saved ${slug}`);
        } else {
            console.warn(`  ✗ Failed to find ${slug}`);
        }
    }
    await mongoose.disconnect();
    console.log("Done!");
}

main();
