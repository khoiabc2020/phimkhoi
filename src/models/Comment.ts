import mongoose, { Schema, Document, Model } from "mongoose";

export interface IComment extends Document {
    userId: mongoose.Types.ObjectId;
    userName: string;
    userImage?: string;
    movieId: string;
    movieSlug: string;
    content: string;
    rating?: number; // 1-10 stars (optional)
    parentId?: mongoose.Types.ObjectId; // For replies
    likes: number;
    dislikes: number;
    likedBy: mongoose.Types.ObjectId[];
    dislikedBy: mongoose.Types.ObjectId[];
    isApproved: boolean;
    isReported: boolean;
    reportReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

const CommentSchema: Schema<IComment> = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        userName: { type: String, required: true },
        userImage: { type: String },
        movieId: { type: String, required: true, index: true },
        movieSlug: { type: String, required: true, index: true },
        content: { type: String, required: true, maxlength: 1000 },
        rating: { type: Number, min: 1, max: 10 },
        parentId: { type: Schema.Types.ObjectId, ref: "Comment", index: true },
        likes: { type: Number, default: 0 },
        dislikes: { type: Number, default: 0 },
        likedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
        dislikedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
        isApproved: { type: Boolean, default: true },
        isReported: { type: Boolean, default: false },
        reportReason: { type: String },
    },
    { timestamps: true }
);

// Compound indexes for efficient queries
CommentSchema.index({ movieSlug: 1, createdAt: -1 });
CommentSchema.index({ movieId: 1, createdAt: -1 });
CommentSchema.index({ userId: 1, createdAt: -1 });
CommentSchema.index({ parentId: 1, createdAt: 1 });
CommentSchema.index({ isApproved: 1, isReported: 1 });

const Comment: Model<IComment> =
    mongoose.models.Comment || mongoose.model<IComment>("Comment", CommentSchema);

export default Comment;
