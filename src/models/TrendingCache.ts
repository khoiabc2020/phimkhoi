import mongoose from 'mongoose';

const trendingSchema = new mongoose.Schema({
    type: { type: String, required: true, index: true },
    movies: { type: Array, default: [] },
    updatedAt: { type: Date, default: Date.now }
}, { 
    strict: false,
    collection: 'trendingcache'
});

const TrendingCache = mongoose.models.TrendingCache || mongoose.model('TrendingCache', trendingSchema);

export default TrendingCache;
