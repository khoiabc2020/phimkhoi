import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAppVersion extends Document {
    version: string;
    build: number;
    force_update: boolean;
    download_url: string;
    change_log: string;
    createdAt: Date;
    updatedAt: Date;
}

const AppVersionSchema: Schema = new mongoose.Schema(
    {
        version: {
            type: String,
            required: true,
            default: '1.0.0',
        },
        build: {
            type: Number,
            required: true,
            default: 1,
        },
        force_update: {
            type: Boolean,
            default: false,
        },
        download_url: {
            type: String,
            required: true,
        },
        change_log: {
            type: String,
            required: false,
        },
    },
    {
        timestamps: true,
    }
);

export const AppVersion: Model<IAppVersion> =
    mongoose.models.AppVersion || mongoose.model<IAppVersion>('AppVersion', AppVersionSchema);
