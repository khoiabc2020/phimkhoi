import mongoose from 'mongoose';

const trendingSchema = new mongoose.Schema({
    type: { type: String, required: true, index: true },
    movies: { type: Array, default: [] },
    updatedAt: { type: Date, default: Date.now }
}, { 
    strict: false,
    collection: 'trendingcache'
});

interface ITrendingCache extends mongoose.Document {
    type: string;
    movies: any[];
    updatedAt: Date;
}

const TrendingCache = (mongoose.models.TrendingCache as mongoose.Model<ITrendingCache>) || 
                      mongoose.model<ITrendingCache>('TrendingCache', trendingSchema);

export default TrendingCache;
