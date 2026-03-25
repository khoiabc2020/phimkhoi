import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const koreanCount = await mongoose.connection.db.collection('movies').countDocuments({ 'country.slug': 'han-quoc' });
    const tmdbCount = await mongoose.connection.db.collection('movies').countDocuments({ 'tmdb_id': { $exists: true } });
    const trending = await mongoose.connection.db.collection('trendingcaches').find({}).toArray();
    console.log(JSON.stringify({ 
        koreanCount, 
        tmdbCount,
        trending: trending.map(t => ({ type: t.type, count: t.movies?.length, updatedAt: t.updatedAt })) 
    }, null, 2));
    process.exit(0);
});
