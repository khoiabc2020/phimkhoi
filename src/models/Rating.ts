import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRating extends Document {
    userId: mongoose.Types.ObjectId;
    movieSlug: string;
    value: number; // 1-10
}

const RatingSchema: Schema<IRating> = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        movieSlug: { type: String, required: true, index: true },
        value: { type: Number, required: true, min: 1, max: 10 },
    },
    { timestamps: true }
);

// Unique compound index: User can only rate a movie once
RatingSchema.index({ userId: 1, movieSlug: 1 }, { unique: true });

const Rating: Model<IRating> =
    mongoose.models.Rating || mongoose.model<IRating>("Rating", RatingSchema);

export default Rating;
