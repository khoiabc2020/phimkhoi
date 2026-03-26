const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function run() {
    try {
        const envPath = path.resolve('.env.local');
        const env = fs.readFileSync(envPath, 'utf8');
        const uri = env.match(/MONGODB_URI=(.+)/)[1].trim();
        
        await mongoose.connect(uri);
        const db = mongoose.connection.db;
        const movies = db.collection('movies');

        console.log("=== DATABASE AUDIT REPORT ===");
        
        // 1. Total Stats
        const total = await movies.countDocuments();
        console.log(`Total Movies: ${total}`);

        // 2. Duplicates Check
        const duplicates = await movies.aggregate([
            { $group: { _id: "$slug", count: { $sum: 1 } } },
            { $filter: { input: "$_id", as: "item", cond: { $gt: ["$count", 1] } } }
        ]).toArray();
        console.log(`Duplicate Slugs: ${duplicates.length}`);

        // 3. Missing Metadata
        const missingBackdrop = await movies.countDocuments({ $or: [{ thumb_url: "" }, { thumb_url: { $exists: false } }] });
        const missingPoster = await movies.countDocuments({ $or: [{ poster_url: "" }, { poster_url: { $exists: false } }] });
        console.log(`Missing Backdrops: ${missingBackdrop}`);
        console.log(`Missing Posters: ${missingPoster}`);

        // 4. Trailer Leakage Check
        const trailers = await movies.countDocuments({ 
            $or: [
                { name: /Trailer|Teaser/i },
                { content: /Trailer|Teaser/i }
            ]
        });
        console.log(`Potential Trailers in Collection: ${trailers}`);

        // 5. Regional Distribution
        const korea = await movies.countDocuments({ "country.slug": "han-quoc" });
        const china = await movies.countDocuments({ "country.slug": "trung-quoc" });
        console.log(`Korean Movies: ${korea}`);
        console.log(`Chinese Movies: ${china}`);

        // 6. Trending Cache Status
        const caches = await db.collection('trendingcaches').find({}).project({ type: 1, count: { $size: "$movies" } }).toArray();
        console.log("TrendingCache Coverage:", JSON.stringify(caches, null, 2));

        process.exit(0);
    } catch (e) {
        console.error("Audit failed:", e);
        process.exit(1);
    }
}

run();
