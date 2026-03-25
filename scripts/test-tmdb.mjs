import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: '.env.local' });

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const MONGODB_URI = process.env.MONGODB_URI;

console.log("TMDB_API_KEY exists:", !!TMDB_API_KEY);
console.log("MONGODB_URI exists:", !!MONGODB_URI);

async function testTMDB() {
    const url = `https://api.themoviedb.org/3/trending/all/day?api_key=${TMDB_API_KEY}&language=vi-VN`;
    console.log("Fetching TMDB Trending from:", url.replace(TMDB_API_KEY, '***'));
    
    try {
        const res = await fetch(url);
        console.log("Status:", res.status);
        const data = await res.json();
        if (data.results) {
            console.log(`Success! Found ${data.results.length} results.`);
            console.log("Top 3 movies:", data.results.slice(0, 3).map(m => m.title || m.name).join(', '));
        } else {
            console.log("Error data:", data);
        }
    } catch (err) {
        console.error("Fetch error:", err.message);
    }
}

async function checkDB() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB.");
        
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("Collections:", collections.map(c => c.name).join(', '));
        
        const TrendingCache = mongoose.connection.db.collection('trendingcaches');
        const count = await TrendingCache.countDocuments();
        console.log(`TrendingCache count: ${count}`);
        
        const docs = await TrendingCache.find({}).toArray();
        docs.forEach(doc => {
            console.log(`- Type: ${doc.type}, Movies: ${doc.movies?.length || 0}, Updated: ${doc.updatedAt}`);
        });
        
    } catch (err) {
        console.error("DB error:", err.message);
    } finally {
        await mongoose.disconnect();
    }
}

async function run() {
    await testTMDB();
    await checkDB();
}

run();
