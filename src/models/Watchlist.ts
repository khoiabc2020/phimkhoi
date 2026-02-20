import mongoose, { Schema, Document } from "mongoose";

export interface IWatchlist extends Document {
    userId: mongoose.Types.ObjectId;
    movieId: string;
    movieSlug: string;
    movieName: string;
    movieOriginName: string;
    moviePoster: string;
    movieYear: number;
    movieQuality: string;
    movieCategories: string[];
    addedAt: Date;
}

const WatchlistSchema = new Schema<IWatchlist>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        movieId: {
            type: String,
            required: true,
        },
        movieSlug: {
            type: String,
            required: true,
        },
        movieName: {
            type: String,
            required: true,
        },
        movieOriginName: {
            type: String,
            default: "",
        },
        moviePoster: {
            type: String,
            required: true,
        },
        movieYear: {
            type: Number,
            required: true,
        },
        movieQuality: {
            type: String,
            default: "HD",
        },
        movieCategories: {
            type: [String],
            default: [],
        },
        addedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: false,
    }
);

// Unique per user+movie
WatchlistSchema.index({ userId: 1, movieId: 1 }, { unique: true });
WatchlistSchema.index({ userId: 1, addedAt: -1 });

export default mongoose.models.Watchlist || mongoose.model<IWatchlist>("Watchlist", WatchlistSchema);
