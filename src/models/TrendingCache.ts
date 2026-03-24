import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * [Elite Performance] Trending Cache Model
 * Stores pre-merged and processed movie lists for high-speed catalog delivery.
 */
export interface ITrendingCache extends Document {
    type: string; // 'phim-bo', 'trung-quoc', 'phim-moi-cap-nhat', etc.
    movies: any[]; // Array of processed Movie objects
    updatedAt: Date;
}

const TrendingCacheSchema: Schema<ITrendingCache> = new Schema(
    {
        type: { type: String, required: true, unique: true, index: true },
        movies: { type: [Schema.Types.Mixed], default: [] },
        updatedAt: { type: Date, default: Date.now },
    },
    { collection: 'trendingcache' }
);

const TrendingCache: Model<ITrendingCache> =
    mongoose.models.TrendingCache || mongoose.model<ITrendingCache>("TrendingCache", TrendingCacheSchema);

export default TrendingCache;
