import mongoose, { Schema, Document } from "mongoose";

export interface IWatchHistory extends Document {
    userId: string;
    movieId: string;
    movieSlug: string;
    movieName: string;
    movieOriginName: string; // English name
    moviePoster: string;
    episodeSlug: string;
    episodeName: string;
    progress: number; // 0-100
    duration: number; // seconds
    currentTime: number; // seconds
    lastWatched: Date;
    createdAt: Date;
    updatedAt: Date;
}

const WatchHistorySchema = new Schema<IWatchHistory>(
    {
        userId: {
            type: String,
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
        episodeSlug: {
            type: String,
            required: true,
        },
        episodeName: {
            type: String,
            required: true,
        },
        progress: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        duration: {
            type: Number,
            default: 0,
        },
        currentTime: {
            type: Number,
            default: 0,
        },
        lastWatched: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient queries
WatchHistorySchema.index({ userId: 1, movieId: 1, episodeSlug: 1 }, { unique: true });
WatchHistorySchema.index({ userId: 1, lastWatched: -1 });

export default mongoose.models.WatchHistory || mongoose.model<IWatchHistory>("WatchHistory", WatchHistorySchema);
