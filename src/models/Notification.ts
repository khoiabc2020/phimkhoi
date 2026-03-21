import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
    title: string;
    message: string;
    link?: string;
    type: "info" | "success" | "warning" | "error";
    isGlobal: boolean;
    user?: mongoose.Types.ObjectId;
    readBy: mongoose.Types.ObjectId[];
    createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    type: { type: String, enum: ["info", "success", "warning", "error"], default: "info" },
    isGlobal: { type: Boolean, default: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdAt: { type: Date, default: Date.now }
});

export const Notification = mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);
