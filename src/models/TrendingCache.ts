import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITrendingCache extends Document {
    type: string;
    movies: any[];
    updatedAt: Date;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TrendingCacheSchema = new Schema(
    {
        type: { type: String, required: true, unique: true, index: true },
        movies: { type: Array, default: [] },
        updatedAt: { type: Date, default: Date.now },
    },
    { collection: 'trendingcaches' }
);

const TrendingCache: Model<ITrendingCache> =
    mongoose.models.TrendingCache || mongoose.model<ITrendingCache>("TrendingCache", TrendingCacheSchema);

export default TrendingCache;
