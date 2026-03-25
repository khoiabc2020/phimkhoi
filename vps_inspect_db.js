const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve('.env.local');
const env = fs.readFileSync(envPath, 'utf8');
const uri = env.match(/MONGODB_URI=(.+)/)[1].trim();

async function run() {
    try {
        await mongoose.connect(uri);
        const list = await mongoose.connection.db.collection('trendingcaches').find({}).project({ type: 1, movieCount: { $size: "$movies" } }).toArray();
        console.log("TrendingCache Stats:", JSON.stringify(list, null, 2));
        
        const slugsToCheck = ['trung-quoc', 'han-quoc', 'phim-bo', 'phim-le'];
        for (const s of slugsToCheck) {
            const entry = await mongoose.connection.db.collection('trendingcaches').findOne({ type: s });
            console.log(`Checking [${s}]: ${entry ? 'FOUND' : 'MISSING'} (${entry?.movies?.length || 0} movies)`);
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
