import mongoose, { Schema, Document } from "mongoose";

export interface IFavorite extends Document {
    userId: mongoose.Types.ObjectId;
    movieId: string;
    movieSlug: string;
    movieName: string;
    movieOriginName: string; // English name
    moviePoster: string;
    movieYear: number;
    movieQuality: string;
    movieCategories: string[];
    addedAt: Date;
}

const FavoriteSchema = new Schema<IFavorite>(
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

// Compound index for unique favorites and efficient queries
FavoriteSchema.index({ userId: 1, movieId: 1 }, { unique: true });
FavoriteSchema.index({ userId: 1, addedAt: -1 });

export default mongoose.models.Favorite || mongoose.model<IFavorite>("Favorite", FavoriteSchema);
