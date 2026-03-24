import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMovieDetail extends Document {
    _id: string; // Map from external ID or slug
    name: string;
    origin_name: string;
    content: string;
    type: string;
    status: string;
    thumb_url: string;
    poster_url: string;
    is_copyright: boolean;
    sub_docquyen: boolean;
    chieurap: boolean;
    time: string;
    episode_current: string;
    episode_total: string;
    quality: string;
    lang: string;
    notify: string;
    showtimes: string;
    slug: string;
    year: number;
    view: number;
    actor: string[];
    director: string[];
    category: { name: string; slug: string }[];
    country: { name: string; slug: string }[];
    episodes: {
        server_name: string;
        server_data: {
            name: string;
            slug: string;
            filename: string;
            link_embed: string;
            link_m3u8: string;
        }[];
    }[];
    updatedAt: Date;
    tmdbData?: any;
}

const MovieSchema = new Schema(
    {
        _id: { type: String, required: true },
        name: { type: String, required: true, index: true },
        origin_name: { type: String },
        content: { type: String },
        type: { type: String, index: true },
        status: { type: String },
        thumb_url: { type: String },
        poster_url: { type: String },
        chieurap: { type: Boolean, default: false },
        episode_current: { type: String },
        episode_total: { type: String },
        quality: { type: String },
        lang: { type: String },
        slug: { type: String, required: true, unique: true, index: true },
        year: { type: Number, index: true },
        view: { type: Number, default: 0 },
        actor: { type: [String], default: [] },
        director: { type: [String], default: [] },
        category: { type: Array, default: [] },
        country: { type: Array, default: [] },
        episodes: { type: Array, default: [] },
        tmdbData: { type: Schema.Types.Mixed },
        updatedAt: { type: Date, default: Date.now },
    },
    { collection: 'movies', timestamps: true }
);

// Search optimization
MovieSchema.index({ name: 'text', origin_name: 'text' });

const MovieModel: Model<IMovieDetail> =
    mongoose.models.Movie || mongoose.model<IMovieDetail>("Movie", MovieSchema);

export default MovieModel;
