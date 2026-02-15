import mongoose, { Schema, Document } from "mongoose";

export interface IUserSettings extends Document {
    userId: mongoose.Types.ObjectId;
    notifications: {
        email: boolean;
        newMovies: boolean;
        newEpisodes: boolean;
    };
    preferences: {
        language: "vi" | "en";
        theme: "dark" | "light" | "auto";
        autoplay: boolean;
        quality: "auto" | "1080p" | "720p" | "480p";
    };
    updatedAt: Date;
}

const UserSettingsSchema = new Schema<IUserSettings>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },
        notifications: {
            email: {
                type: Boolean,
                default: true,
            },
            newMovies: {
                type: Boolean,
                default: true,
            },
            newEpisodes: {
                type: Boolean,
                default: true,
            },
        },
        preferences: {
            language: {
                type: String,
                enum: ["vi", "en"],
                default: "vi",
            },
            theme: {
                type: String,
                enum: ["dark", "light", "auto"],
                default: "dark",
            },
            autoplay: {
                type: Boolean,
                default: true,
            },
            quality: {
                type: String,
                enum: ["auto", "1080p", "720p", "480p"],
                default: "auto",
            },
        },
    },
    {
        timestamps: { createdAt: false, updatedAt: true },
    }
);

export default mongoose.models.UserSettings || mongoose.model<IUserSettings>("UserSettings", UserSettingsSchema);
