import mongoose, { Model, Schema } from "mongoose";

export interface ISubtitle {
    _id: string;
    movieId?: string;
    movieSlug: string;
    movieName: string;
    episodeSlug: string;
    episodeName?: string;
    language: string;
    label: string;
    format: "srt" | "vtt" | "ass" | "ssa" | "txt";
    sourceType: "url" | "content" | "external";
    sourceName?: string;
    url?: string;
    content?: string;
    isDefault?: boolean;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const SubtitleSchema = new Schema(
    {
        _id: { type: String, required: true },
        movieId: { type: String, index: true },
        movieSlug: { type: String, required: true, index: true },
        movieName: { type: String, required: true, index: true },
        episodeSlug: { type: String, required: true, index: true },
        episodeName: { type: String, default: "" },
        language: { type: String, required: true, index: true },
        label: { type: String, required: true },
        format: { type: String, enum: ["srt", "vtt", "ass", "ssa", "txt"], default: "srt" },
        sourceType: { type: String, enum: ["url", "content", "external"], default: "url" },
        sourceName: { type: String, default: "" },
        url: { type: String, default: "" },
        content: { type: String, default: "" },
        isDefault: { type: Boolean, default: false },
        notes: { type: String, default: "" },
    },
    { collection: "subtitles", timestamps: true },
);

SubtitleSchema.index({ movieSlug: 1, episodeSlug: 1, language: 1 }, { unique: true });
SubtitleSchema.index({ movieName: "text", movieSlug: "text", episodeSlug: "text", label: "text" });
SubtitleSchema.index({ updatedAt: -1 });

const SubtitleModel: Model<ISubtitle> =
    mongoose.models.Subtitle || mongoose.model<ISubtitle>("Subtitle", SubtitleSchema);

export default SubtitleModel;
