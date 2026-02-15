import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMovie extends Document {
    name: string;
    slug: string;
    origin_name: string;
    content: string;
    type: string;
    status: string;
    thumb_url: string;
    poster_url: string;
    is_copyright: boolean;
    sub_docquyen: boolean;
    chieurap: boolean;
    trailer_url: string;
    time: string;
    episode_current: string;
    episode_total: string;
    quality: string;
    lang: string;
    notify: string;
    showtimes: string;
    year: number;
    view: number;
    actor: string[];
    director: string[];
    category: { id: string; name: string; slug: string }[];
    country: { id: string; name: string; slug: string }[];
    updatedAt: Date;
}

const MovieSchema: Schema = new Schema(
    {
        name: { type: String, required: true, index: true },
        slug: { type: String, required: true, unique: true, index: true },
        origin_name: { type: String },
        content: { type: String },
        type: { type: String, index: true }, // phim-le, phim-bo, hoat-hinh, tv-shows
        status: { type: String, default: 'ongoing' }, // completed, ongoing, trailer
        thumb_url: { type: String },
        poster_url: { type: String },
        is_copyright: { type: Boolean, default: false },
        sub_docquyen: { type: Boolean, default: false },
        chieurap: { type: Boolean, default: false },
        trailer_url: { type: String },
        time: { type: String },
        episode_current: { type: String },
        episode_total: { type: String },
        quality: { type: String },
        lang: { type: String },
        notify: { type: String },
        showtimes: { type: String },
        year: { type: Number, index: true },
        view: { type: Number, default: 0, index: true },
        actor: { type: [String], default: [] },
        director: { type: [String], default: [] },
        category: [{
            id: String,
            name: String,
            slug: { type: String, index: true }
        }],
        country: [{
            id: String,
            name: String,
            slug: { type: String, index: true }
        }],
    },
    {
        timestamps: true,
    }
);

// Prevent overwrite if model already exists
const Movie: Model<IMovie> = mongoose.models.Movie || mongoose.model<IMovie>("Movie", MovieSchema);

export default Movie;
