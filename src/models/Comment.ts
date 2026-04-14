import mongoose, { Schema, Document, Model } from "mongoose";
// userId, parentId, likedBy, dislikedBy use String (consistent with NextAuth session.user.id)

export interface IComment extends Document {
    userId: string;
    userName: string;
    userImage?: string;
    movieId: string;
    movieSlug: string;
    episodeName?: string;
    content: string;
    userRole?: string;
    rating?: number; // 1-10 stars (optional)
    parentId?: string; // For replies
    likes: number;
    dislikes: number;
    likedBy: string[];
    dislikedBy: string[];
    isApproved: boolean;
    isReported: boolean;
    reportReason?: string;
    imageUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

const CommentSchema: Schema<IComment> = new Schema(
    {
        userId: { type: String, required: true, index: true },
        userName: { type: String, required: true },
        userImage: { type: String },
        movieId: { type: String, required: true, index: true },
        movieSlug: { type: String, required: true, index: true },
        episodeName: { type: String },
        content: { type: String, required: true, maxlength: 1000 },
        userRole: { type: String },
        rating: { type: Number, min: 1, max: 10 },
        parentId: { type: String, index: true },
        likes: { type: Number, default: 0 },
        dislikes: { type: Number, default: 0 },
        likedBy: [{ type: String }],
        dislikedBy: [{ type: String }],
        isApproved: { type: Boolean, default: true },
        isReported: { type: Boolean, default: false },
        reportReason: { type: String },
        imageUrl: { type: String },
    },
    { timestamps: true }
);

// Compound indexes for efficient queries
CommentSchema.index({ movieSlug: 1, createdAt: -1 });
CommentSchema.index({ movieId: 1, createdAt: -1 });
CommentSchema.index({ userId: 1, createdAt: -1 });
CommentSchema.index({ parentId: 1, createdAt: 1 });
CommentSchema.index({ isApproved: 1, isReported: 1 });
CommentSchema.index({ isApproved: 1, movieSlug: 1, createdAt: -1 }); // Admin moderation queries

const Comment: Model<IComment> =
    mongoose.models.Comment || mongoose.model<IComment>("Comment", CommentSchema);

export default Comment;
