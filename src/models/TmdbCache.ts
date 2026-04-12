import mongoose, { Schema, Model } from "mongoose";

const TmdbCacheSchema = new Schema(
    {
        slug:      { type: String, required: true, unique: true, index: true },
        data:      { type: Schema.Types.Mixed, default: null },   // tmdbDetails
        epImages:  { type: Schema.Types.Mixed, default: null },   // episode images map
        trailerKey: { type: String, default: null },
        cachedAt:  { type: Date, default: Date.now },
        // TTL: MongoDB auto-deletes docs 7 days after cachedAt
        expiresAt: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), index: { expireAfterSeconds: 0 } },
    },
    { collection: "tmdbcaches" }
);

const TmdbCache: Model<any> =
    mongoose.models.TmdbCache || mongoose.model("TmdbCache", TmdbCacheSchema);

export default TmdbCache;
