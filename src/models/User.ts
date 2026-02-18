import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    image?: string;
    role: "user" | "admin";
    favorites: string[]; // List of movie slugs
    watchlist: string[]; // List of movie slugs for Watch Later
    history: {
        slug: string;
        episode?: string;
        timestamp: number;
        progress: number; // Seconds watched
    }[];
    resetPasswordToken?: string;
    resetPasswordExpires?: number;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String },
        image: { type: String },
        role: { type: String, enum: ["user", "admin"], default: "user" },
        favorites: [{ type: String }],
        watchlist: [{ type: String }],
        history: [
            {
                slug: { type: String, required: true },
                episode: { type: String },
                timestamp: { type: Number, default: Date.now },
                progress: { type: Number, default: 0 },
            },
        ],
        resetPasswordToken: { type: String },
        resetPasswordExpires: { type: Date },
    },
    { timestamps: true }
);

// Prevent overwrite model error
const User: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
