import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
    title: string;
    message: string;
    link?: string;
    type: "info" | "success" | "warning" | "error";
    isGlobal: boolean;
    user?: mongoose.Types.ObjectId;
    userId?: string;        // string ID for per-user notifications (from notify-favorites.mjs)
    readBy: mongoose.Types.ObjectId[];
    isRead: boolean;        // per-user read flag
    movieSlug?: string;     // for movie update notifications
    moviePoster?: string;
    newEpisode?: string;
    createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    type: { type: String, enum: ["info", "success", "warning", "error"], default: "info" },
    isGlobal: { type: Boolean, default: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    userId: { type: String, index: true },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isRead: { type: Boolean, default: false },
    movieSlug: { type: String },
    moviePoster: { type: String },
    newEpisode: { type: String },
    createdAt: { type: Date, default: Date.now }
});

// Index for per-user queries
NotificationSchema.index({ userId: 1, isGlobal: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });

export const Notification = mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);
