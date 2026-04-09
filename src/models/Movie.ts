import mongoose, { Schema, Model } from "mongoose";

export interface IMovieDetail {
    _id: string;
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
    lastSynced?: Date;
    tmdbData?: any;
}

// Fields needed for movie card / list views — excludes heavy fields (episodes, content, tmdbData, actor, director)
export const LIST_PROJECTION = {
    _id: 1, name: 1, origin_name: 1, slug: 1,
    thumb_url: 1, poster_url: 1,
    year: 1, quality: 1, type: 1, status: 1,
    episode_current: 1, episode_total: 1,
    category: 1, country: 1,
    chieurap: 1, sub_docquyen: 1, lang: 1,
    view: 1, updatedAt: 1,
} as const;

const MovieSchema = new Schema(
    {
        _id: { type: String, required: true },
        name: { type: String, required: true },
        origin_name: { type: String },
        content: { type: String },
        type: { type: String },
        status: { type: String },
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
        slug: { type: String, required: true, unique: true },
        year: { type: Number },
        view: { type: Number, default: 0 },
        actor: { type: [String], default: [] },
        director: { type: [String], default: [] },
        category: { type: Array, default: [] },
        country: { type: Array, default: [] },
        episodes: { type: Array, default: [] },
        tmdbData: { type: Schema.Types.Mixed },
        lastSynced: { type: Date },
    },
    { collection: 'movies', timestamps: true }
);

// ── Single-field indexes ──────────────────────────────────────────────────────
// Note: slug index is created automatically by unique:true on the field definition
MovieSchema.index({ type: 1 });
MovieSchema.index({ year: 1 });
MovieSchema.index({ updatedAt: -1 });
MovieSchema.index({ lastSynced: -1 });

// ── Compound indexes for common listing queries ───────────────────────────────
// Category listing: /the-loai/hanh-dong  (+ optional year filter)
MovieSchema.index({ "category.slug": 1, updatedAt: -1 });
MovieSchema.index({ "category.slug": 1, year: -1, updatedAt: -1 });

// Country listing: /quoc-gia/han-quoc  (+ optional year filter)
MovieSchema.index({ "country.slug": 1, updatedAt: -1 });
MovieSchema.index({ "country.slug": 1, year: -1, updatedAt: -1 });

// Type listing: /danh-sach/phim-bo, phim-le  (+ optional year/category)
MovieSchema.index({ type: 1, updatedAt: -1 });
MovieSchema.index({ type: 1, year: -1, updatedAt: -1 });

// Year-only filter
MovieSchema.index({ year: -1, updatedAt: -1 });

// ── Text search ───────────────────────────────────────────────────────────────
MovieSchema.index({ name: 'text', origin_name: 'text' });

const MovieModel: Model<IMovieDetail> =
    mongoose.models.Movie || mongoose.model<IMovieDetail>("Movie", MovieSchema);

export default MovieModel;
