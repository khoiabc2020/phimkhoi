import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
    title: string;
    message: string;
    link?: string;
    type: "info" | "success" | "warning" | "error";
    isGlobal: boolean;
    userId?: string;         // string ID for per-user notifications
    isRead: boolean;         // per-user read flag (only meaningful for isGlobal=false)
    movieSlug?: string;
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
    userId: { type: String, index: true },
    isRead: { type: Boolean, default: false },
    movieSlug: { type: String },
    moviePoster: { type: String },
    newEpisode: { type: String },
    createdAt: { type: Date, default: Date.now },
});

// Compound indexes for per-user and global notification queries
NotificationSchema.index({ userId: 1, isGlobal: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ isGlobal: 1, createdAt: -1 });

export const Notification = mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);
