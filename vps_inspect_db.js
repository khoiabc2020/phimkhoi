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
        console.log("TrendingCache Types:", JSON.stringify(list, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
